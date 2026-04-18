import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities';
import { UpdateUsernameDto, UpdateProfileDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByGoogleId(googleId: string) {
    return this.userRepository.findOne({
      where: { googleId },
    });
  }

  async findByUsername(username: string) {
    return this.userRepository.findOne({
      where: { username },
    });
  }

  async findById(userId: string) {
    const user = await this.userRepository.findOne({
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
    const user = this.userRepository.create({
      googleId: data.googleId,
      email: data.email,
      name: data.name,
      avatar: data.avatar,
    });
    return this.userRepository.save(user);
  }

  async checkUsernameAvailability(username: string): Promise<boolean> {
    const existing = await this.userRepository.findOne({
      where: { username },
    });
    return !existing;
  }

  async setUsername(userId: string, dto: UpdateUsernameDto) {
    const available = await this.checkUsernameAvailability(dto.username);
    if (!available) {
      throw new ConflictException('Username is already taken');
    }

    await this.userRepository.update(userId, {
      username: dto.username,
      isOnboarded: true,
    });

    return this.findById(userId);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.userRepository.update(userId, {
      displayName: dto.displayName,
      avatar: dto.avatar,
    });

    return this.findById(userId);
  }

  async findOrCreateFromGoogle(googleUser: {
    googleId: string;
    email: string;
    name?: string;
    picture?: string;
  }) {
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
