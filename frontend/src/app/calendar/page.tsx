'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, getPriorityColor } from '@/lib/utils';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: tasks } = trpc.tasks.getByDateRange.useQuery({
    startDate: monthStart,
    endDate: monthEnd,
  });

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTasksForDay = (day: Date) => {
    if (!tasks) return [];
    return tasks.filter((task: any) => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      return dueDate && format(dueDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Calendar
            </h1>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                {day}
              </div>
            ))}

            {days.map((day) => {
              const dayTasks = getTasksForDay(day);
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    'min-h-[120px] bg-white dark:bg-gray-900 p-2',
                    !isSameMonth(day, currentDate) && 'opacity-50',
                    isToday(day) && 'ring-2 ring-blue-500'
                  )}
                >
                  <div
                    className={cn(
                      'text-sm font-medium mb-1',
                      isToday(day)
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white'
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task: any) => (
                      <div
                        key={task.id}
                        className={cn(
                          'text-xs p-1 rounded truncate',
                          getPriorityColor(task.priority)
                        )}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
