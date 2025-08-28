'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskItem {
  id: string;
  category: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  phase?: string;
  phaseNumber?: number;
}

interface KanbanCardProps {
  task: TaskItem;
  onUpdate: (updates: Partial<TaskItem>) => void;
  isDragging?: boolean;
}

const priorityColors: Record<string, string> = {
  high: 'border-red-300',
  medium: 'border-yellow-300',
  low: 'border-gray-300'
};

const priorityBadgeColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-700'
};

export function KanbanCard({ task, onUpdate, isDragging = false }: KanbanCardProps) {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [tempDescription, setTempDescription] = useState(task.description);
  const [tempCategory, setTempCategory] = useState(task.category);
  
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    disabled: isEditingDescription || isEditingCategory,
    data: {
      type: 'task',
      task: task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0 : 1,
    visibility: isDragging || isSortableDragging ? 'hidden' : 'visible',
  };

  useEffect(() => {
    if (isEditingDescription && descriptionRef.current) {
      descriptionRef.current.focus();
      descriptionRef.current.select();
    }
  }, [isEditingDescription]);

  useEffect(() => {
    if (isEditingCategory && categoryRef.current) {
      categoryRef.current.focus();
      categoryRef.current.select();
    }
  }, [isEditingCategory]);

  const handleDescriptionSave = () => {
    if (tempDescription.trim() !== task.description) {
      onUpdate({ description: tempDescription.trim() });
    }
    setIsEditingDescription(false);
  };

  const handleCategorySave = () => {
    if (tempCategory.trim() !== task.category) {
      onUpdate({ category: tempCategory.trim() });
    }
    setIsEditingCategory(false);
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleDescriptionSave();
    } else if (e.key === 'Escape') {
      setTempDescription(task.description);
      setIsEditingDescription(false);
    }
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCategorySave();
    } else if (e.key === 'Escape') {
      setTempCategory(task.category);
      setIsEditingCategory(false);
    }
  };

  const handlePriorityChange = (newPriority: 'low' | 'medium' | 'high') => {
    onUpdate({ priority: newPriority });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white p-3 rounded-lg shadow-sm border-l-4 transition-all ${
        priorityColors[task.priority]
      } ${
        !isEditingDescription && !isEditingCategory ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : 'cursor-auto'
      }`}
      {...attributes}
      {...listeners}
    >
      {/* Category */}
      <div className="flex items-center justify-between mb-1">
        {isEditingCategory ? (
          <input
            ref={categoryRef}
            type="text"
            value={tempCategory}
            onChange={(e) => setTempCategory(e.target.value)}
            onBlur={handleCategorySave}
            onKeyDown={handleCategoryKeyDown}
            className="text-xs font-semibold text-gray-500 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 flex-1 mr-2"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p 
            className="text-xs font-semibold text-gray-500 cursor-text hover:bg-gray-100 px-1 py-0.5 rounded flex-1"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingCategory(true);
            }}
          >
            {task.category}
          </p>
        )}
        
        {task.phaseNumber && (
          <span className="text-xs text-gray-400">Phase {task.phaseNumber}</span>
        )}
      </div>

      {/* Description */}
      {isEditingDescription ? (
        <textarea
          ref={descriptionRef}
          value={tempDescription}
          onChange={(e) => setTempDescription(e.target.value)}
          onBlur={handleDescriptionSave}
          onKeyDown={handleDescriptionKeyDown}
          className="text-sm w-full bg-transparent border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 resize-none"
          rows={2}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <p 
          className="text-sm cursor-text hover:bg-gray-100 px-1 py-0.5 rounded min-h-[2rem]"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditingDescription(true);
          }}
        >
          {task.description}
        </p>
      )}

      {/* Priority and Actions */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-1">
          {(['low', 'medium', 'high'] as const).map((priority) => (
            <button
              key={priority}
              onClick={(e) => {
                e.stopPropagation();
                handlePriorityChange(priority);
              }}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${
                task.priority === priority
                  ? priorityBadgeColors[priority]
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {priority}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}