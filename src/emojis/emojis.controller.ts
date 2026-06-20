import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { EmojisService } from './emojis.service';
import { PermissionGuard } from '../roles/guards/permissions.guard';
import { Permissions } from '../roles/decorators/permissions.decorator';
import { Permissions as Perm } from '../roles/permissions';
import { CreateEmojiDto } from './dto/create-emoji.dto';
import { EmojiResponseDto } from './dto/emoji-response.dto';

@ApiTags('servers')
@ApiBearerAuth('JWT-auth')
@Controller('servers/:serverId/emojis')
export class EmojisController {
  constructor(private emojisService: EmojisService) {}

  @Get()
  @UseGuards(PermissionGuard)
  @Permissions(Perm.VIEW_CHANNEL)
  @ApiOperation({ summary: 'List custom emojis for a server' })
  @ApiResponse({ status: 200, type: [EmojiResponseDto] })
  async findAll(@Param('serverId') serverId: string) {
    return this.emojisService.findAll(serverId);
  }

  @Get(':emojiId')
  @UseGuards(PermissionGuard)
  @Permissions(Perm.VIEW_CHANNEL)
  @ApiOperation({ summary: 'Get a specific emoji' })
  @ApiResponse({ status: 200, type: EmojiResponseDto })
  async findOne(
    @Param('serverId') serverId: string,
    @Param('emojiId') emojiId: string,
  ) {
    return this.emojisService.findOne(serverId, emojiId);
  }

  @Post()
  @UseGuards(PermissionGuard)
  @Permissions(Perm.MANAGE_EXPRESSIONS)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 512 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        name: { type: 'string' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload a custom emoji (admin only)' })
  @ApiResponse({ status: 201, type: EmojiResponseDto })
  async create(
    @Req() req: Request,
    @Param('serverId') serverId: string,
    @Body() dto: CreateEmojiDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = (req as any).user.userId;
    return this.emojisService.create(serverId, userId, dto.name, file);
  }

  @Delete(':emojiId')
  @UseGuards(PermissionGuard)
  @Permissions(Perm.MANAGE_EXPRESSIONS)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a custom emoji (admin only)' })
  async delete(
    @Req() req: Request,
    @Param('serverId') serverId: string,
    @Param('emojiId') emojiId: string,
  ) {
    const userId = (req as any).user.userId;
    await this.emojisService.delete(serverId, emojiId, userId);
  }
}
