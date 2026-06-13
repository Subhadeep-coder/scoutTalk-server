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

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findByEmailWithPassword(email: string) {
    return this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'password',
        'firstName',
        'lastName',
        'displayName',
        'avatar',
        'needsOnboarding',
        'emailVerified',
        'username',
        'createdAt',
        'updatedAt',
      ],
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
    googleId?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    password?: string;
  }) {
    const displayName = data.lastName
      ? `${data.firstName ?? ''} ${data.lastName}`.trim()
      : (data.firstName ?? undefined);

    const user = this.userRepository.create({
      googleId: data.googleId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      displayName,
      avatar: data.avatar,
      password: data.password,
      emailVerified: !!data.googleId,
      needsOnboarding: true,
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
      needsOnboarding: false,
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

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userRepository.update(userId, { password: hashedPassword });
  }

  async updateNames(
    userId: string,
    data: { firstName?: string; lastName?: string },
  ): Promise<void> {
    const updates: Record<string, string | undefined> = {};
    if (data.firstName !== undefined) updates.firstName = data.firstName;
    if (data.lastName !== undefined) updates.lastName = data.lastName;
    if (Object.keys(updates).length > 0) {
      const existing = await this.findById(userId);
      const firstName = updates.firstName ?? existing.firstName ?? '';
      const lastName = updates.lastName ?? existing.lastName ?? '';
      updates.displayName = lastName
        ? `${firstName} ${lastName}`.trim()
        : firstName || undefined;
      await this.userRepository.update(userId, updates);
    }
  }

  async updateEmailVerified(userId: string, verified: boolean): Promise<void> {
    await this.userRepository.update(userId, { emailVerified: verified });
  }

  async findOrCreateFromGoogle(googleUser: {
    googleId: string;
    email: string;
    firstName: string;
    lastName?: string;
    picture?: string;
  }) {
    let user = await this.findByGoogleId(googleUser.googleId);

    if (!user) {
      user = await this.createUser({
        googleId: googleUser.googleId,
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        avatar: googleUser.picture,
      });
    }

    return user;
  }
}
