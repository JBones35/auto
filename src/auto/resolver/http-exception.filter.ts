/**
 * Das Modul besteht aus der Klasse {@linkcode HttpExceptionFilter}.
 * @packageDocumentation
 */
import {
    type ArgumentsHost,
    Catch,
    type ExceptionFilter,
    HttpException,
} from '@nestjs/common';
import { BadUserInputError } from './errors.js';

/**
 * Ein Exception-Filter, der {@link HttpException} abfängt und sie
 * in eine {@link BadUserInputError} umwandelt.
 * Dies dient dazu, clientseitige Fehler standardisiert zu behandeln.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    /**
     * Fängt eine {@link HttpException} ab und transformiert sie.
     * Wenn die Antwort der Exception ein String ist, wird dieser als Nachricht
     * für eine neue {@link BadUserInputError} verwendet. Andernfalls wird die
     * `message`-Eigenschaft des Antwortobjekts genutzt.
     *
     * @param exception Die abgefangene {@link HttpException}.
     * @param _host Das {@link ArgumentsHost}-Objekt, das Details zum aktuellen Request enthält (hier nicht verwendet).
     * @throws {BadUserInputError} Wird immer ausgelöst, um die ursprüngliche {@link HttpException} zu ersetzen.
     */
    catch(exception: HttpException, _host: ArgumentsHost) {
        const response = exception.getResponse();
        if (typeof response === 'string') {
            throw new BadUserInputError(response, exception);
        }

        // Typ "object", default: mit den Properties statusCode und message
        const { message } = response as { message: string };
        throw new BadUserInputError(message, exception);
    }
}
