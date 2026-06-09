import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../database/entities/server.entity';
import {
  ServerMember,
  MemberRole,
} from '../database/entities/server-member.entity';
import { Invite } from '../database/entities/invite.entity';
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
  ) {}

  async getMembers(serverId: string): Promise<ServerMember[]> {
    return this.memberRepository.find({
      where: { serverId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
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

    if (!requesterMember || requesterMember.role === MemberRole.MEMBER) {
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
    maxUses?: number,
  ): Promise<Invite> {
    const member = await this.memberRepository.findOne({
      where: { serverId, userId },
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this server');
    }

    const code = randomBytes(6).toString('base64url').slice(0, 8);

    const invite = this.inviteRepository.create({
      code,
      serverId,
      createdBy: userId,
      maxUses,
    });

    return this.inviteRepository.save(invite);
  }

  async getInvite(code: string): Promise<Invite> {
    const invite = await this.inviteRepository.findOne({
      where: { code },
      relations: ['server'],
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite has expired');
    }

    if (invite.maxUses && invite.useCount >= invite.maxUses) {
      throw new BadRequestException('Invite has reached maximum uses');
    }

    return invite;
  }

  async joinViaInvite(code: string, userId: string): Promise<Server> {
    const invite = await this.getInvite(code);

    const existing = await this.memberRepository.findOne({
      where: { serverId: invite.serverId, userId },
    });

    if (existing) {
      throw new ConflictException('You are already a member of this server');
    }

    await this.memberRepository.save(
      this.memberRepository.create({
        userId,
        serverId: invite.serverId,
        role: MemberRole.MEMBER,
      }),
    );

    if (invite.maxUses) {
      invite.useCount += 1;
      await this.inviteRepository.save(invite);
    }

    return this.serverRepository.findOneOrFail({
      where: { id: invite.serverId },
      relations: ['categories', 'channels', 'members'],
    });
  }
}
