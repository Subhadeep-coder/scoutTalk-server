import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Server } from './server.entity';
import { User } from './user.entity';

@Entity('invites')
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { unique: true })
  code: string;

  @Column('uuid')
  serverId: string;

  @Column('uuid')
  createdBy: string;

  @Column('timestamp', { nullable: true })
  expiresAt?: Date;

  @Column('int', { nullable: true })
  maxUses?: number;

  @Column('int', { default: 0 })
  useCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Server, (server) => server.invites, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdBy' })
  creator: User;
}
