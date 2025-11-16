import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../backend/src/routers';
import superjson from 'superjson';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
      headers() {
        // In a real app, you would get the user ID from auth context
        return {
          'x-user-id': localStorage.getItem('userId') || 'demo-user',
        };
      },
    }),
  ],
});
