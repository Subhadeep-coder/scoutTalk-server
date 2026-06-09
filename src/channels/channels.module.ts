import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { Category } from '../database/entities/category.entity';
import { Channel } from '../database/entities/channel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Channel])],
  controllers: [ChannelsController],
  providers: [ChannelsService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
