// Copyright (C) 2025 - present Juergen Zimmermann, Hochschule Karlsruhe
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

import { beforeAll, describe, expect, test } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { type Auto } from '../../src/auto/entity/auto.entity.js';
import { type Page } from '../../src/auto/controller/page.js';
import { baseURL, httpsAgent } from '../constants.mjs';
import { type ErrorResponse } from './error-response.mjs';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const motornameVorhanden = 'a';
const motornameNichtVorhanden = 'xx';
const baujahrMin = 2023;
const sicherheitsmerkmalVorhanden = 'abs';
const sicherheitsmerkmalNichtVorhanden = 'XXX';

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
describe('GET /rest', () => {
    let restUrl: string;
    let client: AxiosInstance;

    // Axios initialisieren
    beforeAll(async () => {
        restUrl = `${baseURL}/rest`;
        client = axios.create({
            baseURL: restUrl,
            httpsAgent,
            validateStatus: () => true,
        });
    });

    test.concurrent('Alle Autos', async () => {
        // given

        // when
        const { status, headers, data }: AxiosResponse<Page<Auto>> =
            await client.get('/');

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        data.content
            .map((auto) => auto.id)
            .forEach((id) => {
                expect(id).toBeDefined();
            });
    });

    test.concurrent('Autos mit einem Teil-Motornamen suchen', async () => {
        // given
        const params = { motor: motornameVorhanden };

        // when
        const { status, headers, data }: AxiosResponse<Page<Auto>> =
            await client.get('/', { params });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        // Jedes Auto hat einen Motor mit dem Teilstring 'a'
        data.content
            .map((auto) => auto.motor)
            .forEach((motor) =>
                expect(motor?.name?.toLowerCase()).toStrictEqual(
                    expect.stringContaining(motornameVorhanden),
                ),
            );
    });

    test.concurrent(
        'Autos zu einem nicht vorhandenen Teil-Motornamen suchen',
        async () => {
            // given
            const params = { motor: motornameNichtVorhanden };

            // when
            const { status, data }: AxiosResponse<ErrorResponse> =
                await client.get('/', { params });

            // then
            expect(status).toBe(HttpStatus.NOT_FOUND);

            const { error, statusCode } = data;

            expect(error).toBe('Not Found');
            expect(statusCode).toBe(HttpStatus.NOT_FOUND);
        },
    );

    test.concurrent('Autos mit Mindest-"baujahr" suchen', async () => {
        // given
        const params = { baujahr: baujahrMin };

        // when
        const { status, headers, data }: AxiosResponse<Page<Auto>> =
            await client.get('/', { params });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        // Jedes Auto hat einen Motor mit dem Teilstring 'a'
        data.content
            .map((auto) => auto.baujahr)
            .forEach((baujahr) =>
                expect(baujahr).toBeGreaterThanOrEqual(baujahrMin),
            );
    });

    test.concurrent(
        'Mind. 1 Auto mit vorhandenem Sicherheitsmerkmale',
        async () => {
            // given
            const params = { [sicherheitsmerkmalVorhanden]: 'true' };

            // when
            const { status, headers, data }: AxiosResponse<Page<Auto>> =
                await client.get('/', { params });

            // then
            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            // JSON-Array mit mind. 1 JSON-Objekt
            expect(data).toBeDefined();

            // Jedes Auto hat im Array der Sicherheitsmerkmale z.B. "ABS"
            data.content
                .map((auto) => auto.sicherheitsmerkmale)
                .forEach((sicherheitsmerkmale) =>
                    expect(sicherheitsmerkmale).toStrictEqual(
                        expect.arrayContaining([
                            sicherheitsmerkmalVorhanden.toUpperCase(),
                        ]),
                    ),
                );
        },
    );

    test.concurrent(
        'Keine Autos zu einem nicht vorhandenen Sicherheitsmerkmal',
        async () => {
            // given
            const params = { [sicherheitsmerkmalNichtVorhanden]: 'true' };

            // when
            const { status, data }: AxiosResponse<ErrorResponse> =
                await client.get('/', { params });

            // then
            expect(status).toBe(HttpStatus.NOT_FOUND);

            const { error, statusCode } = data;

            expect(error).toBe('Not Found');
            expect(statusCode).toBe(HttpStatus.NOT_FOUND);
        },
    );

    test.concurrent(
        'Keine Autos zu einer nicht-vorhandenen Property',
        async () => {
            // given
            const params = { foo: 'bar' };

            // when
            const { status, data }: AxiosResponse<ErrorResponse> =
                await client.get('/', { params });

            // then
            expect(status).toBe(HttpStatus.NOT_FOUND);

            const { error, statusCode } = data;

            expect(error).toBe('Not Found');
            expect(statusCode).toBe(HttpStatus.NOT_FOUND);
        },
    );
});
