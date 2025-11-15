import { appRouter } from '../../routers';
import prisma from '../../utils/db';

jest.mock('../../utils/db', () => ({
  __esModule: true,
  default: {
    board: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
    boardMember: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

describe('Boards Router', () => {
  const mockContext = {
    userId: 'test-user-id',
    req: {} as any,
    res: {} as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all boards for user', async () => {
      const mockBoards = [
        {
          id: 'board-1',
          title: 'Test Board',
          description: 'Test Description',
          color: '#3B82F6',
          ownerId: 'test-user-id',
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          owner: {
            id: 'test-user-id',
            name: 'Test User',
            email: 'test@example.com',
            avatar: null,
          },
          members: [],
          _count: {
            tasks: 0,
            columns: 3,
          },
        },
      ];

      (prisma.board.findMany as jest.Mock).mockResolvedValue(mockBoards);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.boards.getAll({ includeArchived: false });

      expect(result).toEqual(mockBoards);
      expect(prisma.board.findMany).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new board with default columns', async () => {
      const mockBoard = {
        id: 'board-1',
        title: 'New Board',
        description: null,
        color: '#3B82F6',
        ownerId: 'test-user-id',
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        columns: [
          { id: 'col-1', title: 'To Do', position: 0 },
          { id: 'col-2', title: 'In Progress', position: 1 },
          { id: 'col-3', title: 'Done', position: 2 },
        ],
      };

      (prisma.board.create as jest.Mock).mockResolvedValue(mockBoard);
      (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.boards.create({
        title: 'New Board',
      });

      expect(result).toEqual(mockBoard);
      expect(prisma.board.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'New Board',
          ownerId: 'test-user-id',
          columns: {
            create: [
              { title: 'To Do', position: 0 },
              { title: 'In Progress', position: 1 },
              { title: 'Done', position: 2 },
            ],
          },
        }),
        include: {
          columns: true,
        },
      });
    });
  });

  describe('addMember', () => {
    it('should add a member to the board', async () => {
      const mockBoard = {
        id: 'board-1',
        title: 'Test Board',
        ownerId: 'test-user-id',
      };

      const mockMember = {
        id: 'member-1',
        boardId: 'board-1',
        userId: 'new-user-id',
        role: 'member',
        createdAt: new Date(),
        user: {
          id: 'new-user-id',
          name: 'New User',
          email: 'new@example.com',
          avatar: null,
        },
      };

      (prisma.board.findFirst as jest.Mock).mockResolvedValue(mockBoard);
      (prisma.boardMember.create as jest.Mock).mockResolvedValue(mockMember);
      (prisma.notification.create as jest.Mock).mockResolvedValue({});

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.boards.addMember({
        boardId: 'board-1',
        userId: 'new-user-id',
        role: 'member',
      });

      expect(result).toEqual(mockMember);
      expect(prisma.notification.create).toHaveBeenCalled();
    });
  });
});
