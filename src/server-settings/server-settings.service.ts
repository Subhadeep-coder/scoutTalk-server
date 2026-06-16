import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../database/entities/server.entity';
import {
  ServerMember,
  MemberRole,
} from '../database/entities/server-member.entity';
import { ServerTag } from '../database/entities/server-tag.entity';
import {
  ServerEngagementConfig,
  WelcomeSelectionStrategy,
} from '../database/entities/server-engagement-config.entity';
import { WelcomeMessage } from '../database/entities/welcome-message.entity';
import { SetTagDto } from './dto/set-tag.dto';
import { UpdateEngagementDto } from './dto/update-engagement.dto';
import { CreateWelcomeMessageDto } from './dto/create-welcome-message.dto';
import { UpdateWelcomeMessageDto } from './dto/update-welcome-message.dto';

@Injectable()
export class ServerSettingsService {
  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    @InjectRepository(ServerMember)
    private memberRepository: Repository<ServerMember>,
    @InjectRepository(ServerTag)
    private tagRepository: Repository<ServerTag>,
    @InjectRepository(ServerEngagementConfig)
    private engagementRepository: Repository<ServerEngagementConfig>,
    @InjectRepository(WelcomeMessage)
    private welcomeMessageRepository: Repository<WelcomeMessage>,
  ) {}

  private async assertAdmin(serverId: string, userId: string): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { serverId, userId },
    });
    if (!member) {
      throw new NotFoundException('You are not a member of this server');
    }
    if (member.role === MemberRole.MEMBER) {
      throw new ForbiddenException(
        'Only admins and the owner can manage server settings',
      );
    }
  }

  private async assertMember(serverId: string, userId: string): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { serverId, userId },
    });
    if (!member) {
      throw new NotFoundException('You are not a member of this server');
    }
  }

  async getTag(serverId: string): Promise<ServerTag | null> {
    const server = await this.serverRepository.findOne({
      where: { id: serverId },
      relations: ['tag'],
    });
    if (!server) throw new NotFoundException('Server not found');
    return server.tag ?? null;
  }

  async setTag(
    serverId: string,
    userId: string,
    dto: SetTagDto,
  ): Promise<ServerTag> {
    await this.assertAdmin(serverId, userId);

    const server = await this.serverRepository.findOne({
      where: { id: serverId },
    });
    if (!server) throw new NotFoundException('Server not found');

    let tag = await this.tagRepository.findOne({ where: { serverId } });
    if (tag) {
      tag.tag = dto.tag;
      tag.icon = dto.icon ?? tag.icon;
      tag.color = dto.color ?? tag.color;
    } else {
      tag = this.tagRepository.create({
        serverId,
        tag: dto.tag,
        icon: dto.icon,
        color: dto.color,
      });
    }

    return this.tagRepository.save(tag);
  }

  async deleteTag(serverId: string, userId: string): Promise<void> {
    await this.assertAdmin(serverId, userId);
    const tag = await this.tagRepository.findOne({ where: { serverId } });
    if (tag) {
      await this.tagRepository.remove(tag);
    }
  }

  async getEngagement(serverId: string): Promise<ServerEngagementConfig> {
    const server = await this.serverRepository.findOne({
      where: { id: serverId },
    });
    if (!server) throw new NotFoundException('Server not found');

    let config = await this.engagementRepository.findOne({
      where: { serverId },
    });
    if (!config) {
      config = this.engagementRepository.create({
        serverId,
        welcomeSelectionStrategy: WelcomeSelectionStrategy.SINGLE,
      });
      try {
        config = await this.engagementRepository.save(config);
      } catch {
        config = await this.engagementRepository.findOne({
          where: { serverId },
        });
        if (!config) throw new Error('Failed to create engagement config');
      }
    }
    return config;
  }

  async updateEngagement(
    serverId: string,
    userId: string,
    dto: UpdateEngagementDto,
  ): Promise<ServerEngagementConfig> {
    await this.assertAdmin(serverId, userId);

    const config = await this.getEngagement(serverId);
    if (dto.systemChannelId !== undefined)
      config.systemChannelId = dto.systemChannelId;
    if (dto.welcomeEnabled !== undefined)
      config.welcomeEnabled = dto.welcomeEnabled;
    if (dto.welcomeSelectionStrategy !== undefined)
      config.welcomeSelectionStrategy = dto.welcomeSelectionStrategy;
    if (dto.stickerPromptEnabled !== undefined)
      config.stickerPromptEnabled = dto.stickerPromptEnabled;
    if (dto.boostMessageEnabled !== undefined)
      config.boostMessageEnabled = dto.boostMessageEnabled;

    return this.engagementRepository.save(config);
  }

  async getWelcomeMessages(serverId: string): Promise<WelcomeMessage[]> {
    const server = await this.serverRepository.findOne({
      where: { id: serverId },
    });
    if (!server) throw new NotFoundException('Server not found');

    return this.welcomeMessageRepository.find({
      where: { serverId },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async createWelcomeMessage(
    serverId: string,
    userId: string,
    dto: CreateWelcomeMessageDto,
  ): Promise<WelcomeMessage> {
    await this.assertAdmin(serverId, userId);

    const msg = this.welcomeMessageRepository.create({
      serverId,
      content: dto.content,
      isEnabled: dto.isEnabled ?? true,
      displayOrder: dto.displayOrder ?? undefined,
    });

    return this.welcomeMessageRepository.save(msg);
  }

  async updateWelcomeMessage(
    serverId: string,
    messageId: string,
    userId: string,
    dto: UpdateWelcomeMessageDto,
  ): Promise<WelcomeMessage> {
    await this.assertAdmin(serverId, userId);

    const msg = await this.welcomeMessageRepository.findOne({
      where: { id: messageId, serverId },
    });
    if (!msg) throw new NotFoundException('Welcome message not found');

    if (dto.content !== undefined) msg.content = dto.content;
    if (dto.isEnabled !== undefined) msg.isEnabled = dto.isEnabled;
    if (dto.displayOrder !== undefined) msg.displayOrder = dto.displayOrder;

    return this.welcomeMessageRepository.save(msg);
  }

  async deleteWelcomeMessage(
    serverId: string,
    messageId: string,
    userId: string,
  ): Promise<void> {
    await this.assertAdmin(serverId, userId);

    const msg = await this.welcomeMessageRepository.findOne({
      where: { id: messageId, serverId },
    });
    if (!msg) throw new NotFoundException('Welcome message not found');

    await this.welcomeMessageRepository.remove(msg);
  }
}
