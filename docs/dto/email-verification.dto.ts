import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}
