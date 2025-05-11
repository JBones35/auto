import { ApiProperty } from '@nestjs/swagger';
import {
    IsInt,
    IsOptional,
    Max,
    MaxLength,
    Min,
    Validate,
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { Transform } from 'class-transformer';
import Decimal from 'decimal.js';

export const MAX_PS = 1000;

export const MAX_ZYLINDER = 24;

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
 * DTO-Klasse (Data Transfer Object) für einen Motor.
 * Repräsentiert die Datenstruktur eines Motors mit seinen Eigenschaften.
 */
export class MotorDTO {
    @MaxLength(40)
    @ApiProperty({ example: 'Der Name', type: String })
    readonly name!: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(MAX_PS)
    @ApiProperty({ example: 100, type: Number })
    readonly ps: number | undefined;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(MAX_ZYLINDER)
    @ApiProperty({ example: 8, type: Number })
    readonly zylinder: number | undefined;

    @IsOptional()
    @Transform(number2Decimal)
    @Validate(DecimalMin, [Decimal(0)], {
        message: 'preis muss positiv sein.',
    })
    @ApiProperty({ example: 10000, type: Number })
    // Decimal aus decimal.js analog zu BigDecimal von Java
    readonly drehzahl: Decimal | undefined;
}
