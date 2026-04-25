import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiOkResponse,
} from '../../docs';
import { Public } from '../auth/decorators/public.decorator';
import { SkipOnboardingCheck } from '../auth/decorators/skip-onboarding.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import {
  UpdateUsernameDto,
  UpdateProfileDto,
  UserResponseDto,
} from './dto/users.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @SkipOnboardingCheck()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Returns the authenticated user profile with onboarding status',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getCurrentUser(@Req() req: Request) {
    const user = (req as any).user;
    const dbUser = await this.usersService.findByGoogleId(user.googleId);

    if (!dbUser) {
      return {
        id: user.googleId,
        googleId: user.googleId,
        email: user.email,
        displayName: user.name,
        needsOnboarding: true,
        username: null,
      };
    }

    return dbUser;
  }

  @Get('me/onboarding-status')
  @SkipOnboardingCheck()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Check onboarding status',
    description:
      'Returns whether the user has completed onboarding (has username)',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding status',
    schema: {
      type: 'object',
      properties: {
        needsOnboarding: { type: 'boolean' },
      },
    },
  })
  async getOnboardingStatus(@Req() req: Request) {
    const user = (req as any).user;
    const dbUser = await this.usersService.findByGoogleId(user.googleId);
    return {
      needsOnboarding: dbUser?.needsOnboarding ?? true,
    };
  }

  @Post('me/username')
  @SkipOnboardingCheck()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set username (onboarding)',
    description:
      'Set a unique username to complete onboarding. Required before accessing full platform.',
  })
  @ApiResponse({
    status: 200,
    description: 'Username set successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Username already taken',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async setUsername(@Req() req: Request, @Body() dto: UpdateUsernameDto) {
    const user = (req as any).user;
    const dbUser = await this.usersService.findByGoogleId(user.googleId);

    if (!dbUser) {
      const newUser = await this.usersService.createUser({
        googleId: user.googleId,
        email: user.email,
        name: user.name,
      });
      return this.usersService.setUsername(newUser.id, dto);
    }

    if (!dbUser.needsOnboarding) {
      return {
        message: 'User already onboarded',
        user: dbUser,
      };
    }

    return this.usersService.setUsername(dbUser.id, dto);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update display name and avatar',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const user = (req as any).user;
    const dbUser = await this.usersService.findByGoogleId(user.googleId);

    if (!dbUser) {
      throw new Error('User not found. Please complete onboarding first.');
    }

    return this.usersService.updateProfile(dbUser.id, dto);
  }

  @Get('username/:username')
  @Public()
  @ApiOperation({
    summary: 'Check username availability',
    description: 'Check if a username is available',
  })
  @ApiResponse({
    status: 200,
    description: 'Username availability',
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean' },
        username: { type: 'string' },
      },
    },
  })
  async checkUsername(@Param('username') username: string) {
    const available =
      await this.usersService.checkUsernameAvailability(username);
    return {
      available,
      username,
    };
  }
}
