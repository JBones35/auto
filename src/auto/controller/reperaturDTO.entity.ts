/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

/* eslint-disable @typescript-eslint/no-magic-numbers */

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsISO8601,
    IsOptional,
    Matches,
    MaxLength,
    Validate,
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import Decimal from 'decimal.js';

export const number2Decimal = ({
    value,
}: {
    value: Decimal.Value | undefined;
}) => {
    if (value === undefined) {
        return;
    }

    // Decimal aus decimal.js analog zu BigDecimal von Java
    // precision wie bei SQL beim Spaltentyp DECIMAL bzw. NUMERIC
    Decimal.set({ precision: 6 });
    return Decimal(value);
};

/**
 * Validator-Constraint, um sicherzustellen, dass ein Decimal-Wert nicht kleiner als ein angegebener Minimalwert ist.
 */
@ValidatorConstraint({ name: 'decimalMin', async: false })
export class DecimalMin implements ValidatorConstraintInterface {
    /**
     * Validiert, ob der gegebene Wert größer oder gleich dem Minimalwert ist.
     * @param value Der zu validierende Decimal-Wert.
     * @param args Die Validierungsargumente, die den Minimalwert enthalten.
     * @returns `true`, wenn der Wert gültig ist oder `undefined`, andernfalls `false`.
     */
    validate(value: Decimal | undefined, args: ValidationArguments) {
        if (value === undefined) {
            return true;
        }
        const [minValue]: Decimal[] = args.constraints; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        return value.greaterThanOrEqualTo(minValue!);
    }

    /**
     * Gibt die Standardfehlermeldung zurück, wenn die Validierung fehlschlägt.
     * @param args Die Validierungsargumente, die den Minimalwert enthalten.
     * @returns Die Fehlermeldung als String.
     */
    defaultMessage(args: ValidationArguments) {
        return `Der Wert muss groesser oder gleich ${(args.constraints[0] as Decimal).toNumber()} sein.`;
    }
}

/**
 * DTO-Klasse (Data Transfer Object) für eine Reparatur.
 * Repräsentiert die Datenstruktur einer Reparatur mit ihren Eigenschaften.
 */
export class ReperaturDTO {
    @IsOptional()
    @Transform(number2Decimal)
    @Validate(DecimalMin, [Decimal(0)], {
        message: 'kosten müssen positiv sein.',
    })
    @ApiProperty({ example: 78.9, type: Number })
    // Decimal aus decimal.js analog zu BigDecimal von Java
    readonly kosten: Decimal | undefined;

    @Matches(/^[A-ZÄÖÜa-zäöüß\- ]+$/)
    @MaxLength(32)
    @ApiProperty({ example: 'Hans', type: String })
    readonly mechaniker!: string;

    @IsOptional()
    @IsISO8601({ strict: true })
    @ApiProperty({ example: '2024-01-31' })
    readonly datum: Date | string | undefined;
}
