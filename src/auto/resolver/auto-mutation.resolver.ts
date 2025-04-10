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

export class AutoUpdateDTO extends AutoDTO {
    @IsNumberString()
    readonly id!: string;

    @IsInt()
    @Min(0)
    readonly version!: number;
}
@Resolver('Auto')
// alternativ: globale Aktivierung der Guards https://docs.nestjs.com/security/authorization#basic-rbac-implementation
@UseGuards(AuthGuard)
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class AutoMutationResolver {
    readonly #service: AutoWriteService;

    readonly #logger = getLogger(AutoMutationResolver.name);

    constructor(service: AutoWriteService) {
        this.#service = service;
    }

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
        // TODO BadUserInputError
        this.#logger.debug('updateAuto: versionResult=%d', versionResult);
        const payload: UpdatePayload = { version: versionResult };
        return payload;
    }

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

    // #errorMsgCreateauto(err: CreateError) {
    //     switch (err.type) {
    //         case 'IsbnExists': {
    //             return `Die ISBN ${err.isbn} existiert bereits`;
    //         }
    //         default: {
    //             return 'Unbekannter Fehler';
    //         }
    //     }
    // }

    // #errorMsgUpdateauto(err: UpdateError) {
    //     switch (err.type) {
    //         case 'autoNotExists': {
    //             return `Es gibt kein auto mit der ID ${err.id}`;
    //         }
    //         case 'VersionInvalid': {
    //             return `"${err.version}" ist keine gueltige Versionsnummer`;
    //         }
    //         case 'VersionOutdated': {
    //             return `Die Versionsnummer "${err.version}" ist nicht mehr aktuell`;
    //         }
    //         default: {
    //             return 'Unbekannter Fehler';
    //         }
    //     }
    // }
}
