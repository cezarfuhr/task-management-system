import { z } from 'zod';
import { router, protectedProcedure } from '../utils/trpc';
import prisma from '../utils/db';

export const labelsRouter = router({
  // Get labels by board
  getByBoard: protectedProcedure
    .input(z.object({ boardId: z.string() }))
    .query(async ({ input }) => {
      const labels = await prisma.label.findMany({
        where: { boardId: input.boardId },
        include: {
          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });

      return labels;
    }),

  // Create label
  create: protectedProcedure
    .input(
      z.object({
        boardId: z.string(),
        name: z.string().min(1).max(30),
        color: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const label = await prisma.label.create({
        data: input,
      });

      return label;
    }),

  // Update label
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(30).optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      const label = await prisma.label.update({
        where: { id },
        data,
      });

      return label;
    }),

  // Delete label
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.label.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
