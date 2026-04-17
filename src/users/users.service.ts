import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUsernameDto, UpdateProfileDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async findByGoogleId(googleId: string) {
    if (!this.prisma.user) {
      throw new BadRequestException('Database not configured');
    }
    return this.prisma.user.findUnique({
      where: { googleId },
    });
  }

  async findByUsername(username: string) {
    if (!this.prisma.user) {
      throw new BadRequestException('Database not configured');
    }
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findById(userId: string) {
    if (!this.prisma.user) {
      throw new BadRequestException('Database not configured');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async createUser(data: {
    googleId: string;
    email: string;
    name?: string;
    avatar?: string;
  }) {
    if (!this.prisma.user) {
      throw new BadRequestException('Database not configured');
    }
    return this.prisma.user.create({
      data: {
        googleId: data.googleId,
        email: data.email,
        displayName: data.name,
        avatar: data.avatar,
      },
    });
  }

  async checkUsernameAvailability(username: string): Promise<boolean> {
    if (!this.prisma.user) {
      throw new BadRequestException('Database not configured');
    }
    const existing = await this.prisma.user.findUnique({
      where: { username },
    });
    return !existing;
  }

  async setUsername(userId: string, dto: UpdateUsernameDto) {
    if (!this.prisma.user) {
      throw new BadRequestException('Database not configured');
    }

    const available = await this.checkUsernameAvailability(dto.username);
    if (!available) {
      throw new ConflictException('Username is already taken');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        username: dto.username,
        isOnboarded: true,
      },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (!this.prisma.user) {
      throw new BadRequestException('Database not configured');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        avatar: dto.avatar,
      },
    });
  }

  async findOrCreateFromGoogle(googleUser: {
    googleId: string;
    email: string;
    name?: string;
    picture?: string;
  }) {
    if (!this.prisma.user) {
      throw new BadRequestException('Database not configured');
    }

    let user = await this.findByGoogleId(googleUser.googleId);

    if (!user) {
      user = await this.createUser({
        googleId: googleUser.googleId,
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
      });
    }

    return user;
  }
}
