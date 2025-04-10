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

    @Column()
    readonly mechaniker!: string;

    @Column('date')
    readonly datum: Date | string | undefined;

    @ManyToOne(() => Auto, (auto) => auto.reperaturen)
    @JoinColumn({ name: 'auto_id' })
    auto: Auto | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            kosten: this.kosten,
            mechaniker: this.mechaniker,
            datum: this.datum,
        });
}
