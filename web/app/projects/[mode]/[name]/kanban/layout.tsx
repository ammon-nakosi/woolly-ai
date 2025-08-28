'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { PlanStatus } from '@/lib/counsel-reader';

interface KanbanLayoutProps {
  children: React.ReactNode;
}

export default function KanbanLayout({ children }: KanbanLayoutProps) {
  const pathname = usePathname();
  const params = useParams();
  const mode = params.mode as string;
  const name = params.name as string;
  
  const [planStatus, setPlanStatus] = useState<PlanStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mode === 'feature') {
      fetchPlanStatus();
    } else {
      setLoading(false);
    }
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

  // Only show kanban navigation for feature mode
  if (mode !== 'feature') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-600">Loading kanban...</div>
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

  const isActiveTab = (href: string) => {
    return pathname === href;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Kanban Sub-navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            <Link
              href={`/projects/${mode}/${name}/kanban/top-level`}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                isActiveTab(`/projects/${mode}/${name}/kanban/top-level`)
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Top Level
            </Link>
            
            {planStatus.phases.map((phase) => (
              <Link
                key={phase.phaseNumber}
                href={`/projects/${mode}/${name}/kanban/phase/${phase.phaseNumber}`}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  isActiveTab(`/projects/${mode}/${name}/kanban/phase/${phase.phaseNumber}`)
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Phase {phase.phaseNumber}
              </Link>
            ))}
            
            <Link
              href={`/projects/${mode}/${name}/kanban/all`}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                isActiveTab(`/projects/${mode}/${name}/kanban/all`)
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Tasks
            </Link>
          </nav>
        </div>
      </div>

      {/* Kanban Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}