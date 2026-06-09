import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Server } from './server.entity';
import { Channel } from './channel.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  name: string;

  @Column('uuid')
  serverId: string;

  @Column('int', { default: 0 })
  position: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Server, (server) => server.categories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @OneToMany(() => Channel, (channel) => channel.category, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  channels: Channel[];
}
