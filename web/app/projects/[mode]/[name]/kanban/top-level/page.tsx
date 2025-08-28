'use client';

import { useState, useEffect, use } from 'react';
import { PlanStatus } from '@/lib/counsel-reader';
import { InteractiveKanban } from '@/components/InteractiveKanban';

interface TopLevelKanbanProps {
  params: Promise<{ mode: string; name: string }>;
}

export default function TopLevelKanban({ params }: TopLevelKanbanProps) {
  const { mode, name } = use(params);
  const [planStatus, setPlanStatus] = useState<PlanStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlanStatus();
  }, [mode, name]);

  const fetchPlanStatus = async () => {
    try {
      const res = await fetch(`/api/projects/${mode}/${name}`);
      const data = await res.json();
      setPlanStatus(data.planStatus);
    } catch (error) {
      console.error('Failed to fetch plan status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-600">Loading phase overview...</div>
      </div>
    );
  }

  if (!planStatus || !planStatus.phases) {
    return (
      <div className="p-6">
        <div className="text-gray-600">No phases available</div>
      </div>
    );
  }

  // Convert phases to tasks format for InteractiveKanban
  const phaseAsTasks = planStatus.phases.map(phase => ({
    id: `phase-${phase.phaseNumber}`,
    category: `Phase ${phase.phaseNumber}`,
    description: `${phase.title}\n${phase.description}${phase.duration ? `\nDuration: ${phase.duration}` : ''}`,
    status: phase.status,
    priority: 'high' as const,
    phase: phase.title,
    phaseNumber: phase.phaseNumber
  }));

  // Create a modified planStatus with phases as tasks
  const modifiedPlanStatus = {
    ...planStatus,
    phases: [{
      phaseNumber: 0,
      title: 'All Phases',
      status: 'pending',
      description: 'Phase overview',
      checklist: phaseAsTasks
    }]
  };

  // Custom save function for phase updates
  const handleSavePhaseChanges = async (updatedTasks: any[]) => {
    try {
      // Map task updates back to phase updates in the original planStatus structure
      const originalPlanStatus = { ...planStatus };
      
      updatedTasks.forEach(task => {
        if (task.id.startsWith('phase-')) {
          const phaseNumber = parseInt(task.id.replace('phase-', ''));
          const phaseIndex = originalPlanStatus.phases.findIndex(p => p.phaseNumber === phaseNumber);
          if (phaseIndex !== -1) {
            originalPlanStatus.phases[phaseIndex] = {
              ...originalPlanStatus.phases[phaseIndex],
              status: task.status
            };
          }
        }
      });

      const response = await fetch(`/api/projects/${mode}/${name}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planStatus: originalPlanStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      // Update local state
      setPlanStatus(originalPlanStatus);
    } catch (error) {
      console.error('Failed to save phase changes:', error);
      // Revert on error
      await fetchPlanStatus();
    }
  };

  // Custom update handler that re-fetches data
  const handlePhaseUpdate = async () => {
    await fetchPlanStatus();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Phase Overview</h1>
        {(typeof planStatus.project === 'string' ? planStatus.project : planStatus.project?.name) && (
          <p className="text-gray-600 mt-2">
            {typeof planStatus.project === 'string' ? planStatus.project : planStatus.project?.name}
          </p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          Drag phases between columns to change their status
        </p>
      </div>

      <InteractiveKanban
        planStatus={modifiedPlanStatus}
        mode={mode}
        name={name}
        phaseFilter={0}
        onUpdate={handlePhaseUpdate}
        customSaveHandler={handleSavePhaseChanges}
      />
    </div>
  );
}