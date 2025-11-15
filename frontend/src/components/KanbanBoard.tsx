'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface Props {
  board: any;
}

export function KanbanBoard({ board }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [columns, setColumns] = useState(board.columns || []);

  const utils = trpc.useUtils();
  const moveTask = trpc.tasks.move.useMutation({
    onSuccess: () => {
      utils.boards.getById.invalidate({ id: board.id });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the columns containing the active and over items
    const activeColumn = columns.find((col: any) =>
      col.tasks.some((task: any) => task.id === activeId)
    );
    const overColumn = columns.find(
      (col: any) =>
        col.id === overId || col.tasks.some((task: any) => task.id === overId)
    );

    if (!activeColumn || !overColumn) return;

    if (activeColumn.id !== overColumn.id) {
      setColumns((prevColumns: any[]) => {
        const activeItems = activeColumn.tasks;
        const overItems = overColumn.tasks;

        const activeIndex = activeItems.findIndex((t: any) => t.id === activeId);
        const overIndex = overItems.findIndex((t: any) => t.id === overId);

        const newActiveItems = activeItems.filter((t: any) => t.id !== activeId);
        const newOverItems = [
          ...overItems.slice(0, overIndex >= 0 ? overIndex : overItems.length),
          activeItems[activeIndex],
          ...overItems.slice(overIndex >= 0 ? overIndex : overItems.length),
        ];

        return prevColumns.map((col) => {
          if (col.id === activeColumn.id) {
            return { ...col, tasks: newActiveItems };
          }
          if (col.id === overColumn.id) {
            return { ...col, tasks: newOverItems };
          }
          return col;
        });
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const overColumn = columns.find(
      (col: any) =>
        col.id === overId || col.tasks.some((task: any) => task.id === overId)
    );

    if (!overColumn) return;

    const columnTasks = overColumn.tasks;
    const overIndex = columnTasks.findIndex((t: any) => t.id === overId);
    const newPosition = overIndex >= 0 ? overIndex : columnTasks.length;

    // Make API call to move task
    moveTask.mutate({
      id: activeId,
      columnId: overColumn.id,
      position: newPosition,
    });
  };

  const activeTask = activeId
    ? columns
        .flatMap((col: any) => col.tasks)
        .find((task: any) => task.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column: any) => (
          <KanbanColumn key={column.id} column={column} boardId={board.id} />
        ))}

        <button className="flex-shrink-0 w-80 h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
          <Plus className="w-5 h-5" />
          Add Column
        </button>
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
