import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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
}
