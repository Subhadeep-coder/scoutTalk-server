import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AuthorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional()
  displayName?: string;

  @ApiPropertyOptional()
  avatar?: string;
}

class ParentAuthorDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  displayName?: string;

  @ApiPropertyOptional()
  avatar?: string;
}

class ParentMessageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string | null;

  @ApiPropertyOptional({ type: [Object] })
  attachments?: Array<{ url: string; type: string; name?: string }>;

  @ApiPropertyOptional({ type: ParentAuthorDto })
  author?: ParentAuthorDto;
}

export class MessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  channelId: string;

  @ApiProperty()
  serverId: string;

  @ApiPropertyOptional()
  content?: string;

  @ApiPropertyOptional({ type: [Object] })
  attachments?: Array<{ url: string; type: string; name?: string }>;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiPropertyOptional({ type: ParentMessageDto })
  parent?: ParentMessageDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  isEdited: boolean;

  @ApiProperty({ type: AuthorDto })
  author: AuthorDto;
}
