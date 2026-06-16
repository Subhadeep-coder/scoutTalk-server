import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { PermissionGuard } from './guards/permissions.guard';
import { Permissions } from './decorators/permissions.decorator';
import { Permissions as Perm } from './permissions';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ReorderRolesDto } from './dto/reorder-roles.dto';
import { AddMemberDto } from './dto/add-member.dto';

@ApiTags('roles')
@ApiBearerAuth('JWT-auth')
@Controller('servers/:serverId/roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @UseGuards(PermissionGuard)
  @Permissions(Perm.VIEW_CHANNEL)
  @ApiOperation({ summary: 'List roles' })
  async getRoles(@Param('serverId') serverId: string) {
    return this.rolesService.getRoles(serverId);
  }

  @Get(':roleId')
  @UseGuards(PermissionGuard)
  @Permissions(Perm.VIEW_CHANNEL)
  @ApiOperation({ summary: 'Get role details with members' })
  async getRole(
    @Param('serverId') serverId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rolesService.getRole(serverId, roleId);
  }

  @Post()
  @UseGuards(PermissionGuard)
  @Permissions(Perm.MANAGE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create role (admin only)' })
  async createRole(
    @Req() req: Request,
    @Param('serverId') serverId: string,
    @Body() dto: CreateRoleDto,
  ) {
    const userId = (req as any).user.userId;
    return this.rolesService.createRole(serverId, userId, dto);
  }

  @Patch(':roleId')
  @UseGuards(PermissionGuard)
  @Permissions(Perm.MANAGE_ROLES)
  @ApiOperation({ summary: 'Update role (admin only)' })
  async updateRole(
    @Req() req: Request,
    @Param('serverId') serverId: string,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    const userId = (req as any).user.userId;
    return this.rolesService.updateRole(serverId, roleId, userId, dto);
  }

  @Delete(':roleId')
  @UseGuards(PermissionGuard)
  @Permissions(Perm.MANAGE_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete role (admin only)' })
  async deleteRole(
    @Req() req: Request,
    @Param('serverId') serverId: string,
    @Param('roleId') roleId: string,
  ) {
    const userId = (req as any).user.userId;
    await this.rolesService.deleteRole(serverId, roleId, userId);
  }

  @Patch('reorder')
  @UseGuards(PermissionGuard)
  @Permissions(Perm.MANAGE_ROLES)
  @ApiOperation({ summary: 'Reorder roles (admin only)' })
  async reorderRoles(
    @Req() req: Request,
    @Param('serverId') serverId: string,
    @Body() dto: ReorderRolesDto,
  ) {
    const userId = (req as any).user.userId;
    return this.rolesService.reorderRoles(serverId, userId, dto);
  }

  @Get(':roleId/members')
  @UseGuards(PermissionGuard)
  @Permissions(Perm.VIEW_CHANNEL)
  @ApiOperation({ summary: 'Get members of a role' })
  async getRoleMembers(
    @Param('serverId') serverId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rolesService.getRoleMembers(serverId, roleId);
  }

  @Post(':roleId/members')
  @UseGuards(PermissionGuard)
  @Permissions(Perm.MANAGE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add member to role (admin only)' })
  async addMemberToRole(
    @Req() req: Request,
    @Param('serverId') serverId: string,
    @Param('roleId') roleId: string,
    @Body() dto: AddMemberDto,
  ) {
    const userId = (req as any).user.userId;
    await this.rolesService.addMemberToRole(
      serverId,
      roleId,
      dto.memberId,
      userId,
    );
    return { message: 'Member added to role' };
  }

  @Delete(':roleId/members/:memberId')
  @UseGuards(PermissionGuard)
  @Permissions(Perm.MANAGE_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove member from role (admin only)' })
  async removeMemberFromRole(
    @Req() req: Request,
    @Param('serverId') serverId: string,
    @Param('roleId') roleId: string,
    @Param('memberId') memberId: string,
  ) {
    const userId = (req as any).user.userId;
    await this.rolesService.removeMemberFromRole(
      serverId,
      roleId,
      memberId,
      userId,
    );
  }
}
