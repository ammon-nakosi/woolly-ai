'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';

interface TaskItem {
  id: string;
  category: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  phase?: string;
  phaseNumber?: number;
}

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: TaskItem[];
  onTaskUpdate: (taskId: string, updates: Partial<TaskItem>) => void;
}

export function KanbanColumn({ id, title, tasks, onTaskUpdate }: KanbanColumnProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id,
    data: {
      type: 'column',
      columnId: id,
    }
  });

  // Check if a task is being dragged over this column
  const isTaskOverColumn = isOver || (active && tasks.some(task => task.id === active.id));

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-50 rounded-lg p-4 min-h-[200px] transition-all duration-200 ${
        isOver ? 'bg-blue-50 ring-2 ring-blue-400 scale-[1.02]' : ''
      } ${isTaskOverColumn && !isOver ? 'bg-gray-100' : ''}`}
    >
      <h3 className="font-medium text-sm text-gray-700 mb-3 uppercase tracking-wider">
        {title} 
        <span className="ml-2 text-xs font-normal text-gray-500">
          ({tasks.length})
        </span>
      </h3>
      
      <SortableContext 
        items={tasks.map(t => t.id)} 
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onUpdate={(updates) => onTaskUpdate(task.id, updates)}
            />
          ))}
          {tasks.length === 0 && (
            <div className={`text-sm text-gray-400 italic text-center py-12 px-4 border-2 border-dashed rounded-lg transition-colors ${
              isOver ? 'border-blue-300 bg-blue-50 text-blue-600' : 'border-gray-200'
            }`}>
              {isOver ? 'Drop here' : 'No tasks'}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}