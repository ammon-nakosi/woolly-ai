'use client';

import { useState, useEffect, use } from 'react';
import { PlanStatus } from '@/lib/counsel-reader';
import { InteractiveKanban } from '@/components/InteractiveKanban';

interface PhaseKanbanProps {
  params: Promise<{ mode: string; name: string; number: string }>;
}

export default function PhaseKanban({ params }: PhaseKanbanProps) {
  const { mode, name, number } = use(params);
  const phaseNumber = parseInt(number);
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

  const handleUpdate = () => {
    fetchPlanStatus();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-600">Loading phase tasks...</div>
      </div>
    );
  }

  if (!planStatus || !planStatus.phases) {
    return (
      <div className="p-6">
        <div className="text-gray-600">No plan status available</div>
      </div>
    );
  }

  const phase = planStatus.phases.find(p => p.phaseNumber === phaseNumber);

  if (!phase) {
    return (
      <div className="p-6">
        <div className="text-gray-600">Phase {phaseNumber} not found</div>
      </div>
    );
  }

  const taskCount = phase.checklist?.length || 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Phase {phase.phaseNumber}: {phase.title}</h1>
        <p className="text-gray-600 mt-2">{phase.description}</p>
        <div className="flex items-center gap-4 mt-2">
          {phase.duration && (
            <span className="text-sm text-gray-500">
              Duration: {phase.duration}
            </span>
          )}
          <span className="text-sm text-gray-500">
            {taskCount} tasks
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Drag tasks between columns to change status • Click to edit descriptions and categories
        </p>
      </div>

      <InteractiveKanban
        planStatus={planStatus}
        mode={mode}
        name={name}
        phaseFilter={phaseNumber}
        onUpdate={handleUpdate}
      />
    </div>
  );
}