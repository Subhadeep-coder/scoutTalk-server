import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../database/entities/message.entity';
import { Channel } from '../database/entities/channel.entity';
import { ServerMember } from '../database/entities/server-member.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { WebsocketService } from '../websocket/websocket.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(ServerMember)
    private memberRepository: Repository<ServerMember>,
    private websocketService: WebsocketService,
    private cloudinary: CloudinaryService,
  ) {}

  async create(
    userId: string,
    channelId: string,
    dto: CreateMessageDto,
  ): Promise<Message> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const member = await this.memberRepository.findOne({
      where: { serverId: channel.serverId, userId },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this server');
    }

    const message = this.messageRepository.create({
      authorId: userId,
      channelId,
      serverId: channel.serverId,
      content: dto.content ?? null,
      parentId: dto.parentId,
      attachments: dto.attachments ?? [],
    });

    const saved = await this.messageRepository.save(message);
    const result = await this.findById(saved.id);

    this.websocketService.emitToServer(channel.serverId, 'message:new', result);

    return result;
  }

  async findByChannel(
    channelId: string,
    options?: { before?: string; limit?: number },
  ): Promise<Message[]> {
    const limit = Math.min(options?.limit ?? 50, 100);

    const query = this.messageRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.author', 'author')
      .select([
        'm.id',
        'm.channelId',
        'm.serverId',
        'm.authorId',
        'm.content',
        'm.attachments',
        'm.parentId',
        'm.createdAt',
        'm.updatedAt',
        'm.isEdited',
        'author.id',
        'author.username',
        'author.firstName',
        'author.lastName',
        'author.displayName',
        'author.avatar',
      ])
      .where('m.channelId = :channelId', { channelId })
      .orderBy('m.createdAt', 'DESC')
      .take(limit);

    if (options?.before) {
      const cursor = await this.messageRepository.findOne({
        where: { id: options.before },
        select: ['createdAt'],
      });
      if (cursor) {
        query.andWhere('m.createdAt < :before', { before: cursor.createdAt });
      }
    }

    const messages = await query.getMany();
    return messages.reverse();
  }

  async findById(messageId: string): Promise<Message> {
    const message = await this.messageRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.author', 'author')
      .select([
        'm.id',
        'm.channelId',
        'm.serverId',
        'm.authorId',
        'm.content',
        'm.attachments',
        'm.parentId',
        'm.createdAt',
        'm.updatedAt',
        'm.isEdited',
        'author.id',
        'author.username',
        'author.firstName',
        'author.lastName',
        'author.displayName',
        'author.avatar',
      ])
      .where('m.id = :id', { id: messageId })
      .getOne();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  async update(
    messageId: string,
    userId: string,
    content?: string | null,
  ): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (content !== undefined && content !== null && content.trim() === '') {
      throw new BadRequestException('Content cannot be empty');
    }

    message.content = content ?? null;
    message.isEdited = true;
    await this.messageRepository.save(message);

    const result = await this.findById(messageId);

    this.websocketService.emitToServer(
      message.serverId,
      'message:update',
      result,
    );

    return result;
  }

  async removeAttachment(
    messageId: string,
    userId: string,
    url: string,
  ): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    const attachments = message.attachments ?? [];
    const idx = attachments.findIndex((a) => a.url === url);
    if (idx === -1) {
      throw new NotFoundException('Attachment not found on this message');
    }

    attachments.splice(idx, 1);
    message.attachments = attachments;
    message.isEdited = true;
    await this.messageRepository.save(message);

    await this.cloudinary.deleteByUrl(url);

    const result = await this.findById(messageId);

    this.websocketService.emitToServer(
      message.serverId,
      'message:update',
      result,
    );

    return result;
  }

  async delete(messageId: string, userId: string): Promise<void> {
    const message = await this.findById(messageId);

    if (message.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    const attachments = message.attachments ?? [];

    await this.messageRepository.remove(message);

    if (attachments.length > 0) {
      await this.cloudinary.deleteByUrls(attachments.map((a) => a.url));
    }

    this.websocketService.emitToServer(message.serverId, 'message:delete', {
      id: messageId,
      channelId: message.channelId,
    });
  }
}
