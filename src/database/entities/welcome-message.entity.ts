import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Server } from './server.entity';

@Entity('welcome_messages')
export class WelcomeMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  serverId: string;

  @Column('text')
  content: string;

  @Column('boolean', { default: true })
  isEnabled: boolean;

  @Column('int', { nullable: true })
  displayOrder: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Server, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serverId' })
  server: Server;
}
