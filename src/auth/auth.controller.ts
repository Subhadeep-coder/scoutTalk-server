import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Public } from './decorators/public.decorator';
import { AuthService, GoogleUser } from './auth.service';

interface AuthenticatedRequest extends Request {
  user: GoogleUser;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @Public()
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
  @UseGuards(AuthGuard('google'))
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
  getAuthStatus() {
    return {
      googleConfigured: this.authService.isGoogleConfigured(),
      jwtConfigured: true,
    };
  }

  @Get('me')
  async getCurrentUser(@Req() req: Request) {
    const user = (req as any).user;
    return {
      userId: user?.userId,
      email: user?.email,
      name: user?.name,
    };
  }
}
