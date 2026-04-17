import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 'user-1',
    googleId: 'google-123',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    avatar: 'https://example.com/avatar.png',
    isOnboarded: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
  });

  describe('findByGoogleId', () => {
    it('should return user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByGoogleId('google-123');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { googleId: 'google-123' },
      });
    });

    it('should throw BadRequestException when database not configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UsersService,
          { provide: PrismaService, useValue: { user: null } },
        ],
      }).compile();

      const svc = module.get<UsersService>(UsersService);

      await expect(svc.findByGoogleId('google-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findByUsername', () => {
    it('should return user when username exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(result).toEqual(mockUser);
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.createUser({
        googleId: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'https://example.com/avatar.png',
      });

      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          googleId: 'google-123',
          email: 'test@example.com',
          displayName: 'Test User',
          avatar: 'https://example.com/avatar.png',
        },
      });
    });

    it('should throw BadRequestException when database not configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UsersService,
          { provide: PrismaService, useValue: { user: null } },
        ],
      }).compile();

      const svc = module.get<UsersService>(UsersService);

      await expect(
        svc.createUser({ googleId: 'google-123', email: 'test@example.com' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkUsernameAvailability', () => {
    it('should return true when username is available', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.checkUsernameAvailability('newuser');

      expect(result).toBe(true);
    });

    it('should return false when username is taken', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.checkUsernameAvailability('testuser');

      expect(result).toBe(false);
    });
  });

  describe('setUsername', () => {
    const updateDto = { username: 'newusername' };

    it('should set username when available', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        username: 'newusername',
        isOnboarded: true,
      });

      const result = await service.setUsername('user-1', updateDto);

      expect(result.username).toBe('newusername');
      expect(result.isOnboarded).toBe(true);
    });

    it('should throw ConflictException when username taken', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.setUsername('user-1', updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        displayName: 'Updated Name',
      });

      const result = await service.updateProfile('user-1', {
        displayName: 'Updated Name',
      });

      expect(result.displayName).toBe('Updated Name');
    });
  });

  describe('findOrCreateFromGoogle', () => {
    const googleUser = {
      googleId: 'google-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.png',
    };

    it('should return existing user if found', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOrCreateFromGoogle(googleUser);

      expect(result).toEqual(mockUser);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should create new user if not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.findOrCreateFromGoogle(googleUser);

      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalled();
    });
  });
});
