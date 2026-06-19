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
  UseInterceptors,
  UploadedFile,
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
import { ServersService } from './servers.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { ServerResponseDto, ServerListDto } from './dto/server-response.dto';

@ApiTags('servers')
@ApiBearerAuth('JWT-auth')
@Controller('servers')
export class ServersController {
  constructor(
    private serversService: ServersService,
    private cloudinary: CloudinaryService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a server' })
  @ApiResponse({
    status: 201,
    description: 'Server created',
    type: ServerResponseDto,
  })
  async create(@Req() req: Request, @Body() dto: CreateServerDto) {
    const userId = (req as any).user.userId;
    return this.serversService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my servers' })
  @ApiResponse({
    status: 200,
    description: 'List of servers',
    type: [ServerListDto],
  })
  async listMyServers(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.serversService.findByMemberId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get server details' })
  @ApiResponse({
    status: 200,
    description: 'Server details',
    type: ServerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Server not found' })
  async getServer(@Param('id') id: string) {
    return this.serversService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update server' })
  @ApiResponse({
    status: 200,
    description: 'Server updated',
    type: ServerResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Only owner can update' })
  @ApiResponse({ status: 404, description: 'Server not found' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateServerDto,
  ) {
    const userId = (req as any).user.userId;
    return this.serversService.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete server' })
  @ApiResponse({ status: 204, description: 'Server deleted' })
  @ApiResponse({ status: 403, description: 'Only owner can delete' })
  async delete(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.userId;
    await this.serversService.delete(id, userId);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a server' })
  @ApiResponse({ status: 200, description: 'Left the server' })
  @ApiResponse({ status: 403, description: 'Owner cannot leave' })
  async leave(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.userId;
    await this.serversService.leave(id, userId);
    return { message: 'Left the server' };
  }

  @Post(':id/avatar')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload server avatar' })
  @ApiResponse({ status: 200, description: 'Avatar uploaded' })
  async uploadAvatar(
    @Req() req: Request,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = (req as any).user.userId;
    const result = await this.cloudinary.uploadFromBuffer(file.buffer, {
      folder: `servers/${id}`,
      publicId: 'avatar',
    });
    return this.serversService.update(id, userId, { avatar: result.url });
  }

  @Post(':id/banner')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload server banner' })
  @ApiResponse({ status: 200, description: 'Banner uploaded' })
  async uploadBanner(
    @Req() req: Request,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = (req as any).user.userId;
    const result = await this.cloudinary.uploadFromBuffer(file.buffer, {
      folder: `servers/${id}`,
      publicId: 'banner',
    });
    return this.serversService.update(id, userId, { banner: result.url });
  }
}
