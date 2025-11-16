import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';

export interface WebSocketMessage {
  type: 'task_updated' | 'task_created' | 'task_deleted' | 'task_moved' | 'board_updated' | 'user_joined' | 'user_left';
  payload: any;
  boardId?: string;
  taskId?: string;
  userId?: string;
  timestamp: number;
}

export interface ConnectedClient {
  id: string;
  userId?: string;
  boardIds: Set<string>;
}

export type Context = inferAsyncReturnType<typeof createContext>;

export async function createContext({ req, res }: CreateExpressContextOptions) {
  // In a real app, you would validate JWT token here
  const userId = req.headers['x-user-id'] as string | undefined;

  return {
    userId,
    req,
    res,
  };
}
