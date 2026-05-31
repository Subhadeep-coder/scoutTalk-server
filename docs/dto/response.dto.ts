import { ApiProperty, ApiPropertyOptional } from '../decorators/api-decorators';

export class GoogleUserDto {
  @ApiProperty({ example: '123456789' })
  googleId: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiPropertyOptional({ example: 'Doe' })
  lastName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  picture?: string;
}

export class AuthStatusResponseDto {
  @ApiProperty({ example: false })
  googleConfigured: boolean;

  @ApiProperty({ example: true })
  jwtConfigured: boolean;
}

export class GoogleAuthResponseDto {
  @ApiProperty({ example: 'Redirecting to Google...' })
  message: string;
}

export class GoogleCallbackResponseDto {
  @ApiProperty({ type: GoogleUserDto })
  user: GoogleUserDto;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token: string;

  @ApiProperty({ example: 'd4489926-e2ca-49c6-98a1-ef5831a91c27' })
  refresh_token: string;

  @ApiProperty({ example: false })
  onboarding: boolean;
}

export class AuthErrorResponseDto {
  @ApiProperty({ example: 503 })
  statusCode: number;

  @ApiProperty({
    example:
      'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
  })
  message: string;
}

export class JwtPayloadDto {
  @ApiProperty({ example: '123456789' })
  sub: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  lastName?: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token: string;

  @ApiProperty({ example: 'd4489926-e2ca-49c6-98a1-ef5831a91c27' })
  refresh_token: string;
}

export class LogoutResponseDto {
  @ApiProperty({ example: 'Logged out successfully' })
  message: string;
}

export class UserInfoDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'John' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  lastName?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  displayName?: string;

  @ApiPropertyOptional({ example: 'john_doe' })
  username?: string;

  @ApiPropertyOptional({ example: true })
  needsOnboarding?: boolean;
}

export class AuthTokensResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token: string;

  @ApiProperty({ example: 'd4489926-e2ca-49c6-98a1-ef5831a91c27' })
  refresh_token: string;

  @ApiProperty({ type: UserInfoDto })
  user: UserInfoDto;
}

export class HelloResponseDto {
  @ApiProperty({ example: 'Hello World!' })
  message: string;
}
