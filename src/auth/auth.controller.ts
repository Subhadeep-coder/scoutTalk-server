import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
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
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { SignupDto, LoginDto } from './dto/auth.dto';
import {
  AuthStatusResponseDto,
  GoogleCallbackResponseDto,
  AuthTokensResponseDto,
  RefreshTokenResponseDto,
  LogoutResponseDto,
} from '../../docs/dto/response.dto';
import { MobileGoogleAuthDto } from '../../docs/dto/mobile-auth.dto';
import { RefreshTokenDto } from '../../docs/dto/refresh-token.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../../docs/dto/password-reset.dto';
import {
  VerifyEmailDto,
  ResendVerificationDto,
} from '../../docs/dto/email-verification.dto';

interface AuthenticatedRequest extends Request {
  user: GoogleUser & { userId?: string; accessToken?: string };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in with email and password',
    description:
      'Authenticates user with email and password. Returns JWT tokens on success.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthTokensResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password, or email not yet verified',
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

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
    const { user, needsOnboarding } =
      await this.authService.validateMobileGoogleToken(body.idToken);
    const tokens = await this.authService.generateTokens(user);
    return {
      user,
      ...tokens,
      onboarding: needsOnboarding,
    };
  }

  @Get('google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Initiate Google OAuth',
    description:
      'Redirects user to Google for authentication. Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to be configured.',
  })
  async googleAuth() {}

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth Callback',
    description:
      'Handles the callback from Google after user authentication. Returns JWT token on success.',
  })
  async googleAuthCallback(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const user = req.user;
    const tokens = await this.authService.generateTokens(user);
    const dbUser = await this.authService.findOrCreateFromGoogle(user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(
      `${frontendUrl}/auth/callback?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}&onboarding=${dbUser.needsOnboarding}`,
    );
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

  @Post('signup')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Sign up with email and password',
    description: 'Creates a new user account and sends a verification email.',
  })
  @ApiResponse({
    status: 201,
    description: 'Account created, verification email sent',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Account created. Please check your email to verify your account.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (invalid email, password too short, etc.)',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already in use (account is already verified)',
  })
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address',
    description:
      'Validates the email verification token, marks the email as verified, and returns JWT tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    type: AuthTokensResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification token',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend verification email',
    description:
      'Resends the email verification link. Always returns 200 to prevent email enumeration.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent if account exists',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'If an account exists, a verification email has been sent.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (invalid email)',
  })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Sends a password reset email with a time-limited token if the email exists.',
  })
  @ApiResponse({
    status: 200,
    description:
      'If the email exists, a reset link has been sent (always returns 200 to prevent email enumeration)',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'If an account exists, a password reset link has been sent.',
        },
      },
    },
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email).catch(() => {
      // Silently ignore to prevent email enumeration
    });
    return {
      message: 'If an account exists, a password reset link has been sent.',
    };
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with token',
    description:
      'Validates the reset token and updates the password. Token expires after 1 hour.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password reset successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid, expired, or already used reset token; or validation error',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: 'Password reset successfully' };
  }
}
