import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Auto } from './auto.entity.js';
import { binaryType } from '../../config/db.js';

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

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            filename: this.filename,
            mimetype: this.mimetype,
        });
}
