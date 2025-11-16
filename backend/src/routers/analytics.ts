import { z } from 'zod';
import { router, protectedProcedure } from '../utils/trpc';
import prisma from '../utils/db';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export const analyticsRouter = router({
  // Get board statistics
  getBoardStats: protectedProcedure
    .input(z.object({ boardId: z.string() }))
    .query(async ({ input }) => {
      const [
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        tasksByPriority,
        tasksByColumn,
      ] = await Promise.all([
        // Total tasks
        prisma.task.count({
          where: { boardId: input.boardId, isArchived: false },
        }),

        // Completed tasks
        prisma.task.count({
          where: { boardId: input.boardId, status: 'done', isArchived: false },
        }),

        // In progress tasks
        prisma.task.count({
          where: { boardId: input.boardId, status: 'in_progress', isArchived: false },
        }),

        // Overdue tasks
        prisma.task.count({
          where: {
            boardId: input.boardId,
            status: { not: 'done' },
            dueDate: { lt: new Date() },
            isArchived: false,
          },
        }),

        // Tasks by priority
        prisma.task.groupBy({
          by: ['priority'],
          where: { boardId: input.boardId, isArchived: false },
          _count: true,
        }),

        // Tasks by column
        prisma.column.findMany({
          where: { boardId: input.boardId },
          include: {
            _count: {
              select: {
                tasks: {
                  where: { isArchived: false },
                },
              },
            },
          },
        }),
      ]);

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        tasksByPriority: tasksByPriority.map((item) => ({
          priority: item.priority,
          count: item._count,
        })),
        tasksByColumn: tasksByColumn.map((column) => ({
          columnId: column.id,
          columnTitle: column.title,
          count: column._count.tasks,
        })),
      };
    }),

  // Get productivity metrics for user
  getProductivityMetrics: protectedProcedure
    .input(
      z.object({
        boardId: z.string().optional(),
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = startOfDay(subDays(new Date(), input.days));
      const endDate = endOfDay(new Date());

      const [tasksCompleted, tasksCreated, timeEstimateAccuracy] = await Promise.all([
        // Tasks completed
        prisma.task.groupBy({
          by: ['createdAt'],
          where: {
            ...(input.boardId ? { boardId: input.boardId } : {}),
            status: 'done',
            updatedAt: { gte: startDate, lte: endDate },
            board: {
              OR: [
                { ownerId: ctx.userId },
                { members: { some: { userId: ctx.userId } } },
              ],
            },
          },
          _count: true,
        }),

        // Tasks created
        prisma.task.groupBy({
          by: ['createdAt'],
          where: {
            ...(input.boardId ? { boardId: input.boardId } : {}),
            createdAt: { gte: startDate, lte: endDate },
            creatorId: ctx.userId,
          },
          _count: true,
        }),

        // Time estimate accuracy
        prisma.task.findMany({
          where: {
            ...(input.boardId ? { boardId: input.boardId } : {}),
            status: 'done',
            estimatedHours: { not: null },
            actualHours: { not: null },
            updatedAt: { gte: startDate, lte: endDate },
            board: {
              OR: [
                { ownerId: ctx.userId },
                { members: { some: { userId: ctx.userId } } },
              ],
            },
          },
          select: {
            estimatedHours: true,
            actualHours: true,
          },
        }),
      ]);

      // Calculate average estimate accuracy
      let avgAccuracy = 0;
      if (timeEstimateAccuracy.length > 0) {
        const accuracies = timeEstimateAccuracy
          .filter((task) => task.estimatedHours && task.actualHours)
          .map((task) => {
            const estimated = task.estimatedHours!;
            const actual = task.actualHours!;
            return (1 - Math.abs(estimated - actual) / estimated) * 100;
          });

        avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
      }

      return {
        tasksCompletedCount: tasksCompleted.reduce((sum, item) => sum + item._count, 0),
        tasksCreatedCount: tasksCreated.reduce((sum, item) => sum + item._count, 0),
        estimateAccuracy: avgAccuracy,
        period: {
          startDate,
          endDate,
          days: input.days,
        },
      };
    }),

  // Get activity timeline
  getActivityTimeline: protectedProcedure
    .input(
      z.object({
        boardId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const activities = await prisma.activityLog.findMany({
        where: {
          ...(input.boardId ? { boardId: input.boardId } : {}),
          board: {
            OR: [
              { ownerId: ctx.userId },
              { members: { some: { userId: ctx.userId } } },
            ],
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          board: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });

      const total = await prisma.activityLog.count({
        where: {
          ...(input.boardId ? { boardId: input.boardId } : {}),
          board: {
            OR: [
              { ownerId: ctx.userId },
              { members: { some: { userId: ctx.userId } } },
            ],
          },
        },
      });

      return {
        activities,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // Get user performance summary
  getUserPerformance: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        boardId: z.string().optional(),
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.userId;
      const startDate = startOfDay(subDays(new Date(), input.days));

      const [assignedTasks, completedTasks, avgCompletionTime] = await Promise.all([
        // Tasks assigned
        prisma.task.count({
          where: {
            assigneeId: userId,
            ...(input.boardId ? { boardId: input.boardId } : {}),
            isArchived: false,
          },
        }),

        // Tasks completed
        prisma.task.count({
          where: {
            assigneeId: userId,
            ...(input.boardId ? { boardId: input.boardId } : {}),
            status: 'done',
            updatedAt: { gte: startDate },
          },
        }),

        // Average completion time
        prisma.task.findMany({
          where: {
            assigneeId: userId,
            ...(input.boardId ? { boardId: input.boardId } : {}),
            status: 'done',
            updatedAt: { gte: startDate },
          },
          select: {
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);

      let avgCompletionHours = 0;
      if (avgCompletionTime.length > 0) {
        const completionTimes = avgCompletionTime.map((task) => {
          const diff = task.updatedAt.getTime() - task.createdAt.getTime();
          return diff / (1000 * 60 * 60); // Convert to hours
        });

        avgCompletionHours =
          completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
      }

      return {
        assignedTasks,
        completedTasks,
        activeTasks: assignedTasks - completedTasks,
        avgCompletionHours,
        completionRate: assignedTasks > 0 ? (completedTasks / assignedTasks) * 100 : 0,
      };
    }),
});
