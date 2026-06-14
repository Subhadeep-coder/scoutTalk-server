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
import { Channel } from './channel.entity';

export enum WelcomeSelectionStrategy {
  SINGLE = 'single',
  ROUND_ROBIN = 'round_robin',
  RANDOM = 'random',
}

@Entity('server_engagement_configs')
export class ServerEngagementConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  serverId: string;

  @Column('uuid', { nullable: true })
  systemChannelId?: string;

  @Column('boolean', { default: false })
  welcomeEnabled: boolean;

  @Column({
    type: 'varchar',
    default: WelcomeSelectionStrategy.SINGLE,
  })
  welcomeSelectionStrategy: WelcomeSelectionStrategy;

  @Column('boolean', { default: false })
  stickerPromptEnabled: boolean;

  @Column('boolean', { default: false })
  boostMessageEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Server, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @ManyToOne(() => Channel, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'systemChannelId' })
  systemChannel?: Channel;
}
