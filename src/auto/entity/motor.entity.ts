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

@Entity()
export class Motor {
    @PrimaryGeneratedColumn()
    id: number | undefined;
    @Column()
    readonly name!: string;

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

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            name: this.name,
            ps: this.ps,
            zylinder: this.zylinder,
            drehzahl: this.drehzahl,
        });
}
