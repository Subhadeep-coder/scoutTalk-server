import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChannelPermissionsService } from './channel-permissions.service';
import { PermissionGuard } from '../roles/guards/permissions.guard';
import { Permissions } from '../roles/decorators/permissions.decorator';
import { Permissions as Perm } from '../roles/permissions';
import { SetOverrideDto } from './dto/set-override.dto';

@ApiTags('channel-permissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(PermissionGuard)
@Controller('channels/:channelId/permissions')
export class ChannelPermissionsController {
  constructor(private channelPermissionsService: ChannelPermissionsService) {}

  @Get()
  @Permissions(Perm.MANAGE_CHANNELS, 'channelId')
  @ApiOperation({ summary: 'List all overrides for a channel' })
  @ApiResponse({ status: 200, description: 'List of overrides' })
  async getOverrides(@Param('channelId') channelId: string) {
    return this.channelPermissionsService.getOverridesForChannel(channelId);
  }

  @Put('roles/:roleId')
  @Permissions(Perm.MANAGE_CHANNELS, 'channelId')
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
  @Permissions(Perm.MANAGE_CHANNELS, 'channelId')
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
  @Permissions(Perm.MANAGE_CHANNELS, 'channelId')
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
  @Permissions(Perm.MANAGE_CHANNELS, 'channelId')
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
