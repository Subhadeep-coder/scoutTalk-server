import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../src/users/users.controller';
import { UsersService } from '../../src/users/users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

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
    refreshTokens: [],
  };

  const mockRequest = {
    user: {
      googleId: 'google-123',
      email: 'test@example.com',
      name: 'Test User',
    },
  };

  beforeEach(async () => {
    const mockUsersService = {
      findByGoogleId: jest.fn(),
      findByUsername: jest.fn(),
      createUser: jest.fn(),
      setUsername: jest.fn(),
      updateProfile: jest.fn(),
      checkUsernameAvailability: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  describe('getCurrentUser', () => {
    it('should return user from database if exists', async () => {
      usersService.findByGoogleId.mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser(mockRequest as any);

      expect(result).toEqual(mockUser);
    });

    it('should return basic info if user not in database', async () => {
      usersService.findByGoogleId.mockResolvedValue(null);

      const result = await controller.getCurrentUser(mockRequest as any);

      expect(result).toEqual({
        id: 'google-123',
        googleId: 'google-123',
        email: 'test@example.com',
        displayName: 'Test User',
        isOnboarded: false,
        username: null,
      });
    });
  });

  describe('getOnboardingStatus', () => {
    it('should return onboarded status from database', async () => {
      usersService.findByGoogleId.mockResolvedValue(mockUser);

      const result = await controller.getOnboardingStatus(mockRequest as any);

      expect(result).toEqual({ isOnboarded: true });
    });

    it('should return false if user not in database', async () => {
      usersService.findByGoogleId.mockResolvedValue(null);

      const result = await controller.getOnboardingStatus(mockRequest as any);

      expect(result).toEqual({ isOnboarded: false });
    });
  });

  describe('setUsername', () => {
    it('should create user and set username if not exists', async () => {
      usersService.findByGoogleId.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue(mockUser);
      usersService.setUsername.mockResolvedValue({
        ...mockUser,
        username: 'newuser',
        isOnboarded: true,
      });

      const result = await controller.setUsername(mockRequest as any, {
        username: 'newuser',
      });

      expect(usersService.createUser).toHaveBeenCalled();
      expect(usersService.setUsername).toHaveBeenCalledWith('user-1', {
        username: 'newuser',
      });
    });

    it('should set username if user exists but not onboarded', async () => {
      const unonboardedUser = {
        ...mockUser,
        isOnboarded: false,
        username: undefined,
      };
      usersService.findByGoogleId.mockResolvedValue(unonboardedUser);
      usersService.setUsername.mockResolvedValue({
        ...mockUser,
        username: 'newuser',
        isOnboarded: true,
      });

      const result = await controller.setUsername(mockRequest as any, {
        username: 'newuser',
      });

      expect(usersService.setUsername).toHaveBeenCalledWith('user-1', {
        username: 'newuser',
      });
    });

    it('should return existing user if already onboarded', async () => {
      usersService.findByGoogleId.mockResolvedValue(mockUser);

      const result = await controller.setUsername(mockRequest as any, {
        username: 'newuser',
      });

      expect(result).toEqual({
        message: 'User already onboarded',
        user: mockUser,
      });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      usersService.findByGoogleId.mockResolvedValue(mockUser);
      usersService.updateProfile.mockResolvedValue({
        ...mockUser,
        displayName: 'Updated Name',
      });

      const result = await controller.updateProfile(mockRequest as any, {
        displayName: 'Updated Name',
      });

      expect(result.displayName).toBe('Updated Name');
    });

    it('should throw error if user not found', async () => {
      usersService.findByGoogleId.mockResolvedValue(null);

      await expect(
        controller.updateProfile(mockRequest as any, { displayName: 'Test' }),
      ).rejects.toThrow();
    });
  });

  describe('checkUsername', () => {
    it('should return availability', async () => {
      usersService.checkUsernameAvailability.mockResolvedValue(true);

      const result = await controller.checkUsername('newuser');

      expect(result).toEqual({
        available: true,
        username: 'newuser',
      });
    });
  });
});
