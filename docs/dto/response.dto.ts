import { ApiProperty, ApiPropertyOptional } from '../decorators/api-decorators';

export class UserResponseDto {
  @ApiPropertyOptional()
  userId?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  name?: string;
}

export class GoogleUserDto {
  @ApiProperty({ example: '123456789' })
  googleId: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

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

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
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

  @ApiProperty({ example: 'John Doe' })
  name: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refresh_token: string;
}

export class LogoutResponseDto {
  @ApiProperty({ example: 'Logged out successfully' })
  message: string;
}

export class HelloResponseDto {
  @ApiProperty({ example: 'Hello World!' })
  message: string;
}
