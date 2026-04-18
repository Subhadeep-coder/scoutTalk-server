import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../../src/users/users.service';
import { User } from '../../src/database/entities';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: 'user-1',
    googleId: 'google-123',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    avatar: 'https://example.com/avatar.png',
    isOnboarded: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    refreshTokens: [],
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
  });

  describe('findByGoogleId', () => {
    it('should return user when found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByGoogleId('google-123');

      expect(result).toEqual(mockUser);
    });
  });

  describe('findByUsername', () => {
    it('should return user when username exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(result).toEqual(mockUser);
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createUser', () => {
    it('should create and return new user', async () => {
      const newUser = { ...mockUser, id: 'new-user-1' };
      userRepository.create.mockReturnValue(newUser);
      userRepository.save.mockResolvedValue(newUser);

      const result = await service.createUser({
        googleId: 'google-456',
        email: 'new@example.com',
        name: 'New User',
        avatar: 'https://example.com/new.png',
      });

      expect(result).toEqual(newUser);
    });
  });

  describe('checkUsernameAvailability', () => {
    it('should return true when username is available', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.checkUsernameAvailability('newusername');

      expect(result).toBe(true);
    });

    it('should return false when username is taken', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.checkUsernameAvailability('testuser');

      expect(result).toBe(false);
    });
  });

  describe('setUsername', () => {
    it('should update username when available', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);
      const updatedUser = { ...mockUser, username: 'newusername' };
      userRepository.findOne.mockResolvedValueOnce(updatedUser);
      userRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.setUsername('user-1', {
        username: 'newusername',
      });

      expect(result).toEqual(updatedUser);
    });

    it('should throw ConflictException when username is taken', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.setUsername('user-1', { username: 'testuser' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateProfile', () => {
    it('should update profile and return updated user', async () => {
      const updatedUser = { ...mockUser, displayName: 'Updated Name' };
      userRepository.update.mockResolvedValue({ affected: 1 } as any);
      userRepository.findOne.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-1', {
        displayName: 'Updated Name',
        avatar: 'https://example.com/updated.png',
      });

      expect(result).toEqual(updatedUser);
    });
  });

  describe('findOrCreateFromGoogle', () => {
    it('should return existing user when found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOrCreateFromGoogle({
        googleId: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(result).toEqual(mockUser);
    });

    it('should create new user when not found', async () => {
      const newUser = { ...mockUser, id: 'new-user-1' };
      userRepository.findOne.mockResolvedValueOnce(null);
      userRepository.create.mockReturnValue(newUser);
      userRepository.save.mockResolvedValue(newUser);

      const result = await service.findOrCreateFromGoogle({
        googleId: 'google-456',
        email: 'new@example.com',
        name: 'New User',
        picture: 'https://example.com/new.png',
      });

      expect(result).toEqual(newUser);
    });
  });
});
