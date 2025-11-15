import { z } from 'zod';
import { router, protectedProcedure } from '../utils/trpc';
import prisma from '../utils/db';
import { TRPCError } from '@trpc/server';

export const columnsRouter = router({
  // Get columns by board
  getByBoard: protectedProcedure
    .input(z.object({ boardId: z.string() }))
    .query(async ({ input }) => {
      const columns = await prisma.column.findMany({
        where: { boardId: input.boardId },
        orderBy: { position: 'asc' },
        include: {
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });

      return columns;
    }),

  // Create column
  create: protectedProcedure
    .input(
      z.object({
        boardId: z.string(),
        title: z.string().min(1).max(50),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get max position
      const maxPosition = await prisma.column.aggregate({
        where: { boardId: input.boardId },
        _max: { position: true },
      });

      const column = await prisma.column.create({
        data: {
          ...input,
          position: (maxPosition._max.position ?? -1) + 1,
        },
      });

      // Create activity log
      await prisma.activityLog.create({
        data: {
          action: 'created',
          entity: 'column',
          entityId: column.id,
          userId: ctx.userId,
          boardId: input.boardId,
        },
      });

      return column;
    }),

  // Update column
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(50).optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const column = await prisma.column.update({
        where: { id },
        data,
      });

      // Create activity log
      await prisma.activityLog.create({
        data: {
          action: 'updated',
          entity: 'column',
          entityId: id,
          userId: ctx.userId,
          boardId: column.boardId,
        },
      });

      return column;
    }),

  // Move column
  move: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        position: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const column = await prisma.column.findUnique({
        where: { id: input.id },
        select: { position: true, boardId: true },
      });

      if (!column) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Column not found' });
      }

      // Update positions of other columns
      if (input.position > column.position) {
        await prisma.column.updateMany({
          where: {
            boardId: column.boardId,
            position: {
              gt: column.position,
              lte: input.position,
            },
          },
          data: {
            position: {
              decrement: 1,
            },
          },
        });
      } else if (input.position < column.position) {
        await prisma.column.updateMany({
          where: {
            boardId: column.boardId,
            position: {
              gte: input.position,
              lt: column.position,
            },
          },
          data: {
            position: {
              increment: 1,
            },
          },
        });
      }

      // Update the column
      const updatedColumn = await prisma.column.update({
        where: { id: input.id },
        data: { position: input.position },
      });

      return updatedColumn;
    }),

  // Delete column
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const column = await prisma.column.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });

      if (!column) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Column not found' });
      }

      if (column._count.tasks > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete column with tasks. Please move or delete tasks first.',
        });
      }

      await prisma.column.delete({
        where: { id: input.id },
      });

      // Update positions of remaining columns
      await prisma.column.updateMany({
        where: {
          boardId: column.boardId,
          position: { gt: column.position },
        },
        data: {
          position: {
            decrement: 1,
          },
        },
      });

      return { success: true };
    }),
});
