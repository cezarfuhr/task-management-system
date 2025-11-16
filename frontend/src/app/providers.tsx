'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/lib/trpc';
import { Toaster } from 'react-hot-toast';
import { CommandPalette } from '@/components/CommandPalette';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-right" />
        <CommandPalette />
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
