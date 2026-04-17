import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { JwtConfig } from '../config/interfaces/config.interface';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService<Record<string, unknown>>,
  ) {}

  generateJwt(user: GoogleUser): string {
    const payload: JwtPayload = {
      sub: user.googleId,
      email: user.email,
      name: user.name,
    };
    return this.jwtService.sign(payload);
  }

  generateTokenFromUser(userId: string, email: string, name: string): string {
    const payload: JwtPayload = {
      sub: userId,
      email,
      name,
    };
    return this.jwtService.sign(payload);
  }

  validateUser(payload: JwtPayload) {
    return payload;
  }

  isGoogleConfigured(): boolean {
    const googleConfig = this.configService.get<{
      clientId: string;
      clientSecret: string;
    }>('google');
    return !!(googleConfig?.clientId && googleConfig?.clientSecret);
  }

  async validateMobileGoogleToken(idToken: string): Promise<GoogleUser> {
    const googleConfig = this.configService.get<{
      clientId: string;
    }>('google');

    const client = new OAuth2Client(googleConfig?.clientId);

    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: googleConfig?.clientId,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException('Invalid token payload');
      }

      return {
        googleId: payload.sub,
        email: payload.email || '',
        name: payload.name || '',
        picture: payload.picture,
      };
    } catch (error) {
      this.logger.error('Google token validation failed', error);
      throw new UnauthorizedException('Invalid Google ID token');
    }
  }
}
