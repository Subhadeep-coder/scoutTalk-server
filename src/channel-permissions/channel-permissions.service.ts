import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelOverride } from '../database/entities/channel-override.entity';
import { Channel } from '../database/entities/channel.entity';
import { ServerRole } from '../database/entities/server-role.entity';
import {
  ServerMember,
  MemberRole,
} from '../database/entities/server-member.entity';
import { MemberRole as MemberRoleEntity } from '../database/entities/member-role.entity';
import { ALL_PERMISSIONS } from '../roles/permissions';

@Injectable()
export class ChannelPermissionsService {
  constructor(
    @InjectRepository(ChannelOverride)
    private overrideRepository: Repository<ChannelOverride>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(ServerRole)
    private roleRepository: Repository<ServerRole>,
    @InjectRepository(ServerMember)
    private memberRepository: Repository<ServerMember>,
    @InjectRepository(MemberRoleEntity)
    private memberRoleRepository: Repository<MemberRoleEntity>,
  ) {}

  async resolveChannelPermissions(
    userId: string,
    channelId: string,
  ): Promise<string> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      select: ['id', 'serverId'],
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const member = await this.memberRepository.findOne({
      where: { serverId: channel.serverId, userId },
    });
    if (!member) {
      throw new ForbiddenException('You are not a member of this server');
    }

    if (member.role === MemberRole.OWNER) {
      return ALL_PERMISSIONS.toString();
    }

    const memberRoles = await this.memberRoleRepository.find({
      where: { memberId: member.id },
      relations: ['role'],
      order: { role: { position: 'ASC' } },
    });

    let effectivePerms = 0n;
    for (const mr of memberRoles) {
      if (mr.role) {
        effectivePerms |= BigInt(mr.role.permissions);
      }
    }

    effectivePerms = await this.applyOverrides(
      effectivePerms,
      channelId,
      memberRoles.map((mr) => mr.role),
      member.id,
    );

    return effectivePerms.toString();
  }

  async resolveFromServerPermissions(
    serverPerms: string,
    channelId: string,
    memberId: string,
  ): Promise<string> {
    const memberRoles = await this.memberRoleRepository.find({
      where: { memberId },
      relations: ['role'],
      order: { role: { position: 'ASC' } },
    });

    let effectivePerms = BigInt(serverPerms);

    effectivePerms = await this.applyOverrides(
      effectivePerms,
      channelId,
      memberRoles.map((mr) => mr.role),
      memberId,
    );

    return effectivePerms.toString();
  }

  private async applyOverrides(
    basePerms: bigint,
    channelId: string,
    roles: ServerRole[],
    memberId: string,
  ): Promise<bigint> {
    const overrides = await this.overrideRepository.find({
      where: { channelId },
    });

    const everyoneOverride = overrides.find(
      (o) => o.roleId && roles.find((r) => r.isDefault && r.id === o.roleId),
    );

    let effective = basePerms;

    if (everyoneOverride) {
      effective =
        (effective & ~BigInt(everyoneOverride.deny)) |
        BigInt(everyoneOverride.allow);
    }

    for (const role of roles) {
      const override = overrides.find((o) => o.roleId === role.id);
      if (override) {
        effective =
          (effective & ~BigInt(override.deny)) | BigInt(override.allow);
      }
    }

    const memberOverride = overrides.find((o) => o.memberId === memberId);
    if (memberOverride) {
      effective =
        (effective & ~BigInt(memberOverride.deny)) |
        BigInt(memberOverride.allow);
    }

    return effective;
  }

  async getOverridesForChannel(channelId: string) {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      select: ['id', 'serverId'],
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return this.overrideRepository.find({
      where: { channelId },
      relations: ['role', 'member', 'member.user'],
    });
  }

  async setRoleOverride(
    channelId: string,
    roleId: string,
    allow: string,
    deny: string,
  ) {
    const existing = await this.overrideRepository.findOne({
      where: { channelId, roleId },
    });

    if (existing) {
      existing.allow = allow;
      existing.deny = deny;
      return this.overrideRepository.save(existing);
    }

    return this.overrideRepository.save(
      this.overrideRepository.create({
        channelId,
        roleId,
        allow,
        deny,
      }),
    );
  }

  async removeRoleOverride(channelId: string, roleId: string) {
    const override = await this.overrideRepository.findOne({
      where: { channelId, roleId },
    });
    if (!override) {
      throw new NotFoundException('Override not found');
    }
    await this.overrideRepository.remove(override);
  }

  async setMemberOverride(
    channelId: string,
    memberId: string,
    allow: string,
    deny: string,
  ) {
    const existing = await this.overrideRepository.findOne({
      where: { channelId, memberId },
    });

    if (existing) {
      existing.allow = allow;
      existing.deny = deny;
      return this.overrideRepository.save(existing);
    }

    return this.overrideRepository.save(
      this.overrideRepository.create({
        channelId,
        memberId,
        allow,
        deny,
      }),
    );
  }

  async removeMemberOverride(channelId: string, memberId: string) {
    const override = await this.overrideRepository.findOne({
      where: { channelId, memberId },
    });
    if (!override) {
      throw new NotFoundException('Override not found');
    }
    await this.overrideRepository.remove(override);
  }
}
