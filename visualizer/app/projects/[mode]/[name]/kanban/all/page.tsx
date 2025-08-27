'use client';

import { useState, useEffect, use } from 'react';
import { PlanStatus } from '@/lib/counsel-reader';
import { InteractiveKanban } from '@/components/InteractiveKanban';

interface AllKanbanProps {
  params: Promise<{ mode: string; name: string }>;
}

export default function AllKanban({ params }: AllKanbanProps) {
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

  const handleUpdate = () => {
    fetchPlanStatus();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-600">Loading all tasks...</div>
      </div>
    );
  }

  if (!planStatus || !planStatus.phases) {
    return (
      <div className="p-6">
        <div className="text-gray-600">No tasks available</div>
      </div>
    );
  }

  // Calculate total tasks
  const totalTasks = planStatus.phases.reduce((sum, phase) => 
    sum + (phase.checklist?.length || 0), 0
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">All Tasks</h1>
        <p className="text-gray-600 mt-2">
          {totalTasks} total tasks across {planStatus.phases.length} phases
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Drag tasks between columns to change status • Click to edit descriptions and categories
        </p>
      </div>

      <InteractiveKanban
        planStatus={planStatus}
        mode={mode}
        name={name}
        onUpdate={handleUpdate}
      />
    </div>
  );
}