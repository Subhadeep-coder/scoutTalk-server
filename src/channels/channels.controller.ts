import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@ApiTags('channels')
@ApiBearerAuth('JWT-auth')
@Controller()
export class ChannelsController {
  constructor(private channelsService: ChannelsService) {}

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.channelsService.createCategory(dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.channelsService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 204, description: 'Category deleted' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async deleteCategory(@Param('id') id: string) {
    await this.channelsService.deleteCategory(id);
  }

  @Post('channels')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a channel' })
  @ApiResponse({ status: 201, description: 'Channel created' })
  async createChannel(@Body() dto: CreateChannelDto) {
    return this.channelsService.createChannel(dto);
  }

  @Patch('channels/:id')
  @ApiOperation({ summary: 'Update a channel' })
  @ApiResponse({ status: 200, description: 'Channel updated' })
  @ApiResponse({ status: 404, description: 'Channel not found' })
  async updateChannel(@Param('id') id: string, @Body() dto: UpdateChannelDto) {
    return this.channelsService.updateChannel(id, dto);
  }

  @Delete('channels/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a channel' })
  @ApiResponse({ status: 204, description: 'Channel deleted' })
  @ApiResponse({ status: 404, description: 'Channel not found' })
  async deleteChannel(@Param('id') id: string) {
    await this.channelsService.deleteChannel(id);
  }
}
