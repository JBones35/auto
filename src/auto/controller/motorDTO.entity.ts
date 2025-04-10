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

@ValidatorConstraint({ name: 'decimalMin', async: false })
export class DecimalMin implements ValidatorConstraintInterface {
    validate(value: Decimal | undefined, args: ValidationArguments) {
        if (value === undefined) {
            return true;
        }
        const [minValue]: Decimal[] = args.constraints; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        return value.greaterThanOrEqualTo(minValue!);
    }

    defaultMessage(args: ValidationArguments) {
        return `Der Wert muss groesser oder gleich ${(args.constraints[0] as Decimal).toNumber()} sein.`;
    }
}

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
