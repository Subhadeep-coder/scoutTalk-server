import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ServerMember } from './server-member.entity';
import { ServerRole } from './server-role.entity';

@Entity('member_roles')
@Unique(['memberId', 'roleId'])
export class MemberRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  memberId: string;

  @Column('uuid')
  roleId: string;

  @CreateDateColumn()
  assignedAt: Date;

  @ManyToOne(() => ServerMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memberId' })
  member: ServerMember;

  @ManyToOne(() => ServerRole, (role) => role.memberRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roleId' })
  role: ServerRole;
}
