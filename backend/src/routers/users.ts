import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../utils/trpc';
import prisma from '../utils/db';

export const usersRouter = router({
  // Get current user
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
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

    return user;
  }),

  // Get user by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          createdAt: true,
        },
      });

      return user;
    }),

  // Create or update user
  upsert: publicProcedure
    .input(
      z.object({
        id: z.string().optional(),
        email: z.string().email(),
        name: z.string(),
        avatar: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await prisma.user.upsert({
        where: { email: input.email },
        update: {
          name: input.name,
          avatar: input.avatar,
        },
        create: {
          id: input.id,
          email: input.email,
          name: input.name,
          avatar: input.avatar,
        },
      });

      return user;
    }),

  // Update user settings
  updateSettings: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        avatar: z.string().optional(),
        theme: z.enum(['light', 'dark', 'system']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.update({
        where: { id: ctx.userId },
        data: input,
      });

      return user;
    }),

  // Get user notifications
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const notifications = await prisma.notification.findMany({
        where: {
          userId: ctx.userId,
          ...(input.unreadOnly ? { isRead: false } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });

      const total = await prisma.notification.count({
        where: {
          userId: ctx.userId,
          ...(input.unreadOnly ? { isRead: false } : {}),
        },
      });

      return {
        notifications,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // Mark notification as read
  markNotificationRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await prisma.notification.update({
        where: {
          id: input.id,
          userId: ctx.userId,
        },
        data: { isRead: true },
      });

      return notification;
    }),

  // Mark all notifications as read
  markAllNotificationsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await prisma.notification.updateMany({
      where: {
        userId: ctx.userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true };
  }),
});
