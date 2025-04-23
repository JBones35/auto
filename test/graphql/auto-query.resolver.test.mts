/* eslint-disable @typescript-eslint/no-non-null-assertion */
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

import { type GraphQLRequest } from '@apollo/server';
import { beforeAll, describe, expect, test } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { type Auto, type AutoArt } from '../../src/auto/entity/auto.entity.js';
import { type GraphQLResponseBody } from './graphql.mjs';
import { baseURL, httpsAgent } from '../constants.mjs';

type AutoDTO = Omit<Auto, 'reperaturen' | 'aktualisiert' | 'erzeugt'>;

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idVorhanden = '20';

const motornameVorhanden = 'Delta';
const teilMotornameVorhanden = 'a';
const teilMotornameNichtVorhanden = 'abc';

const fahrgestellnummerVorhanden = 'WVWZZZ1JZXW000002';

const baujahrMin = 2019;
const baujahrNichtVorhanden = 2053;

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
describe('GraphQL Queries', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Axios initialisieren
    beforeAll(async () => {
        const baseUrlGraphQL = `${baseURL}/`;
        client = axios.create({
            baseURL: baseUrlGraphQL,
            httpsAgent,
            // auch Statuscode 400 als gueltigen Request akzeptieren, wenn z.B.
            // ein Enum mit einem falschen String getestest wird
            validateStatus: () => true,
        });
    });

    test.concurrent('Auto zu vorhandener ID', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    auto(id: "${idVorhanden}") {	
                        fahrgestellnummer
                        version
                        marke
                        modell
                        baujahr
                        art
                        preis
                        sicherheitsmerkmale
                        motor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { auto } = data.data! as { auto: AutoDTO };

        expect(auto.motor?.name).toMatch(/^\w/u);
        expect(auto.version).toBeGreaterThan(-1);
        expect(auto.id).toBeUndefined();
    });

    test.concurrent('Auto zu nicht-vorhandener ID', async () => {
        // given
        const id = '999999';
        const body: GraphQLRequest = {
            query: `
                {
                    auto(id: "${id}") {
                        motor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.auto).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toBe(`Es gibt kein Auto mit der ID ${id}.`);
        expect(path).toBeDefined();
        expect(path![0]).toBe('auto');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test.concurrent('Auto zu vorhandenem Motornamen', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    autos(suchkriterien: {
                        motor: "${motornameVorhanden}"
                    }) {
                        art
                        motor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { autos } = data.data! as { autos: AutoDTO[] };

        expect(autos).not.toHaveLength(0);
        expect(autos).toHaveLength(1);

        const [auto] = autos;

        expect(auto!.motor?.name).toBe(motornameVorhanden);
    });

    test.concurrent('Auto zu vorhandenem Teil-Motornamen', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    autos(suchkriterien: {
                        motor: "${teilMotornameVorhanden}"
                    }) {
                        motor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { autos } = data.data! as { autos: AutoDTO[] };

        expect(autos).not.toHaveLength(0);

        autos
            .map((auto) => auto.motor)
            .forEach((motor) =>
                expect(motor?.name?.toLowerCase()).toStrictEqual(
                    expect.stringContaining(teilMotornameVorhanden),
                ),
            );
    });

    test.concurrent('Auto zu nicht vorhandenem Motornamen', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    autos(suchkriterien: {
                        motor: "${teilMotornameNichtVorhanden}"
                    }) {
                        art
                        motor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.autos).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toMatch(/^Keine Autos gefunden:/u);
        expect(path).toBeDefined();
        expect(path![0]).toBe('autos');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test.concurrent('Auto zu vorhandener Fahrgestellnummer', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    autos(suchkriterien: {
                        fahrgestellnummer: "${fahrgestellnummerVorhanden}"
                    }) {
                        fahrgestellnummer
                        motor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { autos } = data.data! as { autos: AutoDTO[] };

        expect(autos).not.toHaveLength(0);
        expect(autos).toHaveLength(1);

        const [auto] = autos;
        const { fahrgestellnummer, motor } = auto!;

        expect(fahrgestellnummer).toBe(fahrgestellnummerVorhanden);
        expect(motor?.name).toBeDefined();
    });

    test.concurrent('Autos mit Baujahr >= 2019', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    autos(suchkriterien: {
                        baujahr: ${baujahrMin}
                    }) {
                        baujahr
                        motor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        expect(data.data).toBeDefined();

        const { autos } = data.data! as { autos: AutoDTO[] };

        expect(autos).not.toHaveLength(0);

        autos.forEach((auto) => {
            const { baujahr } = auto;

            expect(baujahr).toBeGreaterThanOrEqual(baujahrMin);
        });
    });

    test.concurrent('Kein Auto zu nicht-vorhandenem "baujahr"', async () => {
        // given
        const body: GraphQLRequest = {
            query: `
                {
                    autos(suchkriterien: {
                        baujahr: ${baujahrNichtVorhanden}
                    }) {
                        motor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.autos).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toMatch(/^Keine Autos gefunden:/u);
        expect(path).toBeDefined();
        expect(path![0]).toBe('autos');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test.concurrent('Autos zur Art "LKW"', async () => {
        // given
        const autoArt: AutoArt = 'LKW';
        const body: GraphQLRequest = {
            query: `
                {
                    autos(suchkriterien: {
                        art: ${autoArt}
                    }) {
                        art
                        motor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { autos } = data.data! as { autos: AutoDTO[] };

        expect(autos).not.toHaveLength(0);

        autos.forEach((auto) => {
            const { art, motor } = auto;

            expect(art).toBe(autoArt);
            expect(motor?.name).toBeDefined();
        });
    });

    test.concurrent('Autos zur einer ungueltigen Art', async () => {
        // given
        const autoArt = 'UNGUELTIG';
        const body: GraphQLRequest = {
            query: `
                {
                    autos(suchkriterien: {
                        art: ${autoArt}
                    }) {
                        motor {
                            name
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.BAD_REQUEST);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data).toBeUndefined();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { extensions } = error;

        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('GRAPHQL_VALIDATION_FAILED');
    });
});

/* eslint-enable @typescript-eslint/no-non-null-assertion */
