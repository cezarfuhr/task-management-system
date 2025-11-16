import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../utils/trpc';
import { AuthService } from '../services/auth.service';

export const authRouter = router({
  // Register
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(2),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ input }) => {
      return AuthService.register(input);
    }),

  // Login
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return AuthService.login(input);
    }),

  // Refresh token
  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input }) => {
      return AuthService.refreshAccessToken(input.refreshToken);
    }),

  // Logout
  logout: protectedProcedure
    .input(z.object({ refreshToken: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await AuthService.logout(ctx.userId, input.refreshToken);
      return { success: true };
    }),

  // Change password
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await AuthService.changePassword(
        ctx.userId,
        input.currentPassword,
        input.newPassword
      );
      return { success: true };
    }),
});
