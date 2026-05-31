import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RefreshToken } from './refresh-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { unique: true, nullable: true })
  googleId?: string;

  @Column('varchar', { unique: true })
  email: string;

  @Column('varchar', { nullable: true, select: false })
  password?: string;

  @Column('varchar', { nullable: true, unique: true })
  username?: string;

  @Column('varchar', { nullable: true })
  firstName?: string;

  @Column('varchar', { nullable: true })
  lastName?: string;

  @Column('varchar', { nullable: true })
  displayName?: string;

  @Column('text', { nullable: true })
  avatar?: string;

  @Column('boolean', { default: true })
  needsOnboarding: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RefreshToken, (token) => token.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  refreshTokens: RefreshToken[];
}
