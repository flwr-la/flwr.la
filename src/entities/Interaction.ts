import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index
} from 'typeorm';
import { Flower } from './Flower';

@Entity('interactions')
export class Interaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Flower, flower => flower.interactions)
  @Index()
  flower: Flower;

  @Column()
  sessionId: string;

  @Column({ type: 'text' })
  input: string;

  @Column({ type: 'text' })
  response: string;

  @Column({ type: 'jsonb' })
  metadata: {
    tokensUsed: number;
    responseTime: number;
    model: string;
    temperature: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  stateChange: {
    before: any;
    after: any;
  };

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
