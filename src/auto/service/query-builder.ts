/**
 * Das Modul besteht aus der Klasse {@linkcode QueryBuilder}.
 * @packageDocumentation
 */

import { Injectable } from '@nestjs/common';
import { Auto } from '../entity/auto.entity.js';
import { Motor } from '../entity/motor.entity.js';
import { Reperatur } from '../entity/reperatur.entity.js';
import { Repository } from 'typeorm';
import { getLogger } from '../../logger/logger.js';
import { Suchkriterien } from './suchkriterien.js';
import {
    DEFAULT_PAGE_NUMBER,
    DEFAULT_PAGE_SIZE,
    Pageable,
} from './pageable.js';
import { typeOrmModuleOptions } from '../../config/typeormOptions.js';
import { InjectRepository } from '@nestjs/typeorm';

/** Typdefinitionen für die Suche mit der Auto-ID. */
export type BuildIdParams = {
    /** ID des gesuchten Autos. */
    readonly id: number;
    /** Sollen die Reperaturen mitgeladen werden? */
    readonly mitReperaturen?: boolean;
};

@Injectable()
export class QueryBuilder {
    readonly #autoAlias = `${Auto.name
        .charAt(0)
        .toLowerCase()}${Auto.name.slice(1)}`;

    readonly #motorAlias = `${Motor.name
        .charAt(0)
        .toLowerCase()}${Motor.name.slice(1)}`;

    readonly #reperaturAlias = `${Reperatur.name
        .charAt(0)
        .toLowerCase()}${Reperatur.name.slice(1)}`;

    readonly #repo: Repository<Auto>;

    readonly #logger = getLogger(QueryBuilder.name);

    constructor(@InjectRepository(Auto) repo: Repository<Auto>) {
        this.#repo = repo;
    }

    /**
     * Ein Auto mit der ID suchen.
     * @param id ID des gesuchten Autos
     * @returns QueryBuilder
     */
    buildId({ id, mitReperaturen = false }: BuildIdParams) {
        const queryBuilder = this.#repo.createQueryBuilder(this.#autoAlias);

        queryBuilder.innerJoinAndSelect(
            `${this.#autoAlias}.motor`,
            this.#motorAlias,
        );

        if (mitReperaturen) {
            queryBuilder.leftJoinAndSelect(
                `${this.#autoAlias}.reperaturen`,
                this.#reperaturAlias,
            );
        }

        queryBuilder.where(`${this.#autoAlias}.id = :id`, { id: id });
        return queryBuilder;
    }

    /**
     * Autos asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien. Bei "modell" wird mit
     * einem Teilstring gesucht, bei "baujahr" mit den fortführenden Jahren, bei "preis"
     * mit der Obergrenze.
     * @param pageable Maximale Anzahl an Datensätzen und Seitennummer.
     * @returns QueryBuilder
     */
    build(
        {
            motor,
            baujahr,
            preis,
            esb,
            abs,
            airbag,
            parkassistent,
            ...restProps
        }: Suchkriterien,
        pageable: Pageable,
    ) {
        this.#logger.debug(
            'build: motorenname= %s, baujahr=%s, preis=%s, esb=%s, abs=%s, airbag=%s, parkassistent=%s, restProps=%o, pageable=%o',
            motor,
            baujahr,
            preis,
            esb,
            abs,
            airbag,
            parkassistent,
            restProps,
            pageable,
        );

        let queryBuilder = this.#repo.createQueryBuilder(this.#autoAlias);
        queryBuilder.innerJoinAndSelect(`${this.#autoAlias}.motor`, 'motor');
        let useWhere = true;
        if (motor !== undefined && typeof motor === 'string') {
            const ilike =
                typeOrmModuleOptions.type === 'postgres' ? 'ilike' : 'like';
            queryBuilder = queryBuilder.where(
                `${this.#motorAlias}.name ${ilike} :name`,
                { name: `%${motor}%` },
            );
            useWhere = false;
        }

        if (baujahr !== undefined) {
            const baujahrNumber =
                typeof baujahr === 'string' ? parseInt(baujahr) : baujahr;
            if (!isNaN(baujahrNumber)) {
                queryBuilder = queryBuilder.where(
                    `${this.#autoAlias}.baujahr >= ${baujahrNumber}`,
                );
                useWhere = false;
            }
        }

        if (preis !== undefined && typeof preis === 'string') {
            const preisNumber = Number(preis);
            queryBuilder = queryBuilder.where(
                `${this.#autoAlias}.preis <= ${preisNumber}`,
            );
            useWhere = false;
        }

        if (esb === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#autoAlias}.sicherheitsmerkmale like '%ESB%'`,
                  )
                : queryBuilder.andWhere(
                      `${this.#autoAlias}.sicherheitsmerkmale like '%ESB%'`,
                  );
            useWhere = false;
        }

        if (abs === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#autoAlias}.sicherheitsmerkmale like '%ABS%'`,
                  )
                : queryBuilder.andWhere(
                      `${this.#autoAlias}.sicherheitsmerkmale like '%ABS%'`,
                  );
            useWhere = false;
        }

        if (airbag === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#autoAlias}.sicherheitsmerkmale like '%AIRBAG%'`,
                  )
                : queryBuilder.andWhere(
                      `${this.#autoAlias}.sicherheitsmerkmale like '%AIRBAG%'`,
                  );
            useWhere = false;
        }

        if (parkassistent === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#autoAlias}.sicherheitsmerkmale like '%PARKASSISTENT%'`,
                  )
                : queryBuilder.andWhere(
                      `${this.#autoAlias}.sicherheitsmerkmale like '%PARKASSISTENT%'`,
                  );
            useWhere = false;
        }

        // Restliche Properties als Key-Value-Paare: Vergleiche auf Gleichheit
        Object.entries(restProps).forEach(([key, value]) => {
            const param: Record<string, any> = {};
            param[key] = value; // eslint-disable-line security/detect-object-injection
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#autoAlias}.${key} = :${key}`,
                      param,
                  )
                : queryBuilder.andWhere(
                      `${this.#autoAlias}.${key} = :${key}`,
                      param,
                  );
            useWhere = false;
        });

        this.#logger.debug('build: sql=%s', queryBuilder.getSql());

        if (pageable?.size === 0) {
            return queryBuilder;
        }
        const size = pageable?.size ?? DEFAULT_PAGE_SIZE;
        const number = pageable?.number ?? DEFAULT_PAGE_NUMBER;
        const skip = number * size;
        this.#logger.debug('take=%s, skip=%s', size, skip);
        return queryBuilder.take(size).skip(skip);
    }
}
