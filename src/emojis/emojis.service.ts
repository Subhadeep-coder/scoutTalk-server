import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomEmoji } from '../database/entities/custom-emoji.entity';
import { Server } from '../database/entities/server.entity';
import { ServerMember } from '../database/entities/server-member.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { RolesService } from '../roles/roles.service';
import { Permissions } from '../roles/permissions';

@Injectable()
export class EmojisService {
  constructor(
    @InjectRepository(CustomEmoji)
    private emojiRepository: Repository<CustomEmoji>,
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    @InjectRepository(ServerMember)
    private memberRepository: Repository<ServerMember>,
    private cloudinary: CloudinaryService,
    private rolesService: RolesService,
  ) {}

  private async assertMember(serverId: string, userId: string): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { serverId, userId },
    });
    if (!member) throw new NotFoundException('You are not a member of this server');
  }

  async findAll(serverId: string): Promise<CustomEmoji[]> {
    return this.emojiRepository.find({
      where: { serverId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(serverId: string, emojiId: string): Promise<CustomEmoji> {
    const emoji = await this.emojiRepository.findOne({
      where: { id: emojiId, serverId },
    });
    if (!emoji) throw new NotFoundException('Emoji not found');
    return emoji;
  }

  async create(
    serverId: string,
    userId: string,
    name: string,
    file: Express.Multer.File,
  ): Promise<CustomEmoji> {
    const server = await this.serverRepository.findOne({
      where: { id: serverId },
    });
    if (!server) throw new NotFoundException('Server not found');

    await this.assertMember(serverId, userId);

    const existing = await this.emojiRepository.findOne({
      where: { serverId, name },
    });
    if (existing) {
      throw new BadRequestException(
        `Emoji :${name}: already exists in this server`,
      );
    }

    const result = await this.cloudinary.uploadFromBuffer(file.buffer, {
      folder: `servers/${serverId}/emojis`,
      resourceType: 'image',
    });

    const emoji = this.emojiRepository.create({
      serverId,
      name,
      imageUrl: result.url,
      createdBy: userId,
    });

    return this.emojiRepository.save(emoji);
  }

  async delete(
    serverId: string,
    emojiId: string,
    userId: string,
  ): Promise<void> {
    const emoji = await this.findOne(serverId, emojiId);

    const hasPerm = await this.rolesService.checkPermission(
      serverId,
      userId,
      Permissions.MANAGE_EXPRESSIONS,
    );
    if (!hasPerm) {
      const member = await this.memberRepository.findOne({ where: { serverId, userId } });
      if (!member) throw new NotFoundException('Member not found');
      throw new ForbiddenException('You do not have permission to manage emojis');
    }

    await this.cloudinary.deleteByUrl(emoji.imageUrl);
    await this.emojiRepository.remove(emoji);
  }
}
