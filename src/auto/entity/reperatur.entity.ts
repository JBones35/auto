import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { DecimalTransformer } from './decimal-transformer.js';
import Decimal from 'decimal.js';
import { Auto } from './auto.entity.js';

/**
 * Entitätsklasse, die eine Reparatur in der Datenbank repräsentiert.
 * Definiert die Struktur und die Beziehungen einer Reparatur, die einem Auto zugeordnet ist.
 */
@Entity()
export class Reperatur {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('decimal', {
        precision: 4,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    readonly kosten: Decimal | undefined;

    @Column('varchar')
    readonly mechaniker: string | undefined;

    @Column('date')
    readonly datum: Date | string | undefined;

    @ManyToOne(() => Auto, (auto) => auto.reperaturen)
    @JoinColumn({ name: 'auto_id' })
    auto: Auto | undefined;

    /**
     * Gibt eine String-Repräsentation des Reperatur-Objekts zurück.
     * Die Repräsentation ist ein JSON-String, der die ID, die Kosten,
     * den Mechaniker und das Datum der Reparatur enthält.
     * @returns Eine JSON-formatierte Zeichenkette des Reperatur-Objekts.
     */
    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            kosten: this.kosten,
            mechaniker: this.mechaniker,
            datum: this.datum,
        });
}