import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Das Modul besteht aus den Klassen für die Fehlerbehandlung bei der Verwaltung
 * von Autos, z.B. beim DB-Zugriff.
 * @packageDocumentation
 */

/**
 * Exception-Klasse für eine bereits existierende Fahrgestellnummer-Nummer.
 */
export class FahrgestellnummerExistsException extends HttpException {
    readonly fahrgestellnummer: string | undefined;

    constructor(fahrgestellnummer: string | undefined) {
        super(
            `Die ISBN-Nummer ${fahrgestellnummer} existiert bereits.`,
            HttpStatus.UNPROCESSABLE_ENTITY,
        );
        this.fahrgestellnummer = fahrgestellnummer;
    }
}

/**
 * Exception-Klasse für eine ungültige Versionsnummer beim Ändern.
 */
export class VersionInvalidException extends HttpException {
    readonly version: string | undefined;

    constructor(version: string | undefined) {
        super(
            `Die Versionsnummer ${version} ist ungueltig.`,
            HttpStatus.PRECONDITION_FAILED,
        );
        this.version = version;
    }
}

/**
 * Exception-Klasse für eine veraltete Versionsnummer beim Ändern.
 */
export class VersionOutdatedException extends HttpException {
    readonly version: number;

    constructor(version: number) {
        super(
            `Die Versionsnummer ${version} ist nicht aktuell.`,
            HttpStatus.PRECONDITION_FAILED,
        );
        this.version = version;
    }
}
