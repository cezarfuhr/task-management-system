import { router } from '../utils/trpc';
import { usersRouter } from './users';
import { boardsRouter } from './boards';
import { columnsRouter } from './columns';
import { tasksRouter } from './tasks';
import { labelsRouter } from './labels';
import { analyticsRouter } from './analytics';

export const appRouter = router({
  users: usersRouter,
  boards: boardsRouter,
  columns: columnsRouter,
  tasks: tasksRouter,
  labels: labelsRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
