/**
 * Das Modul besteht aus der Controller-Klasse für Lesen an der REST-Schnittstelle.
 * @packageDocumentation
 */

import { type Request } from 'express';
import { nodeConfig } from '../../config/node.js';
import { AutoReadService } from '../service/auto-read.service.js';

const port = `:${nodeConfig.port}`;

/**
 * Erzeugt die Basis-URI für die aktuelle Anfrage.
 * Die Basis-URI besteht aus Protokoll, Hostname, Port und dem Basispfad der URL.
 * Eventuell vorhandene Query-Parameter und eine ID am Ende des Pfades werden entfernt.
 *
 * @param req Das Express Request-Objekt, das Informationen über die HTTP-Anfrage enthält.
 * @param req.protocol Das verwendete Protokoll (z.B. 'http' oder 'https').
 * @param req.hostname Der Hostname der Anfrage.
 * @param req.url Der Pfad der Anfrage-URL.
 * @returns Die konstruierte Basis-URI als String.
 */
export const createBaseUri = ({ protocol, hostname, url }: Request) => {
    // Query-String entfernen, falls vorhanden
    let basePath = url.includes('?') ? url.slice(0, url.lastIndexOf('?')) : url;

    // ID entfernen, falls der Pfad damit endet
    const indexLastSlash = basePath.lastIndexOf('/');
    if (indexLastSlash > 0) {
        const idStr = basePath.slice(indexLastSlash + 1);
        if (AutoReadService.ID_PATTERN.test(idStr)) {
            basePath = basePath.slice(0, indexLastSlash);
        }
    }
    return `${protocol}://${hostname}${port}${basePath}`;
};
