import { z } from 'zod';
import { router, protectedProcedure } from '../utils/trpc';
import prisma from '../utils/db';
import { TRPCError } from '@trpc/server';

export const boardsRouter = router({
  // Get all boards for current user
  getAll: protectedProcedure
    .input(
      z.object({
        includeArchived: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const boards = await prisma.board.findMany({
        where: {
          OR: [
            { ownerId: ctx.userId },
            { members: { some: { userId: ctx.userId } } },
          ],
          ...(input.includeArchived ? {} : { isArchived: false }),
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              tasks: true,
              columns: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return boards;
    }),

  // Get board by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const board = await prisma.board.findFirst({
        where: {
          id: input.id,
          OR: [
            { ownerId: ctx.userId },
            { members: { some: { userId: ctx.userId } } },
          ],
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          columns: {
            orderBy: { position: 'asc' },
            include: {
              tasks: {
                where: { isArchived: false },
                orderBy: { position: 'asc' },
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
              },
            },
          },
          labels: true,
        },
      });

      if (!board) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Board not found' });
      }

      return board;
    }),

  // Create board
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        description: z.string().optional(),
        color: z.string().default('#3B82F6'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const board = await prisma.board.create({
        data: {
          ...input,
          ownerId: ctx.userId,
          columns: {
            create: [
              { title: 'To Do', position: 0 },
              { title: 'In Progress', position: 1 },
              { title: 'Done', position: 2 },
            ],
          },
        },
        include: {
          columns: true,
        },
      });

      // Create activity log
      await prisma.activityLog.create({
        data: {
          action: 'created',
          entity: 'board',
          entityId: board.id,
          userId: ctx.userId,
          boardId: board.id,
        },
      });

      return board;
    }),

  // Update board
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Check if user has access
      const board = await prisma.board.findFirst({
        where: {
          id,
          OR: [
            { ownerId: ctx.userId },
            { members: { some: { userId: ctx.userId, role: { in: ['owner', 'admin'] } } } },
          ],
        },
      });

      if (!board) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No permission to update this board' });
      }

      const updatedBoard = await prisma.board.update({
        where: { id },
        data,
      });

      // Create activity log
      await prisma.activityLog.create({
        data: {
          action: 'updated',
          entity: 'board',
          entityId: id,
          userId: ctx.userId,
          boardId: id,
          metadata: { changes: data },
        },
      });

      return updatedBoard;
    }),

  // Delete board
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is owner
      const board = await prisma.board.findFirst({
        where: {
          id: input.id,
          ownerId: ctx.userId,
        },
      });

      if (!board) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only owner can delete the board' });
      }

      await prisma.board.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Archive/Unarchive board
  archive: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isArchived: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const board = await prisma.board.findFirst({
        where: {
          id: input.id,
          ownerId: ctx.userId,
        },
      });

      if (!board) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No permission to archive this board' });
      }

      const updatedBoard = await prisma.board.update({
        where: { id: input.id },
        data: { isArchived: input.isArchived },
      });

      return updatedBoard;
    }),

  // Add member to board
  addMember: protectedProcedure
    .input(
      z.object({
        boardId: z.string(),
        userId: z.string(),
        role: z.enum(['owner', 'admin', 'member', 'viewer']).default('member'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has admin access
      const board = await prisma.board.findFirst({
        where: {
          id: input.boardId,
          OR: [
            { ownerId: ctx.userId },
            { members: { some: { userId: ctx.userId, role: { in: ['owner', 'admin'] } } } },
          ],
        },
      });

      if (!board) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No permission to add members' });
      }

      const member = await prisma.boardMember.create({
        data: {
          boardId: input.boardId,
          userId: input.userId,
          role: input.role,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          type: 'board_member_added',
          title: 'Added to Board',
          message: `You have been added to board "${board.title}"`,
          userId: input.userId,
          metadata: { boardId: input.boardId },
        },
      });

      return member;
    }),

  // Remove member from board
  removeMember: protectedProcedure
    .input(
      z.object({
        boardId: z.string(),
        memberId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has admin access
      const board = await prisma.board.findFirst({
        where: {
          id: input.boardId,
          OR: [
            { ownerId: ctx.userId },
            { members: { some: { userId: ctx.userId, role: { in: ['owner', 'admin'] } } } },
          ],
        },
      });

      if (!board) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No permission to remove members' });
      }

      await prisma.boardMember.delete({
        where: { id: input.memberId },
      });

      return { success: true };
    }),
});
