import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Server } from './server.entity';
import { MemberRole as MemberRoleEntity } from './member-role.entity';

export enum MemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

@Entity('server_members')
@Unique(['userId', 'serverId'])
export class ServerMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  serverId: string;

  @Column({ type: 'varchar', default: MemberRole.MEMBER })
  role: MemberRole;

  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Server, (server) => server.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @OneToMany(() => MemberRoleEntity, (mr) => mr.member, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  memberRoles: MemberRoleEntity[];
}
