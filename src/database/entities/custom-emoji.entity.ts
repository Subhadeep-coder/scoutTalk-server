import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Server } from './server.entity';
import { User } from './user.entity';

@Entity('custom_emojis')
@Unique(['serverId', 'name'])
export class CustomEmoji {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  serverId: string;

  @Column('varchar', { length: 32 })
  name: string;

  @Column('varchar')
  imageUrl: string;

  @Column('uuid')
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Server, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serverId' })
  server: Server;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdBy' })
  creator: User;
}
