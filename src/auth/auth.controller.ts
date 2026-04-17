import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '../../docs';
import { Public } from './decorators/public.decorator';
import { AuthService, GoogleUser } from './auth.service';
import {
  AuthStatusResponseDto,
  GoogleAuthResponseDto,
  GoogleCallbackResponseDto,
  AuthErrorResponseDto,
  UserResponseDto,
} from '../../docs/dto/response.dto';
import { MobileGoogleAuthDto } from '../../docs/dto/mobile-auth.dto';

interface AuthenticatedRequest extends Request {
  user: GoogleUser;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('google/mobile')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Google Sign-In for Mobile Apps',
    description:
      'Validates Google ID token from Android/iOS app and returns JWT for API authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    type: GoogleCallbackResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid Google ID token',
  })
  async mobileGoogleAuth(@Body() body: MobileGoogleAuthDto) {
    const googleUser = await this.authService.validateMobileGoogleToken(
      body.idToken,
    );
    const token = this.authService.generateJwt(googleUser);
    return {
      user: googleUser,
      access_token: token,
    };
  }

  @Get('google')
  @Public()
  @ApiOperation({
    summary: 'Initiate Google OAuth',
    description:
      'Redirects user to Google for authentication. Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to be configured.',
  })
  @ApiResponse({
    status: 200,
    description: 'Redirect message or configuration error',
    type: GoogleAuthResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Google OAuth not configured',
    type: AuthErrorResponseDto,
  })
  async googleAuth() {
    if (!this.authService.isGoogleConfigured()) {
      return {
        statusCode: 503,
        message:
          'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
      };
    }
    return { message: 'Redirecting to Google...' };
  }

  @Get('google/callback')
  @Public()
  @ApiOperation({
    summary: 'Google OAuth Callback',
    description:
      'Handles the callback from Google after user authentication. Returns JWT token on success.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful, returns user data and JWT token',
    type: GoogleCallbackResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Google OAuth not configured',
    type: AuthErrorResponseDto,
  })
  async googleAuthCallback(@Req() req: AuthenticatedRequest) {
    if (!this.authService.isGoogleConfigured()) {
      return {
        statusCode: 503,
        message: 'Google OAuth not configured',
      };
    }
    const user = req.user;
    const token = this.authService.generateJwt(user);
    return {
      user,
      access_token: token,
    };
  }

  @Get('status')
  @Public()
  @ApiOperation({
    summary: 'Check Authentication Status',
    description:
      'Returns the current configuration status of authentication methods.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication configuration status',
    type: AuthStatusResponseDto,
  })
  getAuthStatus() {
    return {
      googleConfigured: this.authService.isGoogleConfigured(),
      jwtConfigured: true,
    };
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get Current User',
    description:
      'Returns the authenticated user information from the JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user information',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getCurrentUser(@Req() req: Request) {
    const user = (req as any).user;
    return {
      userId: user?.userId,
      email: user?.email,
      name: user?.name,
    };
  }
}
