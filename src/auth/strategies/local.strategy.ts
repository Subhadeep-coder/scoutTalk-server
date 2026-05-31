import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { AuthenticatedUser } from './jwt.strategy';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<AuthenticatedUser> {
    const result = await this.authService.login({ email, password });
    return {
      userId: result.user.id!,
      email: result.user.email!,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
    };
  }
}
