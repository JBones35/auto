/* eslint-disable prettier/prettier */
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
import { Decimal } from 'decimal.js';
import { type AutoDTO } from '../../src/auto/controller/autoDTO.entity.js';
import { AutoReadService } from '../../src/auto/service/auto-read.service.js';
import { baseURL, httpsAgent } from '../constants.mjs';
import { type ErrorResponse } from './error-response.mjs';
import { MotorDTO } from '../../src/auto/controller/motorDTO.entity.js';
import { ReperaturDTO } from '../../src/auto/controller/reperaturDTO.entity.js';

const token = inject('tokenRest');

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const neuerMotor: Omit<MotorDTO, 'drehzahl'> & {
    drehzahl: number;
} = {
    name: 'Beta',
    ps: 150,
    zylinder: 6,
    drehzahl: 3453535.35,
};

const neueReperatur: Omit<ReperaturDTO, 'kosten' | 'datum'> & {
    kosten: number;
    datum: string;
} = {
    mechaniker: 'Hans Müller',
    datum: '2025-03-15',
    kosten: 10103.35,
};

const neuesAuto: Omit<AutoDTO, 'preis' | 'motor' | 'reperaturen'> & {
    preis: number;
    motor: Omit<MotorDTO, 'drehzahl'> & { drehzahl: number };
    reperaturen: (Omit<ReperaturDTO, 'kosten' | 'datum'> & {
        kosten: number;
        datum: string;
    })[];
} = {
    fahrgestellnummer: 'WVWZZZ1JZXW000056',
    marke: 'audi',
    modell: 'a3',
    baujahr: 2021,
    art: 'PKW',
    preis: 255555.8,
    sicherheitsmerkmale: ['ESP', 'Airbags'],
    motor: neuerMotor,
    reperaturen: [neueReperatur],
};
const neuesAutoInvalid: Record<string, unknown> = {
    fahrgestellnummer: 'falsche FAHRGESTELLNUMMER',
    marke: 'audi',
    modell: 'a3',
    baujahr: 2021,
    art: 'Blub',
    preis: 100000,
    motor: {
        name: '?!',
    },
    reperaturen: [
        {
            mechaniker: 'Hans Müller',
            datum: new Date(),
            kosten: 10002.35,
        },
    ],
};
const neuesAutoFahrgestellnummerExistiert: AutoDTO = {
    fahrgestellnummer: 'WVWZZZ1JZXW000002',
    marke: 'audi',
    modell: 'a3',
    baujahr: 2021,
    art: 'PKW',
    preis: new Decimal(25000),
    sicherheitsmerkmale: ['ESP', 'Airbags'],
    motor: {
        name: 'Beta',
        ps: 150,
        zylinder: 6,
        drehzahl: new Decimal(5000),
    },
    reperaturen: [
        {
            mechaniker: 'Hans Müller',
            datum: new Date(),
            kosten: new Decimal(100),
        },
    ],
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
describe('POST /rest', () => {
    let client: AxiosInstance;
    const restURL = `${baseURL}/rest`;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Axios initialisieren
    beforeAll(async () => {
        client = axios.create({
            baseURL: restURL,
            httpsAgent,
            validateStatus: (status) => status < 500,
        });
    });

    test('Neues Auto', async () => {
        // given
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<string> = await client.post(
            '',
            neuesAuto,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.CREATED);

        const { location } = response.headers as { location: string };

        expect(location).toBeDefined();

        // ID nach dem letzten "/"
        const indexLastSlash: number = location.lastIndexOf('/');

        expect(indexLastSlash).not.toBe(-1);

        const idStr = location.slice(indexLastSlash + 1);

        expect(idStr).toBeDefined();
        expect(AutoReadService.ID_PATTERN.test(idStr)).toBe(true);

        expect(data).toBe('');
    });

    test.concurrent('Neues Auto mit ungueltigen Daten', async () => {
        // given
        headers.Authorization = `Bearer ${token}`;
        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '',
            neuesAutoInvalid,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.BAD_REQUEST);

        const messages = data.message as string[];

        expect(messages).toBeDefined();
    });

    test.concurrent(
        'Neues Auto, aber die Fahrgestellnummer existiert bereits',
        async () => {
            // given
            headers.Authorization = `Bearer ${token}`;

            // when
            const response: AxiosResponse<ErrorResponse> = await client.post(
                '',
                neuesAutoFahrgestellnummerExistiert,
                { headers },
            );

            // then
            const { data } = response;

            const { statusCode } = data;

            expect(statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        },
    );

    test.concurrent('Neues Auto, aber ohne Token', async () => {
        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '',
            neuesAuto,
        );

        // then
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    test.concurrent('Neues Auto, aber mit falschem Token', async () => {
        // given
        const token = 'FALSCH';
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '',
            neuesAuto,
            { headers },
        );

        // then
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    test.concurrent.todo('Abgelaufener Token');
});
