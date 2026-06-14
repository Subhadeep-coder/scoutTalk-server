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
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ServerSettingsService } from './server-settings.service';
import { SetTagDto } from './dto/set-tag.dto';
import { UpdateEngagementDto } from './dto/update-engagement.dto';
import { CreateWelcomeMessageDto } from './dto/create-welcome-message.dto';
import { UpdateWelcomeMessageDto } from './dto/update-welcome-message.dto';

@ApiTags('servers')
@ApiBearerAuth('JWT-auth')
@Controller('servers/:serverId')
export class ServerSettingsController {
  constructor(private settingsService: ServerSettingsService) {}

  @Get('tag')
  @ApiOperation({ summary: 'Get server tag' })
  async getTag(@Param('serverId') serverId: string) {
    return this.settingsService.getTag(serverId);
  }

  @Patch('tag')
  @ApiOperation({ summary: 'Set or update server tag (admin only)' })
  async setTag(
    @Req() req: Request,
    @Param('serverId') serverId: string,
    @Body() dto: SetTagDto,
  ) {
    const userId = (req as any).user.userId;
    return this.settingsService.setTag(serverId, userId, dto);
  }

  @Delete('tag')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove server tag (admin only)' })
  async deleteTag(
    @Req() req: Request,
    @Param('serverId') serverId: string,
  ) {
    const userId = (req as any).user.userId;
    await this.settingsService.deleteTag(serverId, userId);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get server engagement settings' })
  async getEngagement(@Param('serverId') serverId: string) {
    return this.settingsService.getEngagement(serverId);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update server engagement settings (admin only)' })
  async updateEngagement(
    @Req() req: Request,
    @Param('serverId') serverId: string,
    @Body() dto: UpdateEngagementDto,
  ) {
    const userId = (req as any).user.userId;
    return this.settingsService.updateEngagement(serverId, userId, dto);
  }

  @Get('welcome-messages')
  @ApiOperation({ summary: 'List welcome messages' })
  async getWelcomeMessages(@Param('serverId') serverId: string) {
    return this.settingsService.getWelcomeMessages(serverId);
  }

  @Post('welcome-messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a welcome message (admin only)' })
  async createWelcomeMessage(
    @Req() req: Request,
    @Param('serverId') serverId: string,
    @Body() dto: CreateWelcomeMessageDto,
  ) {
    const userId = (req as any).user.userId;
    return this.settingsService.createWelcomeMessage(serverId, userId, dto);
  }

  @Patch('welcome-messages/:messageId')
  @ApiOperation({ summary: 'Update a welcome message (admin only)' })
  async updateWelcomeMessage(
    @Req() req: Request,
    @Param('serverId') serverId: string,
    @Param('messageId') messageId: string,
    @Body() dto: UpdateWelcomeMessageDto,
  ) {
    const userId = (req as any).user.userId;
    return this.settingsService.updateWelcomeMessage(
      serverId,
      messageId,
      userId,
      dto,
    );
  }

  @Delete('welcome-messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a welcome message (admin only)' })
  async deleteWelcomeMessage(
    @Req() req: Request,
    @Param('serverId') serverId: string,
    @Param('messageId') messageId: string,
  ) {
    const userId = (req as any).user.userId;
    await this.settingsService.deleteWelcomeMessage(
      serverId,
      messageId,
      userId,
    );
  }
}
