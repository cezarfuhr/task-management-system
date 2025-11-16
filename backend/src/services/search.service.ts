import prisma from '../utils/db';

export class SearchService {
  // Index entity for search
  static async indexEntity(
    entityType: 'task' | 'board' | 'comment',
    entityId: string,
    content: string,
    metadata?: any
  ): Promise<void> {
    await prisma.searchIndex.upsert({
      where: {
        entityType_entityId: {
          entityType,
          entityId,
        },
      },
      update: {
        content,
        metadata,
        updatedAt: new Date(),
      },
      create: {
        entityType,
        entityId,
        content,
        metadata,
      },
    });
  }

  // Search across all entities
  static async search(query: string, userId: string, options?: {
    entityType?: 'task' | 'board' | 'comment';
    limit?: number;
    offset?: number;
  }) {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    // Search in tasks
    const tasks = await prisma.task.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          {
            board: {
              OR: [
                { ownerId: userId },
                { members: { some: { userId } } },
              ],
            },
          },
          { isArchived: false },
        ],
      },
      include: {
        board: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { updatedAt: 'desc' },
    });

    // Search in boards
    const boards = await prisma.board.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          {
            OR: [
              { ownerId: userId },
              { members: { some: { userId } } },
            ],
          },
          { isArchived: false },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            columns: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { updatedAt: 'desc' },
    });

    return {
      tasks,
      boards,
      total: tasks.length + boards.length,
    };
  }

  // Remove from search index
  static async removeFromIndex(
    entityType: 'task' | 'board' | 'comment',
    entityId: string
  ): Promise<void> {
    await prisma.searchIndex.deleteMany({
      where: {
        entityType,
        entityId,
      },
    });
  }
}
