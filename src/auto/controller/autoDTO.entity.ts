/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import { ApiProperty } from "@nestjs/swagger";
import { ArrayUnique, IsArray, IsInt, IsOptional, Matches, Max, MaxLength, Validate, ValidateNested, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import Decimal from "decimal.js";
import { AutoArt } from "../entity/auto.entity.js";
import { Transform, Type } from "class-transformer";
import { ReperaturDTO } from "./reperaturDTO.entity.js";
import { MotorDTO } from "./motorDTO.entity.js";

export const MAX_YEAR = new Date().getFullYear();

export const number2Decimal = ({ value }: { value: Decimal.Value | undefined }) => {
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

@ValidatorConstraint({ name: 'decimalMax', async: false })
export class DecimalMax implements ValidatorConstraintInterface {
    validate(value: Decimal | undefined, args: ValidationArguments) {
        if (value === undefined) {
            return true;
        }
        const [maxValue]: Decimal[] = args.constraints; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        return value.lessThanOrEqualTo(maxValue!);
    }

    defaultMessage(args: ValidationArguments) {
        return `Der Wert muss kleiner oder gleich ${(args.constraints[0] as Decimal).toNumber()} sein.`;
    }
}

/**
 * Entity-Klasse für Autos ohne TypeORM und ohne Referenzen.
 */
export class AutoDtoOhneRef {
    @ApiProperty({ example: 'W0L000051T2123456', type: String })
    readonly fahrgestellnummer!: string;

    @MaxLength(32)
    @ApiProperty({ example: 'Mercedes', type: String })
    readonly marke!: string;

    @MaxLength(32)
    @ApiProperty({ example: 'E-Klasse', type: String })
    readonly modell!: string;

    @IsInt()
    @Max(MAX_YEAR)
    @ApiProperty({ example: 2016, type: Number })
    readonly baujahr: number | undefined;

    @Matches(/^(PKW|LKW)$/u)
    @IsOptional()
    @ApiProperty({ example: 'LKW', type: String })
    readonly art: AutoArt | undefined;

    @Transform(number2Decimal)
    @Validate(DecimalMin, [Decimal(0)], {
        message: 'preis muss positiv sein.',
    })
    @ApiProperty({ example: 1, type: Number })
    // Decimal aus decimal.js analog zu BigDecimal von Java
    readonly preis!: Decimal;

    @IsOptional()
    @ArrayUnique()
    @ApiProperty({ example: ['ESB', 'ABS', 'AIRBAG', 'PARKASSISTENT'] })
    readonly sicherheitsmerkmale: string[] | undefined;
}

/**
 * Entity-Klasse für Autos ohne TypeORM.
 */
export class AutoDTO extends AutoDtoOhneRef {
    @ValidateNested()
    @Type(() => MotorDTO)
    @ApiProperty({ type: MotorDTO })
    readonly motor!: MotorDTO; // NOSONAR

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReperaturDTO)
    @ApiProperty({ type: [ReperaturDTO] })
    readonly reperaturen: ReperaturDTO[] | undefined;
}