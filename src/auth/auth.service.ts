import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { UsersService } from '../users/users.service';
import { RefreshToken } from '../database/entities';
import { randomUUID } from 'crypto';

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

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly ACCESS_TOKEN_EXPIRY = 15 * 60;
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService<Record<string, unknown>>,
    private usersService: UsersService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async generateTokens(googleUser: GoogleUser): Promise<AuthTokens> {
    const user = await this.usersService.findOrCreateFromGoogle(googleUser);
    const access_token = this.generateJwt(googleUser);
    const refresh_token = await this.generateRefreshToken(user.id);
    return { access_token, refresh_token };
  }

  generateJwt(user: GoogleUser): string {
    const payload: JwtPayload = {
      sub: user.googleId,
      email: user.email,
      name: user.name,
    };
    return this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });
  }

  generateTokenFromUser(userId: string, email: string, name: string): string {
    const payload: JwtPayload = {
      sub: userId,
      email,
      name,
    };
    return this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY * 1000);

    const refreshToken = this.refreshTokenRepository.create({
      userId,
      token,
      expiresAt,
    });
    await this.refreshTokenRepository.save(refreshToken);

    return token;
  }

  async validateRefreshToken(refreshToken: string): Promise<{
    userId: string;
    googleId: string;
    email: string;
    name: string;
  }> {
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.expiresAt < new Date()) {
      await this.refreshTokenRepository.delete(tokenRecord.id);
      throw new UnauthorizedException('Refresh token expired');
    }

    return {
      userId: tokenRecord.userId,
      googleId: tokenRecord.user.googleId,
      email: tokenRecord.user.email,
      name: tokenRecord.user.displayName || '',
    };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.delete({ token: refreshToken });
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.validateRefreshToken(refreshToken);

    const googleUser: GoogleUser = {
      googleId: user.googleId,
      email: user.email,
      name: user.name,
    };

    await this.revokeRefreshToken(refreshToken);

    const newAccessToken = this.generateJwt(googleUser);
    const newRefreshToken = await this.generateRefreshToken(user.userId);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
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

  async validateMobileGoogleToken(
    idToken: string,
  ): Promise<{ user: GoogleUser; isOnboarded: boolean }> {
    const googleConfig = this.configService.get<{
      clientId: string;
      clientIdAndroid: string;
    }>('google');

    if (!googleConfig?.clientId || !googleConfig?.clientIdAndroid) {
      throw new UnauthorizedException(
        'Google configuration is not properly set',
      );
    }

    const validAudiences = [
      googleConfig.clientId,
      googleConfig.clientIdAndroid,
    ].filter(Boolean);

    let payload: TokenPayload | undefined;
    let errorMessage = '';

    for (const audience of validAudiences) {
      const client = new OAuth2Client(audience);
      try {
        const ticket = await client.verifyIdToken({
          idToken,
          audience,
        });
        payload = ticket.getPayload();
        if (payload) break;
      } catch (e: unknown) {
        const err = e as { code?: string; message?: string };
        errorMessage = err.message || err.code || 'Unknown error';
        continue;
      }
    }

    if (!payload) {
      this.logger.error(`Google token validation failed: ${errorMessage}`);
      throw new UnauthorizedException('Invalid Google ID token');
    }

    const googleUser: GoogleUser = {
      googleId: payload.sub,
      email: payload.email || '',
      name: payload.name || '',
      picture: payload.picture,
    };

    const user = await this.usersService.findOrCreateFromGoogle(googleUser);

    return {
      user: googleUser,
      isOnboarded: user.isOnboarded,
    };
  }

  async findOrCreateFromGoogle(googleUser: GoogleUser) {
    return this.usersService.findOrCreateFromGoogle(googleUser);
  }
}
