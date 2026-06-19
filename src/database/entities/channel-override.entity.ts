import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Channel } from './channel.entity';
import { ServerRole } from './server-role.entity';
import { ServerMember } from './server-member.entity';

@Entity('channel_overrides')
@Unique(['channelId', 'roleId'])
@Unique(['channelId', 'memberId'])
export class ChannelOverride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  channelId: string;

  @Column('uuid', { nullable: true })
  roleId?: string;

  @Column('uuid', { nullable: true })
  memberId?: string;

  @Column('bigint', { default: '0' })
  allow: string;

  @Column('bigint', { default: '0' })
  deny: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Channel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channelId' })
  channel: Channel;

  @ManyToOne(() => ServerRole, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role?: ServerRole;

  @ManyToOne(() => ServerMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memberId' })
  member?: ServerMember;
}
