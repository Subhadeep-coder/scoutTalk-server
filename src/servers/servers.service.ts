import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  async create(userId: string, dto: CreateServerDto): Promise<Server> {
    const inviteCode = randomBytes(6).toString('base64url').slice(0, 8);

    const server = this.serverRepository.create({
      name: dto.name,
      ownerId: userId,
      avatar: dto.avatar,
      inviteCode,
    });

    const saved = await this.serverRepository.save(server);

    await this.memberRepository.save(
      this.memberRepository.create({
        userId,
        serverId: saved.id,
        role: MemberRole.OWNER,
      }),
    );

    const textCategory = await this.categoryRepository.save(
      this.categoryRepository.create({
        name: 'Text Channels',
        serverId: saved.id,
        position: 0,
      }),
    );

    const voiceCategory = await this.categoryRepository.save(
      this.categoryRepository.create({
        name: 'Voice Channels',
        serverId: saved.id,
        position: 1,
      }),
    );

    await this.channelRepository.save([
      this.channelRepository.create({
        name: 'general',
        serverId: saved.id,
        categoryId: textCategory.id,
        type: ChannelType.TEXT,
        position: 0,
      }),
      this.channelRepository.create({
        name: 'General',
        serverId: saved.id,
        categoryId: voiceCategory.id,
        type: ChannelType.VOICE,
        position: 0,
      }),
    ]);

    return this.findById(saved.id);
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
