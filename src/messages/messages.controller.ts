import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../database/entities/channel.entity';
import { ServerMember } from '../database/entities/server-member.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';

@ApiTags('messages')
@ApiBearerAuth('JWT-auth')
@Controller()
export class MessagesController {
  constructor(
    private messagesService: MessagesService,
    private cloudinary: CloudinaryService,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(ServerMember)
    private memberRepository: Repository<ServerMember>,
  ) {}

  @Post('channels/:channelId/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent', type: MessageResponseDto })
  async create(
    @Req() req: Request,
    @Param('channelId') channelId: string,
    @Body() dto: CreateMessageDto,
  ) {
    const userId = (req as any).user.userId;
    return this.messagesService.create(userId, channelId, dto);
  }

  @Post('channels/:channelId/attachments')
  @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload attachments for a message' })
  @ApiResponse({ status: 201, description: 'Files uploaded' })
  async uploadAttachments(
    @Req() req: Request,
    @Param('channelId') channelId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const userId = (req as any).user.userId;

    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
    });
    if (!channel) {
      return { statusCode: 404, message: 'Channel not found' };
    }

    const member = await this.memberRepository.findOne({
      where: { serverId: channel.serverId, userId },
    });
    if (!member) {
      return { statusCode: 403, message: 'You are not a member of this server' };
    }

    const results = await Promise.all(
      files.map((file) =>
        this.cloudinary.uploadFromBuffer(file.buffer, {
          folder: `servers/${channel.serverId}/channels/${channelId}`,
          resourceType: 'auto',
        }),
      ),
    );

    return results.map((r) => ({
      url: r.url,
      type: r.format,
      name: r.publicId.split('/').pop(),
    }));
  }

  @Patch('messages/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Edit message content' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', nullable: true },
      },
    },
  })
  async edit(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('content') content?: string,
  ) {
    const userId = (req as any).user.userId;
    return this.messagesService.update(id, userId, content);
  }

  @Delete('attachments')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete files from Cloudinary by URLs' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async deleteAttachments(
    @Body('urls') urls: string[],
  ) {
    if (urls?.length) {
      await this.cloudinary.deleteByUrls(urls);
    }
  }

  @Delete('messages/:messageId/attachments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an attachment from a message and delete from Cloudinary' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
      },
    },
  })
  async removeAttachment(
    @Req() req: Request,
    @Param('messageId') messageId: string,
    @Body('url') url: string,
  ) {
    const userId = (req as any).user.userId;
    return this.messagesService.removeAttachment(messageId, userId, url);
  }

  @Get('channels/:channelId/messages')
  @ApiOperation({ summary: 'Get messages in a channel' })
  @ApiResponse({ status: 200, description: 'List of messages', type: [MessageResponseDto] })
  @ApiQuery({ name: 'before', required: false, description: 'Cursor for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max messages (default 50, max 100)' })
  async findByChannel(
    @Param('channelId') channelId: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagesService.findByChannel(channelId, {
      before,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Delete('messages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 204, description: 'Message deleted' })
  @ApiResponse({ status: 403, description: 'Not your message' })
  async delete(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.userId;
    await this.messagesService.delete(id, userId);
  }
}
