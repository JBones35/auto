import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';
import { DecimalTransformer } from './decimal-transformer.js';
import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { dbType } from '../../config/db.js';
import { Reperatur } from './reperatur.entity.js';
import { Motor } from './motor.entity.js';
import { AutoFile } from './autoFile.entity.js';

export type AutoArt = 'PKW' | 'LKW';

@Entity()
export class Auto {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @VersionColumn()
    readonly version: number | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'W0L000051T2123456', type: String })
    readonly fahrgestellnummer: string | undefined;

    @Column()
    @ApiProperty({ example: 'BMW', type: String })
    readonly marke!: string;

    @Column()
    @ApiProperty({ example: 'X5', type: String })
    readonly modell!: string;

    @Column('int')
    @ApiProperty({ example: 2021, type: Number })
    readonly baujahr: number | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'PKW', type: String })
    readonly art: AutoArt | undefined;

    @Column('decimal', {
        precision: 8,
        scale: 2,
        // https://typeorm.io/entities#column-options
        transformer: new DecimalTransformer(),
    })
    @ApiProperty({ example: 1, type: Number })
    // Decimal aus decimal.js analog zu BigDecimal von Java
    readonly preis!: Decimal;

    @Column('simple-array')
    sicherheitsmerkmale: string[] | null | undefined;

    @OneToOne(() => Motor, (motor) => motor.auto, {
        cascade: ['insert', 'remove'],
    })
    readonly motor: Motor | undefined;

    @OneToMany(() => Reperatur, (reperatur) => reperatur.auto, {
        cascade: ['insert', 'remove'],
    })
    readonly reperaturen: Reperatur[] | undefined;

    @OneToOne(() => AutoFile, (autoFile) => autoFile.auto, {
        cascade: ['insert', 'remove'],
    })
    readonly file: AutoFile | undefined;

    @CreateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    readonly erzeugt: Date | undefined;

    @UpdateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    readonly aktualisiert: Date | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            fahrgestellnummer: this.fahrgestellnummer,
            marke: this.marke,
            modell: this.modell,
            baujahr: this.baujahr,
            art: this.art,
            preis: this.preis,
            sicherheitsmerkmale: this.sicherheitsmerkmale,
            erzeugt: this.erzeugt,
            aktualisiert: this.aktualisiert,
        });
}
