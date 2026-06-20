import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export type SystemMessageType = 'join' | 'boost' | 'pin' | 'default';
import { User } from './user.entity';
import { Server } from './server.entity';
import { Channel } from './channel.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  authorId: string | null;

  @Column('uuid')
  channelId: string;

  @Column('uuid')
  serverId: string;

  @Column('uuid', { nullable: true })
  parentId?: string;

  @Column('text', { nullable: true })
  content: string | null;

  @Column('jsonb', { nullable: true, default: null })
  attachments?: Array<{
    url: string;
    type: string;
    name?: string;
  }>;

  @Column('boolean', { default: false })
  isEdited: boolean;

  @Column('boolean', { default: false })
  isSystem: boolean;

  @Column('varchar', { nullable: true })
  systemType: SystemMessageType | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'authorId' })
  author: User | null;

  @ManyToOne(() => Channel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channelId' })
  channel: Channel;

  @ManyToOne(() => Server, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @ManyToOne(() => Message, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'parentId' })
  parent?: Message;
}
