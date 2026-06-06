import { ApiProperty } from '../decorators/api-decorators';
import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'd4489926-e2ca-49c6-98a1-ef5831a91c27' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'newStrongPassword123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
