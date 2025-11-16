'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, FileText, Layout, Calendar, TrendingUp } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  const { data: searchResults, refetch } = trpc.search.query.useQuery(
    { query: search, limit: 10 },
    { enabled: false }
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (search.length > 2) {
      refetch();
    }
  }, [search, refetch]);

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="ml-auto px-2 py-1 text-xs bg-white dark:bg-gray-900 rounded border">
          ⌘K
        </kbd>
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Global Command Menu"
        className="fixed inset-0 z-50"
      >
        <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl">
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Search tasks, boards..."
            className="w-full px-4 py-4 text-lg border-b border-gray-200 dark:border-gray-700 focus:outline-none dark:bg-gray-800 dark:text-white"
          />

          <Command.List className="max-h-96 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-500">
              No results found.
            </Command.Empty>

            {searchResults?.tasks && searchResults.tasks.length > 0 && (
              <Command.Group heading="Tasks" className="mb-2">
                {searchResults.tasks.map((task: any) => (
                  <Command.Item
                    key={task.id}
                    onSelect={() => {
                      router.push(`/boards/${task.boardId}?task=${task.id}`);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {task.board.title}
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {searchResults?.boards && searchResults.boards.length > 0 && (
              <Command.Group heading="Boards">
                {searchResults.boards.map((board: any) => (
                  <Command.Item
                    key={board.id}
                    onSelect={() => {
                      router.push(`/boards/${board.id}`);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <Layout className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {board.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {board._count.tasks} tasks
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

            <Command.Group heading="Quick Actions">
              <Command.Item
                onSelect={() => {
                  router.push('/calendar');
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Go to Calendar</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  router.push('/analytics');
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span>Go to Analytics</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </div>
      </Command.Dialog>
    </>
  );
}
