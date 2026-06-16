import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Server } from '../database/entities/server.entity';
import {
  ServerMember,
  MemberRole,
} from '../database/entities/server-member.entity';
import { ServerRole } from '../database/entities/server-role.entity';
import { MemberRole as MemberRoleEntity } from '../database/entities/member-role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ReorderRolesDto } from './dto/reorder-roles.dto';
import {
  ALL_PERMISSIONS,
  hasPermission,
} from './permissions';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    @InjectRepository(ServerMember)
    private memberRepository: Repository<ServerMember>,
    @InjectRepository(ServerRole)
    private roleRepository: Repository<ServerRole>,
    @InjectRepository(MemberRoleEntity)
    private memberRoleRepository: Repository<MemberRoleEntity>,
    private dataSource: DataSource,
  ) {}

  private async assertAdmin(serverId: string, userId: string): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { serverId, userId },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === MemberRole.MEMBER) {
      throw new ForbiddenException('Only admins can manage roles');
    }
  }

  async assignEveryoneRole(
    memberId: string,
    serverId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const roleRepo = manager
      ? manager.getRepository(ServerRole)
      : this.roleRepository;
    const mrRepo = manager
      ? manager.getRepository(MemberRoleEntity)
      : this.memberRoleRepository;

    const everyoneRole = await roleRepo.findOne({
      where: { serverId, isDefault: true },
    });
    if (!everyoneRole) return;

    const exists = await mrRepo.findOne({
      where: { memberId, roleId: everyoneRole.id },
    });
    if (exists) return;

    await mrRepo.save(mrRepo.create({ memberId, roleId: everyoneRole.id }));
  }

  async getRoles(serverId: string): Promise<ServerRole[]> {
    const server = await this.serverRepository.findOne({
      where: { id: serverId },
    });
    if (!server) throw new NotFoundException('Server not found');

    return this.roleRepository.find({
      where: { serverId },
      order: { position: 'ASC' },
    });
  }

  async getRole(serverId: string, roleId: string): Promise<ServerRole> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId, serverId },
      relations: ['memberRoles', 'memberRoles.member', 'memberRoles.member.user'],
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async createRole(
    serverId: string,
    userId: string,
    dto: CreateRoleDto,
  ): Promise<ServerRole> {
    await this.assertAdmin(serverId, userId);

    const maxPosition = await this.roleRepository.count({
      where: { serverId },
    });

    const role = this.roleRepository.create({
      serverId,
      name: dto.name,
      color: dto.color,
      mentionable: dto.mentionable ?? false,
      position: maxPosition + 1,
      permissions: '0',
    });

    return this.roleRepository.save(role);
  }

  async updateRole(
    serverId: string,
    roleId: string,
    userId: string,
    dto: UpdateRoleDto,
  ): Promise<ServerRole> {
    await this.assertAdmin(serverId, userId);

    const role = await this.roleRepository.findOne({
      where: { id: roleId, serverId },
    });
    if (!role) throw new NotFoundException('Role not found');

    if (dto.name !== undefined) role.name = dto.name;
    if (dto.color !== undefined) role.color = dto.color;
    if (dto.mentionable !== undefined) role.mentionable = dto.mentionable;
    if (dto.permissions !== undefined) role.permissions = dto.permissions;

    return this.roleRepository.save(role);
  }

  async deleteRole(
    serverId: string,
    roleId: string,
    userId: string,
  ): Promise<void> {
    await this.assertAdmin(serverId, userId);

    const role = await this.roleRepository.findOne({
      where: { id: roleId, serverId },
    });
    if (!role) throw new NotFoundException('Role not found');

    if (role.isDefault) {
      throw new BadRequestException('Cannot delete the @everyone default role');
    }

    await this.roleRepository.remove(role);
  }

  async reorderRoles(
    serverId: string,
    userId: string,
    dto: ReorderRolesDto,
  ): Promise<ServerRole[]> {
    await this.assertAdmin(serverId, userId);

    const roles = await this.roleRepository.find({
      where: { serverId },
    });

    const roleMap = new Map(roles.map((r) => [r.id, r]));

    for (let i = 0; i < dto.order.length; i++) {
      const role = roleMap.get(dto.order[i]);
      if (!role) {
        throw new NotFoundException(`Role ${dto.order[i]} not found`);
      }
      role.position = i;
    }

    return this.roleRepository.save(roles);
  }

  async getRoleMembers(
    serverId: string,
    roleId: string,
  ): Promise<ServerMember[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId, serverId },
    });
    if (!role) throw new NotFoundException('Role not found');

    const memberRoles = await this.memberRoleRepository.find({
      where: { roleId },
      relations: ['member', 'member.user'],
    });

    return memberRoles.map((mr) => mr.member);
  }

  async addMemberToRole(
    serverId: string,
    roleId: string,
    memberId: string,
    userId: string,
  ): Promise<void> {
    await this.assertAdmin(serverId, userId);

    const role = await this.roleRepository.findOne({
      where: { id: roleId, serverId },
    });
    if (!role) throw new NotFoundException('Role not found');

    const member = await this.memberRepository.findOne({
      where: { id: memberId, serverId },
    });
    if (!member) throw new NotFoundException('Member not found');

    const exists = await this.memberRoleRepository.findOne({
      where: { memberId, roleId },
    });
    if (exists) return;

    await this.memberRoleRepository.save(
      this.memberRoleRepository.create({ memberId, roleId }),
    );
  }

  async removeMemberFromRole(
    serverId: string,
    roleId: string,
    memberId: string,
    userId: string,
  ): Promise<void> {
    await this.assertAdmin(serverId, userId);

    const role = await this.roleRepository.findOne({
      where: { id: roleId, serverId },
    });
    if (!role) throw new NotFoundException('Role not found');

    if (role.isDefault) {
      throw new BadRequestException(
        'Cannot remove members from the @everyone role',
      );
    }

    const member = await this.memberRepository.findOne({
      where: { id: memberId, serverId },
    });
    if (!member) throw new NotFoundException('Member not found');

    if (member.role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot remove the owner from roles');
    }

    const memberRole = await this.memberRoleRepository.findOne({
      where: { memberId, roleId },
    });
    if (!memberRole) throw new NotFoundException('Member does not have this role');

    await this.memberRoleRepository.remove(memberRole);
  }

  async getEffectivePermissions(
    serverId: string,
    userId: string,
  ): Promise<string> {
    const member = await this.memberRepository.findOne({
      where: { serverId, userId },
    });
    if (!member) return '0';

    if (member.role === MemberRole.OWNER) {
      return ALL_PERMISSIONS.toString();
    }

    const memberRoles = await this.memberRoleRepository.find({
      where: { memberId: member.id },
      relations: ['role'],
    });

    let perms = 0n;
    for (const mr of memberRoles) {
      if (mr.role) {
        perms |= BigInt(mr.role.permissions);
      }
    }

    return perms.toString();
  }

  async checkPermission(
    serverId: string,
    userId: string,
    required: bigint,
  ): Promise<boolean> {
    const perms = BigInt(await this.getEffectivePermissions(serverId, userId));
    return hasPermission(perms, required);
  }
}
