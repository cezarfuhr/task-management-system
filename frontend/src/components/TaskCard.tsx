'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MessageSquare, Paperclip, User } from 'lucide-react';
import { cn, formatDate, getPriorityColor } from '@/lib/utils';

interface Props {
  task: any;
  isDragging?: boolean;
}

export function TaskCard({ task, isDragging = false }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition cursor-grab active:cursor-grabbing',
        isDragging && 'shadow-lg rotate-3'
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-gray-900 dark:text-white flex-1">
            {task.title}
          </h4>
          <span
            className={cn(
              'text-xs px-2 py-1 rounded-full',
              getPriorityColor(task.priority)
            )}
          >
            {task.priority}
          </span>
        </div>

        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {task.description}
          </p>
        )}

        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.labels.map((item: any) => (
              <span
                key={item.label.id}
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  backgroundColor: item.label.color + '20',
                  color: item.label.color,
                }}
              >
                {item.label.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">{formatDate(task.dueDate)}</span>
              </div>
            )}
            {task._count?.comments > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs">{task._count.comments}</span>
              </div>
            )}
            {task._count?.attachments > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="w-4 h-4" />
                <span className="text-xs">{task._count.attachments}</span>
              </div>
            )}
          </div>

          {task.assignee && (
            <div className="flex items-center gap-1">
              {task.assignee.avatar ? (
                <img
                  src={task.assignee.avatar}
                  alt={task.assignee.name}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                  {task.assignee.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
