'use client';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { TaskCard } from './TaskCard';
import { Plus, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { CreateTaskModal } from './CreateTaskModal';

interface Props {
  column: any;
  boardId: string;
}

export function KanbanColumn({ column, boardId }: Props) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const taskIds = column.tasks?.map((task: any) => task.id) || [];

  return (
    <>
      <div className="flex-shrink-0 w-80">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {column.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {column.tasks?.length || 0} tasks
              </p>
            </div>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          <div ref={setNodeRef} className="space-y-2 min-h-[100px]">
            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
              {column.tasks?.map((task: any) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </SortableContext>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        boardId={boardId}
        columnId={column.id}
      />
    </>
  );
}
