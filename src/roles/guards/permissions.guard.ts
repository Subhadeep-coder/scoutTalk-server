import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServerMember } from '../../database/entities/server-member.entity';
import { MemberRole as MemberRoleEntity } from '../../database/entities/member-role.entity';
import {
  PERMISSIONS_KEY,
  PermissionsMetadata,
} from '../decorators/permissions.decorator';
import { MemberRole } from '../../database/entities/server-member.entity';
import { hasPermission } from '../permissions';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(ServerMember)
    private memberRepository: Repository<ServerMember>,
    @InjectRepository(MemberRoleEntity)
    private memberRoleRepository: Repository<MemberRoleEntity>,
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
    const serverId =
      request.params[paramName] ?? request.params.id ?? request.params.serverId;
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

    const required = BigInt(metadata.permission);
    if (!hasPermission(effectivePerms, required)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
