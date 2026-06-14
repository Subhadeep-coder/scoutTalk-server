import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiConsumes,
  ApiBody,
} from '../../docs';
import { Public } from '../auth/decorators/public.decorator';
import { SkipOnboardingCheck } from '../auth/decorators/skip-onboarding.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  UpdateUsernameDto,
  UpdateProfileDto,
  SetActiveTagDto,
  UserResponseDto,
} from './dto/users.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private cloudinary: CloudinaryService,
  ) {}

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

    const findUser = async () => {
      if (user.googleId) {
        return this.usersService.findByGoogleId(user.googleId);
      }
      if (user.userId) {
        return this.usersService.findById(user.userId).catch(() => null);
      }
      return null;
    };

    const dbUser = await findUser();

    if (!dbUser) {
      return {
        id: user.userId || user.googleId,
        googleId: user.googleId || null,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
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

    const findUser = async () => {
      if (user.googleId) {
        return this.usersService.findByGoogleId(user.googleId);
      }
      if (user.userId) {
        return this.usersService.findById(user.userId).catch(() => null);
      }
      return null;
    };

    const dbUser = await findUser();

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

    const findUser = async () => {
      if (user.googleId) {
        return this.usersService.findByGoogleId(user.googleId);
      }
      if (user.userId) {
        return this.usersService.findById(user.userId).catch(() => null);
      }
      return null;
    };

    const dbUser = await findUser();

    if (!dbUser) {
      const newUser = await this.usersService.createUser({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
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

    const findUser = async () => {
      if (user.googleId) {
        return this.usersService.findByGoogleId(user.googleId);
      }
      if (user.userId) {
        return this.usersService.findById(user.userId).catch(() => null);
      }
      return null;
    };

    const dbUser = await findUser();

    if (!dbUser) {
      throw new NotFoundException(
        'User not found. Please complete onboarding first.',
      );
    }

    return this.usersService.updateProfile(dbUser.id, dto);
  }

  @Post('me/avatar')
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload profile avatar' })
  @ApiResponse({ status: 200, description: 'Avatar uploaded' })
  async uploadAvatar(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const user = (req as any).user;
    const userId = user.userId || (user.googleId ? undefined : undefined);

    const dbUser = user.userId
      ? await this.usersService.findById(user.userId).catch(() => null)
      : user.googleId
        ? await this.usersService.findByGoogleId(user.googleId)
        : null;

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    const result = await this.cloudinary.uploadFromBuffer(file.buffer, {
      folder: `users/${dbUser.id}`,
      publicId: 'avatar',
    });

    return this.usersService.updateProfile(dbUser.id, { avatar: result.url });
  }

  @Patch('me/active-tag')
  @SkipOnboardingCheck()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Set or clear active server tag on profile' })
  @ApiOkResponse({ type: UserResponseDto })
  async setActiveTag(
    @Req() req: Request,
    @Body() dto: SetActiveTagDto,
  ) {
    const user = (req as any).user;
    const userId = user.userId;
    const dbUser = userId
      ? await this.usersService.findById(userId).catch(() => null)
      : null;
    if (!dbUser) throw new NotFoundException('User not found');
    return this.usersService.setActiveTag(dbUser.id, dto.serverId);
  }

  @Get('me/active-tag')
  @SkipOnboardingCheck()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get active server tag on profile' })
  async getActiveTag(@Req() req: Request) {
    const user = (req as any).user;
    const userId = user.userId;
    const dbUser = userId
      ? await this.usersService.findById(userId).catch(() => null)
      : null;
    if (!dbUser) throw new NotFoundException('User not found');
    return this.usersService.getActiveTag(dbUser.id);
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
