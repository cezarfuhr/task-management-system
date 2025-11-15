'use client';

import { use } from 'react';
import { trpc } from '@/lib/trpc';
import { KanbanBoard } from '@/components/KanbanBoard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useWebSocket } from '@/lib/websocket';
import { useEffect } from 'react';

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: board, isLoading, refetch } = trpc.boards.getById.useQuery({ id });
  const { lastMessage } = useWebSocket(id);

  // Refetch board when WebSocket message received
  useEffect(() => {
    if (lastMessage && lastMessage.payload?.boardId === id) {
      refetch();
    }
  }, [lastMessage, id, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading board...</p>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Board not found
          </h1>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Go back to boards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <div
              className="w-1 h-8 rounded-full"
              style={{ backgroundColor: board.color }}
            />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {board.title}
              </h1>
              {board.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {board.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="p-4">
        <KanbanBoard board={board} />
      </main>
    </div>
  );
}
