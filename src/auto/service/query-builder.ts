/**
 * Das Modul besteht aus der Klasse {@linkcode QueryBuilder}.
 * @packageDocumentation
 */

import { Injectable } from '@nestjs/common';
import { Auto } from '../entity/auto.entity.js';
import { Motor } from '../entity/motor.entity.js';
import { Reperatur } from '../entity/reperatur.entity.js';
import { Repository, SelectQueryBuilder } from 'typeorm';
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

/**
 * Die Klasse `QueryBuilder` ist verantwortlich für die Erstellung von
 * TypeORM QueryBuilder-Instanzen für Auto-Entitäten basierend auf
 * verschiedenen Suchkriterien und Paginierungsoptionen.
 */
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

    /**
     * Initialisiert eine neue Instanz des `QueryBuilder`.
     * @param repo Das TypeORM Repository für die `Auto`-Entität.
     */
    constructor(@InjectRepository(Auto) repo: Repository<Auto>) {
        this.#repo = repo;
    }

    /**
     * Erstellt einen TypeORM QueryBuilder, um ein Auto anhand seiner ID zu suchen.
     * Bezieht standardmäßig den zugehörigen Motor mit ein und optional auch die Reparaturen.
     * @param params Ein Objekt vom Typ {@link BuildIdParams}, das die ID des gesuchten Autos
     * und optional ein Flag zum Laden von Reparaturen enthält.
     * @returns Eine `SelectQueryBuilder<Auto>`-Instanz.
     */
    buildId({
        id,
        mitReperaturen = false,
    }: BuildIdParams): SelectQueryBuilder<Auto> {
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
     * Erstellt einen TypeORM QueryBuilder für die Suche nach Autos basierend auf Suchkriterien und Paginierung.
     * @param suchkriterien Ein Objekt vom Typ {@link Suchkriterien}. Bei spezifischen Feldern wie "motor" (Name),
     * "baujahr" oder "preis" werden spezielle Vergleichsoperatoren angewendet.
     * Sicherheitsmerkmale wie "esb", "abs", "airbag", "parkassistent" werden als Booleans ('true') interpretiert.
     * @param pageable Ein Objekt vom Typ {@link Pageable}, das die Seitengröße und die Seitennummer für die Paginierung definiert.
     * @returns Eine `SelectQueryBuilder<Auto>`-Instanz.
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
    ): SelectQueryBuilder<Auto> {
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
        queryBuilder.innerJoinAndSelect(`${this.#autoAlias}.motor`, 'motor'); // 'motor' ist hier der Alias für die Join-Tabelle
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
                typeof baujahr === 'string' ? parseInt(baujahr, 10) : baujahr;
            if (!isNaN(baujahrNumber)) {
                const condition = `${this.#autoAlias}.baujahr >= :baujahr`; // Parameterisierte Abfrage
                const params = { baujahr: baujahrNumber };
                queryBuilder = useWhere
                    ? queryBuilder.where(condition, params)
                    : queryBuilder.andWhere(condition, params);
                useWhere = false;
            }
        }

        if (preis !== undefined && typeof preis === 'string') {
            const preisNumber = Number(preis);
            if (!isNaN(preisNumber)) {
                const condition = `${this.#autoAlias}.preis <= :preis`; // Parameterisierte Abfrage
                const params = { preis: preisNumber };
                queryBuilder = useWhere
                    ? queryBuilder.where(condition, params)
                    : queryBuilder.andWhere(condition, params);
                useWhere = false;
            }
        }

        const addSicherheitsmerkmalCondition = (merkmal: string) => {
            const condition = `${this.#autoAlias}.sicherheitsmerkmale like :merkmal`;
            const params = { merkmal: `%${merkmal.toUpperCase()}%` };
            queryBuilder = useWhere
                ? queryBuilder.where(condition, params)
                : queryBuilder.andWhere(condition, params);
            useWhere = false;
        };

        if (esb === 'true') {
            addSicherheitsmerkmalCondition('ESB');
        }

        if (abs === 'true') {
            addSicherheitsmerkmalCondition('ABS');
        }

        if (airbag === 'true') {
            addSicherheitsmerkmalCondition('AIRBAG');
        }

        if (parkassistent === 'true') {
            addSicherheitsmerkmalCondition('PARKASSISTENT');
        }

        // Restliche Properties als Key-Value-Paare: Vergleiche auf Gleichheit
        Object.entries(restProps).forEach(([key, value]) => {
            const param: Record<string, any> = {};
            // eslint-disable-next-line security/detect-object-injection
            param[key] = value;
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

        // Paginierung nur anwenden, wenn pageable.size nicht explizit 0 ist (alle Ergebnisse)
        if (pageable?.size === 0) {
            return queryBuilder;
        }
        const size = pageable?.size ?? DEFAULT_PAGE_SIZE;
        const number = pageable?.number ?? DEFAULT_PAGE_NUMBER; // Annahme: pageable.number ist 0-basiert
        const skip = number * size;
        this.#logger.debug('take=%s, skip=%s', size, skip);
        return queryBuilder.take(size).skip(skip);
    }
}
