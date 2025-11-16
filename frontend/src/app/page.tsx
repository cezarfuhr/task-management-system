'use client';

import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import { Plus, Calendar, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { CreateBoardModal } from '@/components/CreateBoardModal';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function HomePage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: boards, isLoading } = trpc.boards.getAll.useQuery({ includeArchived: false });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Task Manager
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/calendar"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <Calendar className="w-4 h-4" />
                Calendar
              </Link>
              <Link
                href="/analytics"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Boards
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your projects and tasks
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
          >
            <Plus className="w-5 h-5" />
            New Board
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : boards && boards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/boards/${board.id}`}
                className="group block"
              >
                <div
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition p-6 border-t-4"
                  style={{ borderTopColor: board.color }}
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    {board.title}
                  </h3>
                  {board.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {board.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{board._count?.tasks || 0} tasks</span>
                    <span>{board._count?.columns || 0} columns</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No boards yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first board to get started
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Board
            </button>
          </div>
        )}
      </main>

      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
