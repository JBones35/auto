import Decimal from 'decimal.js';
import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Auto } from './auto.entity.js';
import { DecimalTransformer } from './decimal-transformer.js';

/**
 * Entitätsklasse, die einen Motor in der Datenbank repräsentiert.
 * Definiert die Struktur und die Beziehungen eines Motors, der einem Auto zugeordnet sein kann.
 */
@Entity()
export class Motor {
    @PrimaryGeneratedColumn()
    id: number | undefined;
    @Column('varchar')
    readonly name: string | undefined;

    @Column('int')
    readonly ps: number | undefined;

    @Column('int')
    readonly zylinder: number | undefined;

    @Column('decimal', {
        precision: 4,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    readonly drehzahl: Decimal | undefined;

    @OneToOne(() => Auto, (auto) => auto.modell)
    @JoinColumn({ name: 'auto_id' })
    auto: Auto | undefined;

    /**
     * Gibt eine String-Repräsentation des Motor-Objekts zurück.
     * Die Repräsentation ist ein JSON-String, der die ID, den Namen, die PS-Zahl,
     * die Zylinderanzahl und die Drehzahl des Motors enthält.
     * @returns Eine JSON-formatierte Zeichenkette des Motor-Objekts.
     */
    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            name: this.name,
            ps: this.ps,
            zylinder: this.zylinder,
            drehzahl: this.drehzahl,
        });
}
