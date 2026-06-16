import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Server } from './server.entity';
import { MemberRole } from './member-role.entity';

@Entity('server_roles')
@Unique(['serverId', 'name'])
export class ServerRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  serverId: string;

  @Column('varchar')
  name: string;

  @Column('varchar', { nullable: true })
  color?: string;

  @Column('boolean', { default: false })
  mentionable: boolean;

  @Column('int', { default: 0 })
  position: number;

  @Column('boolean', { default: false })
  isDefault: boolean;

  @Column('bigint', { default: '0' })
  permissions: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Server, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @OneToMany(() => MemberRole, (mr) => mr.role, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  memberRoles: MemberRole[];
}
