import {
  Controller,
  Get,
  Post,
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
import { MembersService } from './members.service';
import { PermissionGuard } from '../roles/guards/permissions.guard';
import { Permissions } from '../roles/decorators/permissions.decorator';
import { Permissions as Perm } from '../roles/permissions';
import { JoinServerDto } from './dto/join-server.dto';
import { CreateInviteDto } from './dto/create-invite.dto';

@ApiTags('members')
@ApiBearerAuth('JWT-auth')
@Controller()
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get('servers/:serverId/members')
  @ApiOperation({ summary: 'List server members' })
  @ApiResponse({ status: 200, description: 'List of members' })
  async getMembers(@Req() req: Request, @Param('serverId') serverId: string) {
    const userId = (req as any).user.userId;
    return this.membersService.getMembers(serverId, userId);
  }

  @Delete('servers/:serverId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Kick a member' })
  @ApiResponse({ status: 204, description: 'Member kicked' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async kickMember(
    @Req() req: Request,
    @Param('serverId') serverId: string,
    @Param('userId') userId: string,
  ) {
    const requesterId = (req as any).user.userId;
    await this.membersService.kickMember(serverId, userId, requesterId);
  }

  @Post('servers/:serverId/invites')
  @UseGuards(PermissionGuard)
  @Permissions(Perm.CREATE_INSTANT_INVITE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate an invite code' })
  @ApiResponse({ status: 201, description: 'Invite created' })
  @ApiResponse({ status: 404, description: 'Not a member' })
  async createInvite(
    @Req() req: Request,
    @Param('serverId') serverId: string,
    @Body() dto: CreateInviteDto,
  ) {
    const userId = (req as any).user.userId;
    return this.membersService.generateInvite(serverId, userId, dto);
  }

  @Get('servers/:serverId/invites')
  @UseGuards(PermissionGuard)
  @Permissions(Perm.MANAGE_GUILD)
  @ApiOperation({ summary: 'List all active invites' })
  @ApiResponse({ status: 200, description: 'List of invites' })
  @ApiResponse({ status: 404, description: 'Not a member' })
  async listInvites(@Req() req: Request, @Param('serverId') serverId: string) {
    const userId = (req as any).user.userId;
    return this.membersService.getServerInvites(serverId, userId);
  }

  @Delete('servers/:serverId/invites/:inviteId')
  @UseGuards(PermissionGuard)
  @Permissions(Perm.MANAGE_GUILD)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke an invite code' })
  @ApiResponse({ status: 204, description: 'Invite revoked' })
  @ApiResponse({ status: 404, description: 'Invite not found' })
  async revokeInvite(
    @Req() req: Request,
    @Param('serverId') serverId: string,
    @Param('inviteId') inviteId: string,
  ) {
    const userId = (req as any).user.userId;
    await this.membersService.revokeInvite(inviteId, serverId, userId);
  }

  @Get('invites/:code')
  @ApiOperation({ summary: 'Lookup an invite' })
  @ApiResponse({ status: 200, description: 'Invite details' })
  @ApiResponse({ status: 404, description: 'Invite not found' })
  async getInvite(@Param('code') code: string) {
    return this.membersService.getInvite(code);
  }

  @Post('invites/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a server via invite code' })
  @ApiResponse({ status: 200, description: 'Joined server' })
  @ApiResponse({ status: 404, description: 'Invite not found' })
  @ApiResponse({ status: 409, description: 'Already a member' })
  async joinServer(@Req() req: Request, @Body() dto: JoinServerDto) {
    const userId = (req as any).user.userId;
    return this.membersService.joinViaInvite(dto.code, userId);
  }
}
