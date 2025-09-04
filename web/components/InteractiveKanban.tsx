'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  KeyboardSensor,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PlanStatus } from '@/lib/woolly-reader';
import { KanbanColumn } from './KanbanColumn';
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

interface InteractiveKanbanProps {
  planStatus: PlanStatus;
  mode: string;
  name: string;
  phaseFilter?: number; // If provided, only show tasks from this phase
  onUpdate?: () => void;
  customSaveHandler?: (updatedTasks: TaskItem[]) => Promise<void>; // Custom save function for special cases
}

const COLUMN_STATUSES = {
  'to-do': ['to-do', 'pending'],
  'in-progress': ['in-progress', 'in-Progress'],
  'completed': ['completed', 'partially-completed'],
  'blocked': ['blocked']
};

const COLUMN_LABELS = {
  'to-do': 'To Do',
  'in-progress': 'In Progress', 
  'completed': 'Completed',
  'blocked': 'Blocked'
};

export function InteractiveKanban({ 
  planStatus, 
  mode, 
  name, 
  phaseFilter,
  onUpdate,
  customSaveHandler
}: InteractiveKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Get all tasks, optionally filtered by phase
  const getAllTasks = (): TaskItem[] => {
    if (!planStatus.phases) return [];
    
    return planStatus.phases
      .filter(phase => !phaseFilter || phase.phaseNumber === phaseFilter)
      .flatMap(phase => 
        (phase.checklist || []).map(item => ({
          ...item,
          phase: phase.title,
          phaseNumber: phase.phaseNumber
        }))
      );
  };

  const [tasks, setTasks] = useState<TaskItem[]>([]);

  // Initialize tasks when planStatus changes
  useEffect(() => {
    setTasks(getAllTasks());
  }, [planStatus, phaseFilter]);

  // Group tasks by column
  const getTasksByColumn = () => {
    const columns: Record<string, TaskItem[]> = {};
    
    Object.keys(COLUMN_STATUSES).forEach(columnId => {
      const statuses = COLUMN_STATUSES[columnId as keyof typeof COLUMN_STATUSES];
      columns[columnId] = tasks.filter(task => statuses.includes(task.status));
    });
    
    return columns;
  };

  const tasksByColumn = getTasksByColumn();

  const handleDragStart = (event: DragStartEvent) => {
    console.log('Drag started:', event.active.id);
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    console.log('Dragging over:', over.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('Drag ended:', { activeId: active.id, overId: over?.id });
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const taskId = active.id as string;
    // Check if we're dropping on a column or a task
    let newColumnId = over.id as string;
    
    // If the over.id is a task ID, find which column it belongs to
    const overTask = tasks.find(t => t.id === over.id);
    if (overTask) {
      // Find the column this task belongs to
      for (const [columnId, columnTasks] of Object.entries(tasksByColumn)) {
        if (columnTasks.some(t => t.id === over.id)) {
          newColumnId = columnId;
          break;
        }
      }
    }
    
    console.log('Moving task to column:', newColumnId);
    
    // Find the task and update its status
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const newStatuses = COLUMN_STATUSES[newColumnId as keyof typeof COLUMN_STATUSES];
        const newStatus = newStatuses[0]; // Use the primary status for the column
        return { ...task, status: newStatus };
      }
      return task;
    });

    setTasks(updatedTasks);
    setActiveId(null);

    // Save changes to the server
    await saveChanges(updatedTasks);
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<TaskItem>) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    );
    
    setTasks(updatedTasks);
    await saveChanges(updatedTasks);
  };

  const saveChanges = async (updatedTasks: TaskItem[]) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      if (customSaveHandler) {
        // Use custom save handler if provided
        await customSaveHandler(updatedTasks);
      } else {
        // Default save behavior for regular tasks
        // Reconstruct the plan status with updated tasks
        const updatedPlanStatus = { ...planStatus };
        
        if (updatedPlanStatus.phases) {
          updatedPlanStatus.phases = updatedPlanStatus.phases.map(phase => {
            const phaseTasks = updatedTasks.filter(task => task.phaseNumber === phase.phaseNumber);
            
            return {
              ...phase,
              checklist: phaseTasks.map(task => ({
                id: task.id,
                category: task.category,
                description: task.description,
                status: task.status as any,
                priority: task.priority
              }))
            };
          });
        }

        const response = await fetch(`/api/projects/${mode}/${name}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planStatus: updatedPlanStatus
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save changes');
        }
      }

      onUpdate?.();
    } catch (error) {
      console.error('Failed to save changes:', error);
      // Revert changes on error
      setTasks(getAllTasks());
    } finally {
      setIsUpdating(false);
    }
  };

  const activeTask = activeId ? tasks.find(task => task.id === activeId) : null;

  return (
    <div className="relative">
      {isUpdating && (
        <div className="absolute top-0 right-0 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm z-10">
          Saving...
        </div>
      )}
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(COLUMN_LABELS).map(([columnId, label]) => (
            <KanbanColumn
              key={columnId}
              id={columnId}
              title={label}
              tasks={tasksByColumn[columnId] || []}
              onTaskUpdate={handleTaskUpdate}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-2 scale-105 opacity-90">
              <KanbanCard
                task={activeTask}
                onUpdate={() => {}}
                isDragging={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}