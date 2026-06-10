import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../database/entities/message.entity';
import { Channel } from '../database/entities/channel.entity';
import { ServerMember } from '../database/entities/server-member.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { WebsocketService } from '../websocket/websocket.service';

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
      content: dto.content,
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

  async delete(messageId: string, userId: string): Promise<void> {
    const message = await this.findById(messageId);

    if (message.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.messageRepository.remove(message);

    this.websocketService.emitToServer(message.serverId, 'message:delete', {
      id: messageId,
      channelId: message.channelId,
    });
  }
}
