import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from '../database/entities/category.entity';
import { Channel, ChannelType } from '../database/entities/channel.entity';
import { ServerMember } from '../database/entities/server-member.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(ServerMember)
    private memberRepository: Repository<ServerMember>,
  ) {}

  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    const maxPos = await this.categoryRepository
      .createQueryBuilder('c')
      .select('COALESCE(MAX(c.position), -1)', 'max')
      .where('c.serverId = :serverId', { serverId: dto.serverId })
      .getRawOne();

    const category = this.categoryRepository.create({
      name: dto.name,
      serverId: dto.serverId,
      position: (maxPos?.max ?? -1) + 1,
    });

    return this.categoryRepository.save(category);
  }

  async updateCategory(
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.categoryRepository.update(categoryId, dto);
    return this.categoryRepository.findOneOrFail({ where: { id: categoryId } });
  }

  async deleteCategory(categoryId: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.categoryRepository.remove(category);
  }

  async createChannel(dto: CreateChannelDto): Promise<Channel> {
    const query = this.channelRepository
      .createQueryBuilder('ch')
      .select('COALESCE(MAX(ch.position), -1)', 'max');

    if (dto.categoryId) {
      query.where('ch.categoryId = :categoryId', { categoryId: dto.categoryId });
    } else {
      query.where('ch.serverId = :serverId AND ch.categoryId IS NULL', {
        serverId: dto.serverId,
      });
    }

    const maxPos = await query.getRawOne();

    const channel = this.channelRepository.create({
      name: dto.name,
      serverId: dto.serverId,
      categoryId: dto.categoryId ?? undefined,
      type: dto.type ?? ChannelType.TEXT,
      position: (maxPos?.max ?? -1) + 1,
    });

    return this.channelRepository.save(channel);
  }

  async updateChannel(
    channelId: string,
    dto: UpdateChannelDto,
  ): Promise<Channel> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    /*
    // ---- Move channel to a different category (drag-and-drop) ----
    if (dto.categoryId !== undefined && dto.categoryId !== channel.categoryId) {
      const maxPosition = await this.channelRepository
        .createQueryBuilder('ch')
        .select('COALESCE(MAX(ch.position), -1)', 'max')
        .where('ch.categoryId = :categoryId', { categoryId: dto.categoryId })
        .getRawOne<{ max: number }>();

      await this.channelRepository.update(channelId, {
        categoryId: dto.categoryId,
        position: maxPosition.max + 1,
      });
    } else if (dto.categoryId !== undefined) {
      await this.channelRepository.update(channelId, { name: dto.name });
    }
    */

    await this.channelRepository.update(channelId, dto);
    return this.channelRepository.findOneOrFail({ where: { id: channelId } });
  }

  async reorderCategories(
    serverId: string,
    userId: string,
    order: string[],
  ): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { serverId, userId },
    });
    if (!member) {
      throw new ForbiddenException('You are not a member of this server');
    }

    const categories = await this.categoryRepository.find({
      where: { serverId },
      order: { position: 'ASC' },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    for (const id of order) {
      if (!categoryMap.has(id)) {
        throw new BadRequestException(`Category ${id} not found in this server`);
      }
    }

    if (order.length !== categories.length) {
      throw new BadRequestException('Order must include all categories in this server');
    }

    const cases = order.map((id, i) => `WHEN :id_${i} THEN :pos_${i}`).join(' ');
    const params: Record<string, unknown> = {};
    order.forEach((id, i) => {
      params[`id_${i}`] = id;
      params[`pos_${i}`] = i;
    });

    await this.categoryRepository
      .createQueryBuilder()
      .update(Category)
      .set({ position: () => `(CASE id ${cases} END)::integer` })
      .setParameters(params)
      .whereInIds(order)
      .execute();
  }

  async reorderChannels(
    serverId: string,
    categoryId: string | null,
    userId: string,
    order: string[],
  ): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { serverId, userId },
    });
    if (!member) {
      throw new ForbiddenException('You are not a member of this server');
    }

    if (categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId, serverId },
      });
      if (!category) {
        throw new BadRequestException('Category not found in this server');
      }
    }

    const channels = await this.channelRepository.find({
      where: categoryId
        ? { categoryId }
        : { categoryId: IsNull() },
      order: { position: 'ASC' },
    });

    const channelMap = new Map(channels.map((c) => [c.id, c]));

    for (const id of order) {
      if (!channelMap.has(id)) {
        throw new BadRequestException(`Channel ${id} not found in this category`);
      }
    }

    if (order.length !== channels.length) {
      throw new BadRequestException('Order must include all channels in this category');
    }

    const cases = order.map((id, i) => `WHEN :id_${i} THEN :pos_${i}`).join(' ');
    const params: Record<string, unknown> = {};
    order.forEach((id, i) => {
      params[`id_${i}`] = id;
      params[`pos_${i}`] = i;
    });

    await this.channelRepository
      .createQueryBuilder()
      .update(Channel)
      .set({ position: () => `(CASE id ${cases} END)::integer` })
      .setParameters(params)
      .whereInIds(order)
      .execute();
  }

  async deleteChannel(channelId: string): Promise<void> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    await this.channelRepository.remove(channel);
  }
}
