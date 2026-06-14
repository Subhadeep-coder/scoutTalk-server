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

@Entity('server_tags')
export class ServerTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  serverId: string;

  @Column('varchar', { length: 4 })
  tag: string;

  @Column('text', { nullable: true })
  icon?: string;

  @Column('varchar', { nullable: true })
  color?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Server, (server) => server.tag, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serverId' })
  server: Server;
}
