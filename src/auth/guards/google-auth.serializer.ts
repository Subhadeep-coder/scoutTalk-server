import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { AuthService, GoogleUser } from '../auth.service';

@Injectable()
export class GoogleAuthSerializer extends PassportSerializer {
  constructor(private authService: AuthService) {
    super();
  }

  serializeUser(
    user: GoogleUser & { accessToken?: string },
    done: CallableFunction,
  ) {
    done(null, user);
  }

  async deserializeUser(
    payload: GoogleUser & { accessToken?: string },
    done: CallableFunction,
  ) {
    done(null, payload);
  }
}
