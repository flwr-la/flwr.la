import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index
} from 'typeorm';
import { User } from './User';
import { Interaction } from './Interaction';

@Entity('flowers')
export class Flower {
  @PrimaryColumn()
  id: string;

  @Column()
  type: string;

  @Column({ default: '1.0' })
  version: string;

  @ManyToOne(() => User, user => user.flowers)
  @Index()
  user: User;

  @Column({ type: 'jsonb' })
  metadata: {
    created: string;
    lastBloomed: string | null;
    bloomCount: number;
  };

  @Column({ type: 'jsonb' })
  genome: {
    baseModel: string;
    temperature: number;
    systemPrompt: string;
    traits: string[];
  };

  @Column({ type: 'jsonb' })
  memory: {
    shortTerm: any[];
    longTerm: any[];
    episodic: any[];
  };

  @Column({ type: 'jsonb' })
  state: {
    currentMood: string;
    energyLevel: number;
    coherence: number;
  };

  @Column({ default: false })
  isArchived: boolean;

  @OneToMany(() => Interaction, interaction => interaction.flower)
  interactions: Interaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
