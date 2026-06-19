import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { Server } from '../database/entities/server.entity';
import {
  ServerMember,
  MemberRole,
} from '../database/entities/server-member.entity';
import { Invite } from '../database/entities/invite.entity';
import { ServerEngagementConfig } from '../database/entities/server-engagement-config.entity';
import { WelcomeMessage } from '../database/entities/welcome-message.entity';
import { Message } from '../database/entities/message.entity';
import { Channel } from '../database/entities/channel.entity';
import { WebsocketService } from '../websocket/websocket.service';
import { User } from '../database/entities/user.entity';
import { RolesService } from '../roles/roles.service';
import { Permissions } from '../roles/permissions';
import { randomBytes } from 'crypto';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    @InjectRepository(ServerMember)
    private memberRepository: Repository<ServerMember>,
    @InjectRepository(Invite)
    private inviteRepository: Repository<Invite>,
    @InjectRepository(ServerEngagementConfig)
    private engagementRepository: Repository<ServerEngagementConfig>,
    @InjectRepository(WelcomeMessage)
    private welcomeMessageRepository: Repository<WelcomeMessage>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private websocketService: WebsocketService,
    private rolesService: RolesService,
    private configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('app.frontendUrl')!;
  }

  private readonly frontendUrl: string;

  async getMembers(
    serverId: string,
    requesterId: string,
  ): Promise<ServerMember[]> {
    const requester = await this.memberRepository.findOne({
      where: { serverId, userId: requesterId },
    });
    if (!requester) {
      throw new NotFoundException('You are not a member of this server');
    }

    return this.memberRepository
      .createQueryBuilder('member')
      .leftJoin('member.user', 'user')
      .leftJoinAndSelect('member.memberRoles', 'memberRoles')
      .leftJoin('memberRoles.role', 'role')
      .leftJoin('member.invite', 'invite')
      .leftJoin('invite.creator', 'inviteCreator')
      .addSelect([
        'user.id',
        'user.username',
        'user.firstName',
        'user.lastName',
        'user.displayName',
        'user.avatar',
        'user.activeServerTagId',
        'role.name',
        'role.color',
        'invite.code',
        'inviteCreator.id',
        'inviteCreator.displayName',
        'inviteCreator.avatar',
      ])
      .where('member.serverId = :serverId', { serverId })
      .orderBy('member.joinedAt', 'ASC')
      .getMany();
  }

  async kickMember(
    serverId: string,
    userId: string,
    requesterId: string,
  ): Promise<void> {
    if (userId === requesterId) {
      throw new BadRequestException(
        'Use /servers/:id/leave to leave the server',
      );
    }

    const requesterMember = await this.memberRepository.findOne({
      where: { serverId, userId: requesterId },
    });

    if (!requesterMember) {
      throw new BadRequestException(
        'You do not have permission to kick members',
      );
    }

    const canKick = await this.rolesService.checkPermission(
      serverId,
      requesterId,
      Permissions.KICK_MEMBERS,
    );
    if (!canKick) {
      throw new BadRequestException(
        'You do not have permission to kick members',
      );
    }

    const target = await this.memberRepository.findOne({
      where: { serverId, userId },
    });

    if (!target) {
      throw new NotFoundException('Member not found');
    }

    if (target.role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot kick the server owner');
    }

    await this.memberRepository.remove(target);
  }

  async generateInvite(
    serverId: string,
    userId: string,
    options?: { maxUses?: number; expiresInDays?: number; channelId?: string },
  ): Promise<{ inviteUrl: string }> {
    const member = await this.memberRepository.findOne({
      where: { serverId, userId },
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this server');
    }

    const code = randomBytes(6).toString('base64url').slice(0, 8);
    const expiresInDays = options?.expiresInDays ?? 30;

    const invite = this.inviteRepository.create({
      code,
      serverId,
      createdBy: userId,
      maxUses: options?.maxUses,
      channelId: options?.channelId,
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
    });

    await this.inviteRepository.save(invite);
    return { inviteUrl: `${this.frontendUrl}/invite/${code}` };
  }

  async getInvite(code: string): Promise<Invite> {
    const invite = await this.inviteRepository
      .createQueryBuilder('invite')
      .leftJoinAndSelect('invite.server', 'server')
      .leftJoin('invite.creator', 'creator')
      .addSelect([
        'creator.id',
        'creator.username',
        'creator.displayName',
        'creator.avatar',
      ])
      .where('invite.code = :code', { code })
      .getOne();

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite has expired');
    }

    if (invite.maxUses && invite.useCount >= invite.maxUses) {
      throw new BadRequestException('Invite has reached maximum uses');
    }

    const memberCount = await this.memberRepository.count({
      where: { serverId: invite.serverId },
    });

    return Object.assign(this.attachInviteUrl(invite), { memberCount });
  }

  async joinViaInvite(code: string, userId: string): Promise<Server> {
    const invite = await this.getInvite(code);

    const existing = await this.memberRepository.findOne({
      where: { serverId: invite.serverId, userId },
    });

    if (existing) {
      throw new ConflictException('You are already a member of this server');
    }

    const member = await this.dataSource.transaction(async (manager) => {
      const saved = await manager.save(
        manager.create(ServerMember, {
          userId,
          serverId: invite.serverId,
          role: MemberRole.MEMBER,
          joinedViaInviteId: invite.id,
        }),
      );

      await manager.getRepository(Invite).update(invite.id, {
        useCount: () => '"useCount" + 1',
      });

      await this.rolesService.assignEveryoneRole(
        saved.id,
        invite.serverId,
        manager,
      );

      return saved;
    });
    await this.sendWelcomeMessage(invite.serverId, userId);

    return this.serverRepository.findOneOrFail({
      where: { id: invite.serverId },
      relations: ['categories', 'channels', 'members'],
    });
  }

  async getServerInvites(serverId: string, userId: string): Promise<Invite[]> {
    const member = await this.memberRepository.findOne({
      where: { serverId, userId },
    });
    if (!member) {
      throw new NotFoundException('You are not a member of this server');
    }

    const invites = await this.inviteRepository
      .createQueryBuilder('invite')
      .leftJoin('invite.creator', 'creator')
      .addSelect([
        'creator.id',
        'creator.username',
        'creator.displayName',
        'creator.avatar',
      ])
      .where('invite.serverId = :serverId', { serverId })
      .andWhere('(invite.expiresAt IS NULL OR invite.expiresAt > :now)', {
        now: new Date(),
      })
      .andWhere('(invite.maxUses IS NULL OR invite.useCount < invite.maxUses)')
      .orderBy('invite.createdAt', 'DESC')
      .getMany();

    return invites.map((inv) => this.attachInviteUrl(inv));
  }

  async revokeInvite(
    inviteId: string,
    serverId: string,
    userId: string,
  ): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { serverId, userId },
    });
    if (!member) {
      throw new NotFoundException('You are not a member of this server');
    }

    const invite = await this.inviteRepository.findOne({
      where: { id: inviteId, serverId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    await this.inviteRepository.remove(invite);
  }

  private attachInviteUrl(invite: Invite): Invite & { inviteUrl: string } {
    return Object.assign(invite, {
      inviteUrl: `${this.frontendUrl}/invite/${invite.code}`,
    });
  }

  private async sendWelcomeMessage(
    serverId: string,
    userId: string,
  ): Promise<void> {
    try {
      const config = await this.engagementRepository.findOne({
        where: { serverId },
      });

      if (!config?.welcomeEnabled || !config.systemChannelId) return;

      const channel = await this.channelRepository.findOne({
        where: { id: config.systemChannelId, serverId },
      });
      if (!channel) return;

      const messages = await this.welcomeMessageRepository.find({
        where: { serverId, isEnabled: true },
        order: { displayOrder: 'ASC', createdAt: 'ASC' },
      });

      if (messages.length === 0) return;

      const user = await this.userRepository.findOne({ where: { id: userId } });
      const mention = user ? `<@${userId}>` : 'Someone';

      let selected: WelcomeMessage;
      switch (config.welcomeSelectionStrategy) {
        case 'round_robin': {
          const index =
            (await this.messageRepository.count({
              where: { serverId, isSystem: true },
            })) % messages.length;
          selected = messages[index];
          break;
        }
        case 'random':
          selected = messages[Math.floor(Math.random() * messages.length)];
          break;
        default:
          selected = messages[0];
      }

      const content = selected.content.replace(
        /\{user\}/g,
        user?.displayName ?? mention,
      );

      const message = this.messageRepository.create({
        authorId: userId,
        channelId: config.systemChannelId,
        serverId,
        content,
        attachments: [],
        isSystem: true,
      });

      const saved = await this.messageRepository.save(message);
      const result = await this.messageRepository.findOne({
        where: { id: saved.id },
        relations: ['author'],
      });

      this.websocketService.emitToServer(serverId, 'message:new', result);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome message for server ${serverId}`,
        error,
      );
    }
  }
}
