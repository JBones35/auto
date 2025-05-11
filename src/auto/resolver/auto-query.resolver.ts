import { Args, Query, Resolver } from '@nestjs/graphql';
import { Suchkriterien } from '../service/suchkriterien.js';
import { UseFilters, UseInterceptors } from '@nestjs/common';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { HttpExceptionFilter } from './http-exception.filter.js';
import { AutoReadService } from '../service/auto-read.service.js';
import { getLogger } from '../../logger/logger.js';
import { Public } from 'nest-keycloak-connect';
import { createPageable } from '../service/pageable.js';

export type IdInput = {
    readonly id: number;
};

export type SuchkriterienInput = {
    readonly suchkriterien: Suchkriterien;
};

/**
 * GraphQL Resolver-Klasse für Abfragen, die Autos betreffen.
 * Stellt Endpunkte zum Suchen und Abrufen von Autos bereit.
 */
@Resolver('Auto')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class AutoQueryResolver {
    readonly #service: AutoReadService;

    readonly #logger = getLogger(AutoQueryResolver.name);

    /**
     * Initialisiert eine neue Instanz des `AutoQueryResolver`.
     * @param service Der `AutoReadService` für Leseoperationen.
     */
    constructor(service: AutoReadService) {
        this.#service = service;
    }

    /**
     * Findet ein Auto anhand seiner ID.
     * Dieser Endpunkt ist öffentlich zugänglich.
     * @param id Ein {@link IdInput}-Objekt, das die ID des gesuchten Autos enthält.
     * @returns Das gefundene Auto-Objekt oder `undefined`, falls kein Auto mit der ID existiert.
     */
    @Query('auto')
    @Public()
    async findById(@Args() { id }: IdInput) {
        this.#logger.debug('findById: id=%d', id);

        const auto = await this.#service.findById({ id });

        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'findById: autos=%s, motor=%o',
                auto.toString(),
                auto.motor,
            );
        }
        return auto;
    }

    /**
     * Findet Autos basierend auf optionalen Suchkriterien.
     * Dieser Endpunkt ist öffentlich zugänglich.
     * @param input Ein optionales {@link SuchkriterienInput}-Objekt, das die Suchkriterien enthält.
     * @returns Ein Array von Auto-Objekten, die den Suchkriterien entsprechen.
     */
    @Query('autos')
    @Public()
    async find(@Args() input: SuchkriterienInput | undefined) {
        this.#logger.debug('find: input=%o', input);
        const pageable = createPageable({});
        const autosSlice = await this.#service.find(
            input?.suchkriterien,
            pageable,
        );
        this.#logger.debug('find: autosSlice=%o', autosSlice);
        return autosSlice.content;
    }
}