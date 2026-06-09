import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../database/entities/category.entity';
import { Channel } from '../database/entities/channel.entity';
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
      position: dto.position ?? (maxPos?.max ?? -1) + 1,
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
    const maxPos = await this.channelRepository
      .createQueryBuilder('ch')
      .select('COALESCE(MAX(ch.position), -1)', 'max')
      .where('ch.serverId = :serverId', { serverId: dto.serverId })
      .getRawOne();

    const channel = this.channelRepository.create({
      name: dto.name,
      serverId: dto.serverId,
      categoryId: dto.categoryId,
      type: dto.type,
      position: dto.position ?? (maxPos?.max ?? -1) + 1,
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

    await this.channelRepository.update(channelId, dto);
    return this.channelRepository.findOneOrFail({ where: { id: channelId } });
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
