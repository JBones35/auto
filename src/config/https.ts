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

/**
 * Das Modul enthält die Konfiguration für den _Node_-basierten Server.
 * @packageDocumentation
 */

import { type HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface.js';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { RESOURCES_DIR } from './app.js';

const tlsDir = path.resolve(RESOURCES_DIR, 'tls');
console.debug('tlsDir = %s', tlsDir);

let httpsOptions: HttpsOptions | undefined;

const isTest = process.env.NODE_ENV === 'test';
const keyPath = path.resolve(tlsDir, 'key.pem');
const certPath = path.resolve(tlsDir, 'certificate.crt');

// Nur laden, wenn nicht im Test oder wenn die Dateien existieren
if (!isTest && existsSync(keyPath) && existsSync(certPath)) {
    httpsOptions = {
        key: readFileSync(keyPath),
        cert: readFileSync(certPath),
    };
} else {
    console.warn('HTTPS-Konfiguration wird im Testmodus oder ohne Schlüssel/Zertifikat übersprungen');
}

export { httpsOptions };
