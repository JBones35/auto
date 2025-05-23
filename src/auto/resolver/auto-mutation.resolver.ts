import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { IsInt, IsNumberString, Min } from 'class-validator';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { HttpExceptionFilter } from './http-exception.filter.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AutoWriteService } from '../service/auto-write.service.js';
import { getLogger } from '../../logger/logger.js';
import { Auto } from '../entity/auto.entity.js';
import { Motor } from '../entity/motor.entity.js';
import { AutoDTO } from '../controller/autoDTO.entity.js';
import { IdInput } from './auto-query.resolver.js';
import { Reperatur } from '../entity/reperatur.entity.js';
import Decimal from 'decimal.js';

export type CreatePayload = {
    readonly id: number;
};

export type UpdatePayload = {
    readonly version: number;
};

/**
 * DTO-Klasse für die Aktualisierung eines Autos.
 * Erweitert {@link AutoDTO} um die Felder `id` und `version`, die für den Update-Vorgang benötigt werden.
 */
export class AutoUpdateDTO extends AutoDTO {
    @IsNumberString()
    readonly id!: string;

    @IsInt()
    @Min(0)
    readonly version!: number;
}
/**
 * GraphQL Resolver-Klasse für Mutationen, die Autos betreffen.
 * Stellt Endpunkte zum Erstellen, Aktualisieren und Löschen von Autos bereit.
 */
@Resolver('Auto')
// alternativ: globale Aktivierung der Guards https://docs.nestjs.com/security/authorization#basic-rbac-implementation
@UseGuards(AuthGuard)
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class AutoMutationResolver {
    readonly #service: AutoWriteService;

    readonly #logger = getLogger(AutoMutationResolver.name);

    /**
     * Initialisiert eine neue Instanz des `AutoMutationResolver`.
     * @param service Der `AutoWriteService` für Schreiboperationen.
     */
    constructor(service: AutoWriteService) {
        this.#service = service;
    }

    /**
     * Erstellt ein neues Auto basierend auf den übergebenen Daten.
     * Erfordert die Rollen 'admin' oder 'user'.
     * @param autoDTO Die Daten des zu erstellenden Autos als {@link AutoDTO}.
     * @returns Ein {@link CreatePayload}-Objekt, das die ID des neu erstellten Autos enthält.
     */
    @Mutation()
    @Roles('admin', 'user')
    async create(@Args('input') autoDTO: AutoDTO) {
        this.#logger.debug('create: autoDTO=%o', autoDTO);

        const auto = this.#autoDtoToAuto(autoDTO);
        const id = await this.#service.create(auto);
        this.#logger.debug('createAuto: id=%d', id);
        const payload: CreatePayload = { id };
        return payload;
    }

    /**
     * Aktualisiert ein bestehendes Auto mit den übergebenen Daten.
     * Erfordert die Rollen 'admin' oder 'user'.
     * @param autoDTO Die Daten des zu aktualisierenden Autos als {@link AutoUpdateDTO}.
     * @returns Ein {@link UpdatePayload}-Objekt, das die neue Versionsnummer des aktualisierten Autos enthält.
     */
    @Mutation()
    @Roles('admin', 'user')
    async update(@Args('input') autoDTO: AutoUpdateDTO) {
        this.#logger.debug('update: auto=%o', autoDTO);

        const auto = this.#autoUpdateDtoToAuto(autoDTO);
        const versionStr = `"${autoDTO.version.toString()}"`;

        const versionResult = await this.#service.update({
            id: Number.parseInt(autoDTO.id, 10),
            auto,
            version: versionStr,
        });
        this.#logger.debug('updateAuto: versionResult=%d', versionResult);
        const payload: UpdatePayload = { version: versionResult };
        return payload;
    }

    /**
     * Löscht ein Auto anhand seiner ID.
     * Erfordert die Rolle 'admin'.
     * @param id Ein {@link IdInput}-Objekt, das die ID des zu löschenden Autos enthält.
     * @returns `true`, wenn das Auto erfolgreich gelöscht wurde, andernfalls `false`.
     */
    @Mutation()
    @Roles('admin')
    async delete(@Args() id: IdInput) {
        const idStr = id.id;
        this.#logger.debug('delete: id=%s', idStr);
        const deletePerformed = await this.#service.delete(idStr);
        this.#logger.debug('deleteAuto: deletePerformed=%s', deletePerformed);
        return deletePerformed;
    }

    #autoDtoToAuto(autoDTO: AutoDTO): Auto {
        const motorDTO = autoDTO.motor;
        const motor: Motor = {
            id: undefined,
            name: motorDTO.name,
            ps: motorDTO.ps,
            zylinder: motorDTO.zylinder,
            drehzahl: motorDTO.drehzahl,
            auto: undefined,
        };
        // "Optional Chaining" ab ES2020
        const reperaturen = autoDTO.reperaturen?.map((reperaturDTO) => {
            const reperatur: Reperatur = {
                id: undefined,
                kosten: reperaturDTO.kosten,
                mechaniker: reperaturDTO.mechaniker,
                datum: reperaturDTO.datum,
                auto: undefined,
            };
            return reperatur;
        });
        const auto: Auto = {
            id: undefined,
            version: undefined,
            fahrgestellnummer: autoDTO.fahrgestellnummer,
            marke: autoDTO.marke,
            modell: autoDTO.modell,
            baujahr: autoDTO.baujahr,
            art: autoDTO.art,
            preis: Decimal(autoDTO.preis),
            sicherheitsmerkmale: autoDTO.sicherheitsmerkmale,
            motor,
            reperaturen,
            file: undefined,
            erzeugt: new Date(),
            aktualisiert: new Date(),
        };

        // Rueckwaertsverweis
        auto.motor!.auto = auto;
        return auto;
    }

    #autoUpdateDtoToAuto(autoDTO: AutoUpdateDTO): Auto {
        return {
            id: undefined,
            version: undefined,
            fahrgestellnummer: autoDTO.fahrgestellnummer,
            marke: autoDTO.marke,
            modell: autoDTO.modell,
            baujahr: autoDTO.baujahr,
            art: autoDTO.art,
            preis: Decimal(autoDTO.preis),
            sicherheitsmerkmale: autoDTO.sicherheitsmerkmale,
            motor: undefined,
            reperaturen: undefined,
            file: undefined,
            erzeugt: undefined,
            aktualisiert: new Date(),
        };
    }
}
