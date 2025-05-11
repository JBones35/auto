import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { MailService } from '../../mail/mail.service.js';
import { Auto } from '../entity/auto.entity.js';
import { AutoFile } from '../entity/autoFile.entity.js';
import { Motor } from '../entity/motor.entity.js';
import { Reperatur } from '../entity/reperatur.entity.js';
import { AutoReadService } from './auto-read.service.js';
import {
    FahrgestellnummerExistsException,
    VersionInvalidException,
    VersionOutdatedException,
} from './exceptions.js';
import { getLogger } from '../../logger/logger.js';

/** Typdefinitionen zum Aktualisieren eines Autos mit `update`. */
export type UpdateParams = {
    /** ID des zu aktualisierenden Autos. */
    readonly id: number | undefined;
    /** Auto-Objekt mit den aktualisierten Werten. */
    readonly auto: Auto;
    /** Versionsnummer für die aktualisierenden Werte. */
    readonly version: string;
};

/**
 * Die Klasse `AutoWriteService` implementiert den Anwendungskern für das
 * Schreiben von Autos und greift mit _TypeORM_ auf die DB zu.
 */
@Injectable()
export class AutoWriteService {
    private static readonly VERSION_PATTERN = /^"\d{1,3}"/u;

    readonly #repo: Repository<Auto>;

    readonly #fileRepo: Repository<AutoFile>;

    readonly #readService: AutoReadService;

    readonly #mailService: MailService;

    readonly #logger = getLogger(AutoWriteService.name);

    /**
     * Initialisiert eine neue Instanz des `AutoWriteService`.
     * @param repo Das TypeORM Repository für die `Auto`-Entität.
     * @param fileRepo Das TypeORM Repository für die `AutoFile`-Entität.
     * @param readService Der `AutoReadService` für Leseoperationen.
     * @param mailService Der `MailService` zum Versenden von E-Mails.
     */
    constructor(
        @InjectRepository(Auto) repo: Repository<Auto>,
        @InjectRepository(AutoFile) fileRepo: Repository<AutoFile>,
        readService: AutoReadService,
        mailService: MailService,
    ) {
        this.#repo = repo;
        this.#fileRepo = fileRepo;
        this.#readService = readService;
        this.#mailService = mailService;
    }

    /**
     * Ein neues Auto soll angelegt werden.
     * @param auto Das neu abzulegende Auto.
     * @returns Die ID des neu angelegten Autos als Promise.
     * @throws FahrgestellnummerExistsException Falls die Fahrgestellnummer bereits existiert.
     */
    async create(auto: Auto): Promise<number> {
        this.#logger.debug('create: auto=%o', auto);
        await this.#validateCreate(auto);

        const autoDb = await this.#repo.save(auto);
        await this.#sendmail(autoDb);
        return autoDb.id!;
    }

    /**
     * Zu einem vorhandenen Auto eine Binärdatei mit z.B. einem Bild abspeichern.
     * @param autoId ID des vorhandenen Autos.
     * @param data Bytes der Datei als Buffer.
     * @param filename Dateiname der hochzuladenden Datei.
     * @param mimetype MIME-Type der Datei.
     * @returns Das erstellte {@link AutoFile}-Objekt als Promise.
     * @throws NotFoundException Falls kein Auto zur gegebenen ID existiert.
     */
    // eslint-disable-next-line max-params
    async addFile(
        autoId: number,
        data: Buffer,
        filename: string,
        mimetype: string,
    ): Promise<Readonly<AutoFile>> {
        this.#logger.debug(
            'addFile: autoId: %d, filename:%s, mimetype: %s',
            autoId,
            filename,
            mimetype,
        );

        const auto = await this.#readService.findById({ id: autoId });

        // Vorhandene Datei ggf. löschen
        await this.#fileRepo
            .createQueryBuilder('auto_file')
            .delete()
            .where('auto_id = :id', { id: autoId })
            .execute();

        const autoFile = this.#fileRepo.create({
            filename,
            data,
            mimetype,
            auto,
        });

        // Den Datensatz fuer Auto mit der neuen Binaerdatei aktualisieren
        await this.#repo.save({
            id: auto.id,
            file: autoFile,
        });

        return autoFile;
    }

    /**
     * Ein vorhandenes Auto soll aktualisiert werden.
     * @param params Ein Objekt vom Typ {@link UpdateParams} mit ID, den zu aktualisierenden Auto-Daten und der Version.
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation als Promise.
     * @throws NotFoundException Falls kein Auto zur ID vorhanden ist.
     * @throws VersionInvalidException Falls die Versionsnummer ungültig ist.
     * @throws VersionOutdatedException Falls die Versionsnummer veraltet ist.
     */
    async update({ id, auto, version }: UpdateParams): Promise<number> {
        this.#logger.debug(
            'update: id=%d, auto=%o, version=%s',
            id,
            auto,
            version,
        );
        if (id === undefined) {
            this.#logger.debug('update: Keine gueltige ID');
            throw new NotFoundException(`Es gibt kein Auto mit der ID ${id}.`);
        }

        const validateResult = await this.#validateUpdate(auto, id, version);
        this.#logger.debug('update: validateResult=%o', validateResult);
        // validateResult ist ggf. eine Exception bzw. Error
        if (!(validateResult instanceof Auto)) {
            throw validateResult;
        }

        const autoNeu = validateResult;
        const merged = this.#repo.merge(autoNeu, auto);
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged);
        this.#logger.debug('update: updated=%o', updated);

        return updated.version!;
    }

    /**
     * Ein Auto wird asynchron anhand seiner ID gelöscht.
     * Bei Erfolg werden auch der zugehörige Motor und alle Reparaturen gelöscht.
     * @param id ID des zu löschenden Autos.
     * @returns `true`, falls das Auto vorhanden war und gelöscht wurde, sonst `false`, als Promise.
     * @throws NotFoundException Falls kein Auto zur ID gefunden wird.
     */
    async delete(id: number): Promise<boolean> {
        this.#logger.debug('delete: id=%d', id);
        const auto = await this.#readService.findById({
            id,
            mitReperaturen: true, // Sicherstellen, dass Reparaturen geladen werden für die Löschung
        });

        // auto existiert nicht: findById wirft NotFoundException
        // if (auto === undefined) {
        // this.#logger.debug('delete: Kein Auto mit id=%d', id);
        // return false;
        // }

        let deleteResult: DeleteResult | undefined;
        await this.#repo.manager.transaction(async (transactionalMgr) => {
            const motorId = auto.motor?.id;
            if (motorId !== undefined) {
                await transactionalMgr.delete(Motor, motorId);
            }
            const reperaturen = auto.reperaturen ?? [];
            for (const reperatur of reperaturen) {
                await transactionalMgr.delete(Reperatur, reperatur.id);
            }

            // Ggf. AutoFile löschen, falls vorhanden und verknüpft
            const autoFile = await this.#fileRepo.findOneBy({ auto: { id } });
            if (autoFile) {
                await transactionalMgr.delete(AutoFile, autoFile.id);
            }

            deleteResult = await transactionalMgr.delete(Auto, id);
            this.#logger.debug('delete: deleteResult=%o', deleteResult);
        });

        return (
            deleteResult?.affected !== undefined &&
            deleteResult.affected !== null &&
            deleteResult.affected > 0
        );
    }

    async #validateCreate({ fahrgestellnummer }: Auto): Promise<undefined> {
        this.#logger.debug(
            '#validateCreate: fahrgestellnummer=%s',
            fahrgestellnummer,
        );
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (
            await this.#repo.existsBy({ fahrgestellnummer: fahrgestellnummer! })
        ) {
            throw new FahrgestellnummerExistsException(fahrgestellnummer);
        }
    }

    async #sendmail(auto: Auto) {
        const subject = `Neues Auto ${auto.id}`;
        const motor = auto.motor?.name ?? 'N/A';
        const body = `Das Auto "${auto.marke} ${auto.modell}" mit dem Motornamen <strong>${motor}</strong> ist angelegt.`;
        await this.#mailService.sendmail({ subject, body });
    }

    async #validateUpdate(
        auto: Auto,
        id: number,
        versionStr: string,
    ): Promise<Auto> {
        this.#logger.debug(
            '#validateUpdate: auto=%o, id=%s, versionStr=%s',
            auto,
            id,
            versionStr,
        );
        if (!AutoWriteService.VERSION_PATTERN.test(versionStr)) {
            throw new VersionInvalidException(versionStr);
        }

        const version = Number.parseInt(versionStr.slice(1, -1), 10);
        this.#logger.debug(
            '#validateUpdate: auto=%o, version=%d',
            auto,
            version,
        );

        const autoDb = await this.#readService.findById({ id });

        // nullish coalescing
        const versionDb = autoDb.version!;
        if (version < versionDb) {
            this.#logger.debug('#validateUpdate: versionDb=%d', version);
            throw new VersionOutdatedException(version);
        }
        this.#logger.debug('#validateUpdate: autoDb=%o', autoDb);
        return autoDb;
    }
}
