import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Auto } from './auto.entity.js';
import { binaryType } from '../../config/db.js';

/**
 * Entitätsklasse, die eine Datei repräsentiert, die einem Auto zugeordnet ist.
 * Definiert die Struktur und die Beziehungen einer Autodatei in der Datenbank.
 */
@Entity()
export class AutoFile {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('varchar')
    filename: string | undefined;

    @Column('varchar')
    mimetype: string | undefined;

    @OneToOne(() => Auto, (auto) => auto.file)
    @JoinColumn({ name: 'auto_id' })
    auto: Auto | undefined;

    @Column({ type: binaryType })
    data: Uint8Array | undefined;

    /**
     * Gibt eine String-Repräsentation des AutoFile-Objekts zurück.
     * Die Repräsentation ist ein JSON-String, der die ID, den Dateinamen und den Mimetype der Datei enthält.
     * @returns Eine JSON-formatierte Zeichenkette des AutoFile-Objekts.
     */
    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            filename: this.filename,
            mimetype: this.mimetype,
        });
}
