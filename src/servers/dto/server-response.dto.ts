import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  position: number;
}

class ChannelDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  position: number;

  @ApiPropertyOptional()
  categoryId?: string;
}

class MemberDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  joinedAt: Date;
}

export class ServerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  ownerId: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty()
  inviteCode: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: [CategoryDto] })
  categories: CategoryDto[];

  @ApiProperty({ type: [ChannelDto] })
  channels: ChannelDto[];

  @ApiProperty({ type: [MemberDto] })
  members: MemberDto[];
}

export class ServerListDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  ownerId: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty()
  createdAt: Date;
}
