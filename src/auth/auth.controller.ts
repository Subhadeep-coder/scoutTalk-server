import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '../../docs';
import { Public } from './decorators/public.decorator';
import { SkipOnboardingCheck } from './decorators/skip-onboarding.decorator';
import { AuthService, GoogleUser } from './auth.service';
import {
  AuthStatusResponseDto,
  GoogleAuthResponseDto,
  GoogleCallbackResponseDto,
  AuthErrorResponseDto,
  UserResponseDto,
  RefreshTokenResponseDto,
  LogoutResponseDto,
} from '../../docs/dto/response.dto';
import { MobileGoogleAuthDto } from '../../docs/dto/mobile-auth.dto';
import { RefreshTokenDto } from '../../docs/dto/refresh-token.dto';

interface AuthenticatedRequest extends Request {
  user: GoogleUser & { userId?: string };
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
    const { user, isOnboarded } =
      await this.authService.validateMobileGoogleToken(body.idToken);
    const tokens = await this.authService.generateTokens(user);
    return {
      user,
      ...tokens,
      onboarding: isOnboarded,
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
    const tokens = await this.authService.generateTokens(user);
    const dbUser = await this.authService.findOrCreateFromGoogle(user);
    return {
      user,
      ...tokens,
      onboarding: dbUser.isOnboarded,
    };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh Access Token',
    description:
      'Exchange a valid refresh token for a new access token and refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refreshToken(@Body() body: RefreshTokenDto) {
    const tokens = await this.authService.refreshAccessToken(
      body.refresh_token,
    );
    return tokens;
  }

  @Post('logout')
  @Public()
  @SkipOnboardingCheck()
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout',
    description: 'Invalidate the current refresh token to logout the user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    type: LogoutResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async logout(@Req() req: Request, @Body() body: RefreshTokenDto) {
    await this.authService.revokeRefreshToken(body.refresh_token);
    return { message: 'Logged out successfully' };
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
    const dbUser = await this.authService.findOrCreateFromGoogle({
      googleId: user?.googleId,
      email: user?.email,
      name: user?.name,
    });
    return {
      userId: user?.userId,
      email: user?.email,
      name: user?.name,
      onboarding: dbUser.isOnboarded,
    };
  }
}
