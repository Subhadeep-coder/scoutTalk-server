import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { RefreshToken, User } from '../database/entities';
import { randomUUID } from 'crypto';

export interface JwtPayload {
  sub: string;
  email: string;
  firstName?: string;
  lastName?: string;
  googleId?: string;
}

export interface GoogleUser {
  googleId: string;
  email: string;
  firstName: string;
  lastName?: string;
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
  private readonly ARGON2_CONFIG = {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  };

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService<Record<string, unknown>>,
    private usersService: UsersService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async signup(dto: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<AuthTokens & { user: Partial<User> }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await argon2.hash(dto.password, this.ARGON2_CONFIG);
    const user = await this.usersService.createUser({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: hashedPassword,
    });

    const tokens = await this.generateTokenPair(
      user.id,
      user.email,
      user.firstName,
      user.lastName,
    );
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        needsOnboarding: user.needsOnboarding,
      },
    };
  }

  async login(dto: {
    email: string;
    password: string;
  }): Promise<AuthTokens & { user: Partial<User> }> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await argon2.verify(user.password, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokenPair(
      user.id,
      user.email,
      user.firstName,
      user.lastName,
    );
    const userResponse: Record<string, unknown> = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
    };
    if (user.username) {
      userResponse.username = user.username;
    } else {
      userResponse.needsOnboarding = true;
    }
    return {
      ...tokens,
      user: userResponse,
    };
  }

  async generateTokenPair(
    userId: string,
    email: string,
    firstName?: string,
    lastName?: string,
  ): Promise<AuthTokens> {
    const access_token = this.generateAccessToken(
      userId,
      email,
      firstName,
      lastName,
    );
    const refresh_token = await this.createRefreshToken(userId);
    return { access_token, refresh_token };
  }

  generateAccessToken(
    userId: string,
    email: string,
    firstName?: string,
    lastName?: string,
  ): string {
    const payload: JwtPayload = {
      sub: userId,
      email,
      firstName,
      lastName,
    };
    return this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });
  }

  async generateTokens(googleUser: GoogleUser): Promise<AuthTokens> {
    const user = await this.usersService.findOrCreateFromGoogle(googleUser);
    const access_token = this.generateGoogleJwt(user, googleUser);
    const refresh_token = await this.createRefreshToken(user.id);
    return { access_token, refresh_token };
  }

  private generateGoogleJwt(user: User, googleUser: GoogleUser): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: googleUser.email,
      firstName: googleUser.firstName,
      lastName: googleUser.lastName,
      googleId: googleUser.googleId,
    };
    return this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });
  }

  generateTokenFromUser(
    userId: string,
    email: string,
    firstName?: string,
    lastName?: string,
  ): string {
    return this.generateAccessToken(userId, email, firstName, lastName);
  }

  private async createRefreshToken(userId: string): Promise<string> {
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
    email: string;
    firstName: string;
    lastName: string;
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
      email: tokenRecord.user.email,
      firstName: tokenRecord.user.firstName || '',
      lastName: tokenRecord.user.lastName || '',
    };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.delete({ token: refreshToken });
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.validateRefreshToken(refreshToken);

    await this.revokeRefreshToken(refreshToken);

    const newAccessToken = this.generateAccessToken(
      user.userId,
      user.email,
      user.firstName,
      user.lastName,
    );
    const newRefreshToken = await this.createRefreshToken(user.userId);

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
  ): Promise<{ user: GoogleUser; needsOnboarding: boolean }> {
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

    const fullName = payload.name || '';
    const nameParts = fullName.split(' ');
    const googleUser: GoogleUser = {
      googleId: payload.sub,
      email: payload.email || '',
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || undefined,
      picture: payload.picture,
    };

    const user = await this.usersService.findOrCreateFromGoogle(googleUser);

    return {
      user: googleUser,
      needsOnboarding: user.needsOnboarding,
    };
  }

  async findOrCreateFromGoogle(googleUser: GoogleUser) {
    return this.usersService.findOrCreateFromGoogle(googleUser);
  }
}
