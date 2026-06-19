import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServerMember, MemberRole } from '../../database/entities/server-member.entity';
import { MemberRole as MemberRoleEntity } from '../../database/entities/member-role.entity';
import { Channel } from '../../database/entities/channel.entity';
import {
  PERMISSIONS_KEY,
  PermissionsMetadata,
} from '../decorators/permissions.decorator';
import { hasPermission } from '../permissions';
import { ChannelPermissionsService } from '../../channel-permissions/channel-permissions.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(ServerMember)
    private memberRepository: Repository<ServerMember>,
    @InjectRepository(MemberRoleEntity)
    private memberRoleRepository: Repository<MemberRoleEntity>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    private channelPermissionsService: ChannelPermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<PermissionsMetadata>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!metadata) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    if (!userId) return true;

    const paramName = metadata.paramName ?? 'serverId';
    let serverId =
      request.params[paramName] ?? request.params.id ?? request.params.serverId;
    const channelId = request.params.channelId;

    if (!serverId && channelId) {
      const channel = await this.channelRepository.findOne({
        where: { id: channelId },
        select: ['serverId'],
      });
      if (channel) {
        serverId = channel.serverId;
      }
    }

    if (!serverId) return true;

    const member = await this.memberRepository.findOne({
      where: { serverId, userId },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this server');
    }

    if (member.role === MemberRole.OWNER) return true;

    const memberRoles = await this.memberRoleRepository.find({
      where: { memberId: member.id },
      relations: ['role'],
    });

    let effectivePerms = 0n;
    for (const mr of memberRoles) {
      if (mr.role) {
        effectivePerms |= BigInt(mr.role.permissions);
      }
    }

    if (channelId) {
      effectivePerms = BigInt(
        await this.channelPermissionsService.resolveFromServerPermissions(
          effectivePerms.toString(),
          channelId,
          member.id,
        ),
      );
    }

    const required = BigInt(metadata.permission);
    if (!hasPermission(effectivePerms, required)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
