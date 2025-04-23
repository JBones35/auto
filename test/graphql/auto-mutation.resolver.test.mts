/* eslint-disable @typescript-eslint/no-non-null-assertion */
// Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
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

import { beforeAll, describe, expect, inject, test } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { type GraphQLQuery, type GraphQLResponseBody } from './graphql.mjs';
import { baseURL, httpsAgent } from '../constants.mjs';

const token = inject('tokenGraphql');
const tokenUser = inject('tokenGraphqlUser');

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
describe('GraphQL Mutations', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Axios initialisieren
    beforeAll(async () => {
        client = axios.create({
            baseURL,
            httpsAgent,
        });
    });

    // -------------------------------------------------------------------------
    test('Neues Auto', async () => {
        // given
        const authorization = { Authorization: `Bearer ${token}` };
        const body: GraphQLQuery = {
            query: `
                mutation {
                    create(input: {
                        fahrgestellnummer: "WVWZZZ1JZXW000012",
                        marke: "audi",
                        modell: "a3",
                        baujahr: 2021,
                        art: PKW,
                        preis: 25000,
                        sicherheitsmerkmale: ["ESP", "Airbags"],
                        motor: {
                            name: "Beta",
                            ps: 150,
                            zylinder: 6,
                            drehzahl: 1500.8
                        },
                        reperaturen: []
                    }
                    ) {
                        id
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body, { headers: authorization });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data).toBeDefined();

        const { create } = data.data!;

        // Der Wert der Mutation ist die generierte ID
        expect(create).toBeDefined();
        expect(create.id).toBeGreaterThan(-1);
    });

    // -------------------------------------------------------------------------
    test('Auto mit ungueltigen Werten neu anlegen', async () => {
        // given
        const authorization = { Authorization: `Bearer ${token}` };
        const body: GraphQLQuery = {
            query: `
                mutation {
                    create(input: {
                        fahrgestellnummer: "falsch",
                        marke: "audi",
                        modell: "a3",
                        baujahr: 2021,
                        art: PKW,
                        preis: -25000,
                        sicherheitsmerkmale: ["ESP", "Airbags"],
                        motor: {
                            name: "Beta",
                            ps: 150,
                            zylinder: 6,
                            drehzahl: 1500.8
                        }
                    }) {
                        id
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body, { headers: authorization });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.create).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;

        expect(error).toBeDefined();

        const { message } = error;
        const messages: string[] = message.split(',');

        expect(messages).toBeDefined();
    });

    // -------------------------------------------------------------------------
    test('Auto aktualisieren', async () => {
        // given
        const authorization = { Authorization: `Bearer ${token}` };
        const body: GraphQLQuery = {
            query: `
                mutation {
                    update(input: {
                        id:80
                        version: 0
                        fahrgestellnummer: "WVWZZZ1JZXW000028"
                        marke: "audi"
                        modell: "a3"
                        baujahr: 2021
                        art: PKW
                        preis: 25000
                        sicherheitsmerkmale: ["ESP", "Airbags"]
                    }) {
                        version
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body, { headers: authorization });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        const { update } = data.data!;

        // Der Wert der Mutation ist die neue Versionsnummer
        expect(update.version).toBe(1);
    });

    // -------------------------------------------------------------------------
    test('Auto mit ungueltigen Werten aktualisieren', async () => {
        // given
        const authorization = { Authorization: `Bearer ${token}` };
        const id = '40';
        const body: GraphQLQuery = {
            query: `
                mutation {
                    update(input: {
                        id: "${id}"
                        version: 0
                        fahrgestellnummer: "WVWZZZ1JZXW000022"
                        marke: "audi"
                        modell: "a3"
                        baujahr: 2021
                        art: PKW
                        preis: -25000
                        sicherheitsmerkmale: ["ESP", "Airbags"]
                    }) {
                        version
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body, { headers: authorization });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.update).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message } = error;
        const messages: string[] = message.split(',');

        expect(messages).toBeDefined();
    });

    // -------------------------------------------------------------------------
    test('Nicht-vorhandenes Auto aktualisieren', async () => {
        // given
        const authorization = { Authorization: `Bearer ${token}` };
        const id = '999999';
        const body: GraphQLQuery = {
            query: `
                mutation {
                    update(input: {
                        id:"${id}"
                        version: 0
                        fahrgestellnummer: "WVWZZZ1JZXW000022"
                        marke: "audi"
                        modell: "a3"
                        baujahr: 2021
                        art: PKW
                        preis: 25000
                        sicherheitsmerkmale: ["ESP", "Airbags"]
                    }) {
                        version
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body, { headers: authorization });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.update).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;

        expect(error).toBeDefined();

        const { message, path, extensions } = error;

        expect(message).toBe(
            `Es gibt kein Auto mit der ID ${id.toLowerCase()}.`,
        );
        expect(path).toBeDefined();
        expect(path![0]).toBe('update');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    // -------------------------------------------------------------------------
    test('Auto loeschen', async () => {
        // given
        const authorization = { Authorization: `Bearer ${token}` };
        const body: GraphQLQuery = {
            query: `
                mutation {
                    delete(id: "1")
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body, { headers: authorization });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        const deleteMutation = data.data!.delete as boolean;

        // Der Wert der Mutation ist true (falls geloescht wurde) oder false
        expect(deleteMutation).toBe(true);
    });

    // -------------------------------------------------------------------------
    test('Auto loeschen als "user"', async () => {
        // given
        const authorization = { Authorization: `Bearer ${tokenUser}` };
        const body: GraphQLQuery = {
            query: `
                mutation {
                    delete(id: "10")
                }
            `,
        };

        // when
        const {
            status,
            headers,
            data,
        }: AxiosResponse<Record<'errors' | 'data', any>> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);

        const { errors } = data as { errors: any[] };

        expect(errors[0].message).toBe('Forbidden resource');
        expect(errors[0].extensions.code).toBe('BAD_USER_INPUT');
        expect(data.data.delete).toBeNull();
    });
});
/* eslint-enable @typescript-eslint/no-non-null-assertion */
