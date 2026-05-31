import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { GoogleConfig } from '../../config/interfaces/config.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private configService: ConfigService<Record<string, unknown>>) {
    const googleConfig = configService.get<GoogleConfig>('google');

    if (!googleConfig?.clientId || !googleConfig?.clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    super({
      clientID: googleConfig.clientId,
      clientSecret: googleConfig.clientSecret,
      callbackURL: googleConfig.callbackUrl,
      scope: ['email', 'profile'],
    });

    this.logger.log('Google OAuth strategy initialized');
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const { id, displayName, emails, photos } = profile;
    const nameParts = (displayName || '').split(' ');
    return {
      googleId: id,
      email: emails?.[0]?.value,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || undefined,
      picture: photos?.[0]?.value,
      accessToken,
    };
  }
}
