import { appRouter } from '../../routers';
import { createContext } from '../../types';
import prisma from '../../utils/db';

// Mock Prisma
jest.mock('../../utils/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

describe('Users Router', () => {
  const mockContext = {
    userId: 'test-user-id',
    req: {} as any,
    res: {} as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('me', () => {
    it('should return current user with boards', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        avatar: null,
        theme: 'light',
        createdAt: new Date(),
        updatedAt: new Date(),
        boardsOwned: [],
        boardMembers: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.users.me();

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        include: {
          boardsOwned: {
            where: { isArchived: false },
            orderBy: { updatedAt: 'desc' },
          },
          boardMembers: {
            include: {
              board: true,
            },
          },
        },
      });
    });
  });

  describe('updateSettings', () => {
    it('should update user settings', async () => {
      const mockUpdatedUser = {
        id: 'test-user-id',
        name: 'Updated Name',
        theme: 'dark',
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.users.updateSettings({
        name: 'Updated Name',
        theme: 'dark',
      });

      expect(result).toEqual(mockUpdatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: {
          name: 'Updated Name',
          theme: 'dark',
        },
      });
    });
  });

  describe('getNotifications', () => {
    it('should return paginated notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          type: 'task_assigned',
          title: 'Task Assigned',
          message: 'You have been assigned a task',
          userId: 'test-user-id',
          isRead: false,
          metadata: null,
          createdAt: new Date(),
        },
      ];

      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);
      (prisma.notification.count as jest.Mock).mockResolvedValue(1);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.users.getNotifications({
        limit: 50,
        offset: 0,
        unreadOnly: false,
      });

      expect(result).toEqual({
        notifications: mockNotifications,
        total: 1,
        hasMore: false,
      });
    });
  });
});
