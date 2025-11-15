import { z } from 'zod';
import { router, protectedProcedure } from '../utils/trpc';
import prisma from '../utils/db';
import { TRPCError } from '@trpc/server';

export const tasksRouter = router({
  // Get task by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const task = await prisma.task.findUnique({
        where: { id: input.id },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          labels: {
            include: {
              label: true,
            },
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          attachments: true,
        },
      });

      if (!task) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
      }

      return task;
    }),

  // Get tasks by board
  getByBoard: protectedProcedure
    .input(
      z.object({
        boardId: z.string(),
        includeArchived: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      const tasks = await prisma.task.findMany({
        where: {
          boardId: input.boardId,
          ...(input.includeArchived ? {} : { isArchived: false }),
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          labels: {
            include: {
              label: true,
            },
          },
          _count: {
            select: {
              comments: true,
              attachments: true,
            },
          },
        },
        orderBy: { position: 'asc' },
      });

      return tasks;
    }),

  // Get tasks by date range (for calendar view)
  getByDateRange: protectedProcedure
    .input(
      z.object({
        boardId: z.string().optional(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const tasks = await prisma.task.findMany({
        where: {
          ...(input.boardId ? { boardId: input.boardId } : {}),
          OR: [
            {
              dueDate: {
                gte: input.startDate,
                lte: input.endDate,
              },
            },
            {
              startDate: {
                gte: input.startDate,
                lte: input.endDate,
              },
            },
          ],
          board: {
            OR: [
              { ownerId: ctx.userId },
              { members: { some: { userId: ctx.userId } } },
            ],
          },
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
          labels: {
            include: {
              label: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      });

      return tasks;
    }),

  // Create task
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        boardId: z.string(),
        columnId: z.string(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
        dueDate: z.date().optional(),
        startDate: z.date().optional(),
        estimatedHours: z.number().optional(),
        assigneeId: z.string().optional(),
        labelIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { labelIds, ...taskData } = input;

      // Get the current max position in the column
      const maxPosition = await prisma.task.aggregate({
        where: { columnId: input.columnId },
        _max: { position: true },
      });

      const task = await prisma.task.create({
        data: {
          ...taskData,
          creatorId: ctx.userId,
          position: (maxPosition._max.position ?? -1) + 1,
          labels: labelIds
            ? {
                create: labelIds.map((labelId) => ({
                  labelId,
                })),
              }
            : undefined,
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          labels: {
            include: {
              label: true,
            },
          },
        },
      });

      // Create activity log
      await prisma.activityLog.create({
        data: {
          action: 'created',
          entity: 'task',
          entityId: task.id,
          userId: ctx.userId,
          boardId: input.boardId,
          taskId: task.id,
        },
      });

      // Create notification if assigned to someone
      if (input.assigneeId && input.assigneeId !== ctx.userId) {
        await prisma.notification.create({
          data: {
            type: 'task_assigned',
            title: 'Task Assigned',
            message: `You have been assigned to task "${task.title}"`,
            userId: input.assigneeId,
            metadata: { taskId: task.id, boardId: input.boardId },
          },
        });
      }

      return task;
    }),

  // Update task
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
        dueDate: z.date().nullable().optional(),
        startDate: z.date().nullable().optional(),
        estimatedHours: z.number().nullable().optional(),
        actualHours: z.number().nullable().optional(),
        assigneeId: z.string().nullable().optional(),
        labelIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, labelIds, ...data } = input;

      const existingTask = await prisma.task.findUnique({
        where: { id },
        select: { assigneeId: true, boardId: true },
      });

      if (!existingTask) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
      }

      const task = await prisma.task.update({
        where: { id },
        data: {
          ...data,
          ...(labelIds
            ? {
                labels: {
                  deleteMany: {},
                  create: labelIds.map((labelId) => ({
                    labelId,
                  })),
                },
              }
            : {}),
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          labels: {
            include: {
              label: true,
            },
          },
        },
      });

      // Create activity log
      await prisma.activityLog.create({
        data: {
          action: 'updated',
          entity: 'task',
          entityId: id,
          userId: ctx.userId,
          boardId: existingTask.boardId,
          taskId: id,
          metadata: { changes: data },
        },
      });

      // Create notification if assignee changed
      if (
        input.assigneeId !== undefined &&
        input.assigneeId !== existingTask.assigneeId &&
        input.assigneeId !== null &&
        input.assigneeId !== ctx.userId
      ) {
        await prisma.notification.create({
          data: {
            type: 'task_assigned',
            title: 'Task Assigned',
            message: `You have been assigned to task "${task.title}"`,
            userId: input.assigneeId,
            metadata: { taskId: id, boardId: existingTask.boardId },
          },
        });
      }

      return task;
    }),

  // Move task to different column
  move: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        columnId: z.string(),
        position: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await prisma.task.findUnique({
        where: { id: input.id },
        select: { columnId: true, position: true, boardId: true },
      });

      if (!task) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
      }

      // Update positions of other tasks
      if (task.columnId === input.columnId) {
        // Moving within same column
        if (input.position > task.position) {
          await prisma.task.updateMany({
            where: {
              columnId: input.columnId,
              position: {
                gt: task.position,
                lte: input.position,
              },
            },
            data: {
              position: {
                decrement: 1,
              },
            },
          });
        } else if (input.position < task.position) {
          await prisma.task.updateMany({
            where: {
              columnId: input.columnId,
              position: {
                gte: input.position,
                lt: task.position,
              },
            },
            data: {
              position: {
                increment: 1,
              },
            },
          });
        }
      } else {
        // Moving to different column
        // Decrement positions in old column
        await prisma.task.updateMany({
          where: {
            columnId: task.columnId,
            position: { gt: task.position },
          },
          data: {
            position: {
              decrement: 1,
            },
          },
        });

        // Increment positions in new column
        await prisma.task.updateMany({
          where: {
            columnId: input.columnId,
            position: { gte: input.position },
          },
          data: {
            position: {
              increment: 1,
            },
          },
        });
      }

      // Update the task
      const updatedTask = await prisma.task.update({
        where: { id: input.id },
        data: {
          columnId: input.columnId,
          position: input.position,
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          labels: {
            include: {
              label: true,
            },
          },
        },
      });

      // Create activity log
      await prisma.activityLog.create({
        data: {
          action: 'moved',
          entity: 'task',
          entityId: input.id,
          userId: ctx.userId,
          boardId: task.boardId,
          taskId: input.id,
          metadata: { from: task.columnId, to: input.columnId },
        },
      });

      return updatedTask;
    }),

  // Delete task
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await prisma.task.findUnique({
        where: { id: input.id },
        select: { boardId: true, position: true, columnId: true },
      });

      if (!task) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
      }

      await prisma.task.delete({
        where: { id: input.id },
      });

      // Update positions of remaining tasks
      await prisma.task.updateMany({
        where: {
          columnId: task.columnId,
          position: { gt: task.position },
        },
        data: {
          position: {
            decrement: 1,
          },
        },
      });

      // Create activity log
      await prisma.activityLog.create({
        data: {
          action: 'deleted',
          entity: 'task',
          entityId: input.id,
          userId: ctx.userId,
          boardId: task.boardId,
        },
      });

      return { success: true };
    }),

  // Add comment
  addComment: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await prisma.task.findUnique({
        where: { id: input.taskId },
        select: { title: true, assigneeId: true },
      });

      if (!task) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
      }

      const comment = await prisma.comment.create({
        data: {
          content: input.content,
          taskId: input.taskId,
          userId: ctx.userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      // Notify assignee about new comment
      if (task.assigneeId && task.assigneeId !== ctx.userId) {
        await prisma.notification.create({
          data: {
            type: 'comment_added',
            title: 'New Comment',
            message: `New comment on task "${task.title}"`,
            userId: task.assigneeId,
            metadata: { taskId: input.taskId, commentId: comment.id },
          },
        });
      }

      return comment;
    }),

  // Update comment
  updateComment: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await prisma.comment.update({
        where: {
          id: input.id,
          userId: ctx.userId,
        },
        data: { content: input.content },
      });

      return comment;
    }),

  // Delete comment
  deleteComment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.comment.delete({
        where: {
          id: input.id,
          userId: ctx.userId,
        },
      });

      return { success: true };
    }),
});
