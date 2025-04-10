import { Injectable, NotFoundException } from '@nestjs/common';
import { getLogger } from '../../logger/logger.js';
import { Auto } from '../entity/auto.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Pageable } from './pageable.js';
import { Suchkriterien } from './suchkriterien.js';
import { AutoFile } from '../entity/autoFile.entity.js';
import { Repository } from 'typeorm';
import { Slice } from './slice.js';
import { QueryBuilder } from './query-builder.js';

export type FindByIdParams = {
    /** ID des gesuchten Autos */
    readonly id: number;
    /** Sollen die Reperaturen mitgeladen werden? */
    readonly mitReperaturen?: boolean;
};

/**
 * Die Klasse `AutoReadService` implementiert das Lesen für Autos und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class AutoReadService {
    static readonly ID_PATTERN = /^[1-9]\d{0,10}$/u;

    readonly #autoProps: string[];

    readonly #queryBuilder: QueryBuilder;

    readonly #fileRepo: Repository<AutoFile>;

    readonly #logger = getLogger(AutoReadService.name);

    constructor(
        queryBuilder: QueryBuilder,
        @InjectRepository(AutoFile) fileRepo: Repository<AutoFile>,
    ) {
        const autoDummy = new Auto();
        this.#autoProps = Object.getOwnPropertyNames(autoDummy);
        this.#queryBuilder = queryBuilder;
        this.#fileRepo = fileRepo;
    }

    /**
     * Ein Auto asynchron anhand seiner ID suchen
     * @param id ID des gesuchten Autos
     * @returns Das gefundene Auto in einem Promise aus ES2015.
     * @throws NotFoundException falls kein Auto mit der ID existiert
     */
    async findById({
        id,
        mitReperaturen = false,
    }: FindByIdParams): Promise<Readonly<Auto>> {
        this.#logger.debug('findById: id=%d', id);

        const auto = await this.#queryBuilder
            .buildId({ id, mitReperaturen })
            .getOne();
        if (auto === null) {
            throw new NotFoundException(`Es gibt kein Auto mit der ID ${id}.`);
        }

        if (auto.sicherheitsmerkmale === null) {
            auto.sicherheitsmerkmale = [];
        }

        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'findById: auto=%s, titel=%o',
                auto.toString(),
                auto.modell,
            );
            if (mitReperaturen) {
                this.#logger.debug(
                    'findById: abbildungen=%o',
                    auto.reperaturen,
                );
            }
        }
        return auto;
    }

    /**
     * Binärdatei zu einem Auto suchen.
     * @param autoId ID des zugehörigen Autos.
     * @returns Binärdatei oder undefined als Promise.
     */
    async findFileByAutoId(
        autoId: number,
    ): Promise<Readonly<AutoFile> | undefined> {
        this.#logger.debug('findFileByAutoId: autoId=%s', autoId);
        const autoFile = await this.#fileRepo
            .createQueryBuilder('auto_file')
            .where('auto_id = :id', { id: autoId })
            .getOne();
        if (autoFile === null) {
            this.#logger.debug('findFileByAutoId: Keine Datei gefunden');
            return;
        }

        this.#logger.debug('findByAutoId: filename=%s', autoFile.filename);
        return autoFile;
    }

    /**
     * Autos asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien.
     * @param pageable Maximale Anzahl an Datensätzen und Seitennummer.
     * @returns Ein JSON-Array mit den gefundenen Autos.
     * @throws NotFoundException falls keine Autos gefunden wurden.
     */
    async find(
        suchkriterien: Suchkriterien | undefined,
        pageable: Pageable,
    ): Promise<Slice<Auto>> {
        this.#logger.debug(
            'find: suchkriterien=%o, pageable=%o',
            suchkriterien,
            pageable,
        );

        if (suchkriterien === undefined) {
            return await this.#findAll(pageable);
        }
        const keys = Object.keys(suchkriterien);
        if (keys.length === 0) {
            return await this.#findAll(pageable);
        }

        if (!this.#checkKeys(keys) || !this.#checkEnums(suchkriterien)) {
            throw new NotFoundException('Ungueltige Suchkriterien');
        }

        const queryBuilder = this.#queryBuilder.build(suchkriterien, pageable);
        const autos = await queryBuilder.getMany();
        if (autos.length === 0) {
            this.#logger.debug('find: Keine Autos gefunden');
            throw new NotFoundException(
                `Keine Autos gefunden: ${JSON.stringify(suchkriterien)}, Seite ${pageable.number}}`,
            );
        }
        const totalElements = await queryBuilder.getCount();
        return this.#createSlice(autos, totalElements);
    }

    /**
     * Alle Autos asynchron suchen.
     * @param pageable Maximale Anzahl an Datensätzen und Seitennummer.
     * @returns Ein JSON-Array mit den gefundenen Autos.
     * @throws NotFoundException falls keine Autos gefunden wurden.
     */
    async #findAll(pageable: Pageable) {
        const queryBuilder = this.#queryBuilder.build({}, pageable);
        const autos = await queryBuilder.getMany();
        if (autos.length === 0) {
            throw new NotFoundException(
                `Ungueltige Seite "${pageable.number}"`,
            );
        }
        const totalElements = await queryBuilder.getCount();
        return this.#createSlice(autos, totalElements);
    }

    #createSlice(autos: Auto[], totalElements: number) {
        autos.forEach((auto) => {
            if (auto.sicherheitsmerkmale === null) {
                auto.sicherheitsmerkmale = [];
            }
        });
        const autoSlice: Slice<Auto> = {
            content: autos,
            totalElements,
        };
        this.#logger.debug('createSlice: autoSlice=%o', autoSlice);
        return autoSlice;
    }

    /**
     * Überprüfen, ob die Suchkriterien gültig sind.
     * @param keys Liste der Suchkriterien.
     * @returns true, wenn alle Suchkriterien gültig sind.
     */
    #checkKeys(keys: string[]) {
        this.#logger.debug('#checkKeys: keys=%s', keys);
        // Ist jedes Suchkriterium auch eine Property von Auto oder "schlagwoerter"?
        let validKeys = true;
        keys.forEach((key) => {
            if (
                !this.#autoProps.includes(key) &&
                key !== 'esb' &&
                key !== 'abs' &&
                key !== 'airbag' &&
                key !== 'parkassistent'
            ) {
                this.#logger.debug(
                    '#checkKeys: ungueltiges Suchkriterium "%s"',
                    key,
                );
                validKeys = false;
            }
        });

        return validKeys;
    }

    #checkEnums(suchkriterien: Suchkriterien) {
        const { art } = suchkriterien;
        this.#logger.debug('#checkEnums: Suchkriterium "art=%s"', art);
        return art === undefined || art === 'PKW' || art === 'LKW';
    }
}
