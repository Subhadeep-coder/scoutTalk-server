import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Server } from './server.entity';
import { Category } from './category.entity';

export enum ChannelType {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
}

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  name: string;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeName() {
    this.name = this.name.toLowerCase().replace(/\s+/g, '-');
  }

  @Column('uuid')
  serverId: string;

  @Column('uuid', { nullable: true })
  categoryId?: string;

  @Column({ type: 'varchar', default: ChannelType.TEXT })
  type: ChannelType;

  @Column('int', { default: 0 })
  position: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Server, (server) => server.channels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @ManyToOne(() => Category, (category) => category.channels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;
}
