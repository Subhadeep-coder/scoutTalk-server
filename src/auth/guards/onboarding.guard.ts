import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SKIP_ONBOARDING_KEY } from '../decorators/skip-onboarding.decorator';
import { UsersService } from '../../users/users.service';

@Injectable()
export class OnboardingGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipOnboarding = this.reflector.getAllAndOverride<boolean>(
      SKIP_ONBOARDING_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipOnboarding) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.googleId) {
      return true;
    }

    const dbUser = await this.usersService.findByGoogleId(user.googleId);

    if (!dbUser || !dbUser.isOnboarded) {
      throw new ForbiddenException(
        'Please complete onboarding to access this resource. Set a username first.',
      );
    }

    return true;
  }
}
