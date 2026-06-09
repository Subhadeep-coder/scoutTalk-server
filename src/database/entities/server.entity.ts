import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Channel } from './channel.entity';
import { ServerMember } from './server-member.entity';
import { Invite } from './invite.entity';

@Entity('servers')
export class Server {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  name: string;

  @Column('uuid')
  ownerId: string;

  @Column('text', { nullable: true })
  avatar?: string;

  @Column('varchar', { unique: true })
  inviteCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => Category, (category) => category.server, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  categories: Category[];

  @OneToMany(() => Channel, (channel) => channel.server, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  channels: Channel[];

  @OneToMany(() => ServerMember, (member) => member.server, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  members: ServerMember[];

  @OneToMany(() => Invite, (invite) => invite.server, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  invites: Invite[];
}
