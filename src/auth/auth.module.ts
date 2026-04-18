import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OnboardingGuard } from './guards/onboarding.guard';
import { JwtConfig } from '../config/interfaces/config.interface';
import { UsersModule } from '../users/users.module';
import { RefreshToken } from '../database/entities';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const jwtConfig = configService.get<JwtConfig>('jwt');
        return {
          secret: jwtConfig?.secret || 'your-jwt-secret',
          signOptions: {
            expiresIn: 60 * 60 * 24 * 7,
          },
        };
      },
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, OnboardingGuard],
  exports: [AuthService, JwtAuthGuard, OnboardingGuard, JwtModule],
})
export class AuthModule {}
