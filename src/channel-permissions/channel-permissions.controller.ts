import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChannelPermissionsService } from './channel-permissions.service';
import { SetOverrideDto } from './dto/set-override.dto';

@ApiTags('channel-permissions')
@ApiBearerAuth('JWT-auth')
@Controller('channels/:channelId/permissions')
export class ChannelPermissionsController {
  constructor(
    private channelPermissionsService: ChannelPermissionsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all overrides for a channel' })
  @ApiResponse({ status: 200, description: 'List of overrides' })
  async getOverrides(@Param('channelId') channelId: string) {
    return this.channelPermissionsService.getOverridesForChannel(channelId);
  }

  @Put('roles/:roleId')
  @ApiOperation({ summary: 'Set or update a role override' })
  @ApiResponse({ status: 200, description: 'Override saved' })
  async setRoleOverride(
    @Param('channelId') channelId: string,
    @Param('roleId') roleId: string,
    @Body() dto: SetOverrideDto,
  ) {
    return this.channelPermissionsService.setRoleOverride(
      channelId,
      roleId,
      dto.allow,
      dto.deny,
    );
  }

  @Delete('roles/:roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a role override' })
  @ApiResponse({ status: 204, description: 'Override removed' })
  async removeRoleOverride(
    @Param('channelId') channelId: string,
    @Param('roleId') roleId: string,
  ) {
    await this.channelPermissionsService.removeRoleOverride(channelId, roleId);
  }

  @Put('members/:memberId')
  @ApiOperation({ summary: 'Set or update a member override' })
  @ApiResponse({ status: 200, description: 'Override saved' })
  async setMemberOverride(
    @Param('channelId') channelId: string,
    @Param('memberId') memberId: string,
    @Body() dto: SetOverrideDto,
  ) {
    return this.channelPermissionsService.setMemberOverride(
      channelId,
      memberId,
      dto.allow,
      dto.deny,
    );
  }

  @Delete('members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member override' })
  @ApiResponse({ status: 204, description: 'Override removed' })
  async removeMemberOverride(
    @Param('channelId') channelId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.channelPermissionsService.removeMemberOverride(
      channelId,
      memberId,
    );
  }
}
