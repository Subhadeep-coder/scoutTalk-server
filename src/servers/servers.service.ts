import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Server } from '../database/entities/server.entity';
import { Category } from '../database/entities/category.entity';
import { Channel, ChannelType } from '../database/entities/channel.entity';
import {
  ServerMember,
  MemberRole,
} from '../database/entities/server-member.entity';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { ServerEngagementConfig } from '../database/entities/server-engagement-config.entity';
import { WelcomeMessage } from '../database/entities/welcome-message.entity';
import { ServerRole } from '../database/entities/server-role.entity';
import { MemberRole as MemberRoleEntity } from '../database/entities/member-role.entity';
import {
  ALL_PERMISSIONS,
  EVERYONE_DEFAULT_PERMISSIONS,
} from '../roles/permissions';

@Injectable()
export class ServersService {
  private readonly logger = new Logger(ServersService.name);

  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(ServerMember)
    private memberRepository: Repository<ServerMember>,
    private dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateServerDto): Promise<Server> {
    const inviteCode = randomBytes(6).toString('base64url').slice(0, 8);

    const result = await this.dataSource.transaction(async (manager) => {
      const server = await manager.save(
        manager.create(Server, {
          name: dto.name,
          ownerId: userId,
          avatar: dto.avatar,
          inviteCode,
        }),
      );

      const member = await manager.save(
        manager.create(ServerMember, {
          userId,
          serverId: server.id,
          role: MemberRole.OWNER,
        }),
      );

      const textCategory = await manager.save(
        manager.create(Category, {
          name: 'Text Channels',
          serverId: server.id,
          position: 0,
        }),
      );

      const voiceCategory = await manager.save(
        manager.create(Category, {
          name: 'Voice Channels',
          serverId: server.id,
          position: 1,
        }),
      );

      const generalChannel = await manager.save(
        manager.create(Channel, {
          name: 'general',
          serverId: server.id,
          categoryId: textCategory.id,
          type: ChannelType.TEXT,
          position: 0,
        }),
      );

      await manager.save(
        manager.create(Channel, {
          name: 'general',
          serverId: server.id,
          categoryId: voiceCategory.id,
          type: ChannelType.VOICE,
          position: 0,
        }),
      );

      const everyoneRole = await manager.save(
        manager.create(ServerRole, {
          serverId: server.id,
          name: '@everyone',
          position: 0,
          isDefault: true,
          permissions: EVERYONE_DEFAULT_PERMISSIONS.toString(),
        }),
      );

      const adminRole = await manager.save(
        manager.create(ServerRole, {
          serverId: server.id,
          name: 'Admin',
          color: '#FF0000',
          position: 1,
          mentionable: true,
          permissions: ALL_PERMISSIONS.toString(),
        }),
      );

      await manager.save([
        manager.create(MemberRoleEntity, {
          memberId: member.id,
          roleId: everyoneRole.id,
        }),
        manager.create(MemberRoleEntity, {
          memberId: member.id,
          roleId: adminRole.id,
        }),
      ]);

      await manager.save(
        manager.create(ServerEngagementConfig, {
          serverId: server.id,
          systemChannelId: generalChannel.id,
          welcomeEnabled: true,
          stickerPromptEnabled: true,
          boostMessageEnabled: true,
        }),
      );

      await manager.save(
        manager.create(WelcomeMessage, {
          serverId: server.id,
          content: 'Welcome {user} to the server!',
          isEnabled: true,
          displayOrder: 0,
        }),
      );

      return server.id;
    });

    return this.findById(result);
  }

  async findById(serverId: string): Promise<Server> {
    const server = await this.serverRepository.findOne({
      where: { id: serverId },
      relations: ['categories', 'channels', 'members'],
      order: {
        categories: { position: 'ASC' },
        channels: { position: 'ASC' },
      },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    return server;
  }

  async findByMemberId(userId: string): Promise<Server[]> {
    return this.serverRepository.find({
      where: { members: { userId } },
      select: ['id', 'name', 'ownerId', 'avatar', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    serverId: string,
    userId: string,
    dto: UpdateServerDto,
  ): Promise<Server> {
    const server = await this.findById(serverId);

    if (server.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the server owner can update the server',
      );
    }

    await this.serverRepository.update(serverId, dto);
    return this.findById(serverId);
  }

  async delete(serverId: string, userId: string): Promise<void> {
    const server = await this.findById(serverId);

    if (server.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the server owner can delete the server',
      );
    }

    await this.serverRepository.remove(server);
  }

  async leave(serverId: string, userId: string): Promise<void> {
    const server = await this.findById(serverId);

    if (server.ownerId === userId) {
      throw new ForbiddenException(
        'Server owner cannot leave. Transfer ownership or delete the server.',
      );
    }

    await this.memberRepository.delete({ serverId, userId });
  }
}
