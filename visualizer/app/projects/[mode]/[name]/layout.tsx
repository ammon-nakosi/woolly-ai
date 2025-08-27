'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { CounselProject, PlanStatus } from '@/lib/counsel-reader';

interface ProjectLayoutProps {
  children: React.ReactNode;
}

export default function ProjectLayout({ children }: ProjectLayoutProps) {
  const pathname = usePathname();
  const params = useParams();
  const mode = params.mode as string;
  const name = params.name as string;
  
  const [project, setProject] = useState<CounselProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [mode, name]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${mode}/${name}`);
      const data = await res.json();
      setProject(data);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNavItems = () => {
    switch (mode) {
      case 'feature':
        return [
          { href: `/projects/${mode}/${name}/overview`, label: 'Overview', icon: '📋' },
          { href: `/projects/${mode}/${name}/kanban`, label: 'Kanban', icon: '📊' },
          { href: `/projects/${mode}/${name}/files`, label: 'Files', icon: '📁' }
        ];
      case 'script':
        return [
          { href: `/projects/${mode}/${name}/overview`, label: 'Overview', icon: '📋' },
          { href: `/projects/${mode}/${name}/output`, label: 'Output', icon: '📤' },
          { href: `/projects/${mode}/${name}/code`, label: 'Code', icon: '💻' },
          { href: `/projects/${mode}/${name}/files`, label: 'Files', icon: '📁' }
        ];
      case 'debug':
        return [
          { href: `/projects/${mode}/${name}/issue`, label: 'Issue', icon: '🐛' },
          { href: `/projects/${mode}/${name}/timeline`, label: 'Timeline', icon: '📅' },
          { href: `/projects/${mode}/${name}/solution`, label: 'Solution', icon: '✅' },
          { href: `/projects/${mode}/${name}/files`, label: 'Files', icon: '📁' }
        ];
      case 'review':
        return [
          { href: `/projects/${mode}/${name}/scope`, label: 'Scope', icon: '🔍' },
          { href: `/projects/${mode}/${name}/findings`, label: 'Findings', icon: '📝' },
          { href: `/projects/${mode}/${name}/checklist`, label: 'Checklist', icon: '☑️' },
          { href: `/projects/${mode}/${name}/files`, label: 'Files', icon: '📁' }
        ];
      case 'vibe':
        return [
          { href: `/projects/${mode}/${name}/context`, label: 'Context', icon: '💭' },
          { href: `/projects/${mode}/${name}/activity`, label: 'Activity', icon: '⚡' },
          { href: `/projects/${mode}/${name}/notes`, label: 'Notes', icon: '📝' },
          { href: `/projects/${mode}/${name}/files`, label: 'Files', icon: '📁' }
        ];
      default:
        return [
          { href: `/projects/${mode}/${name}/overview`, label: 'Overview', icon: '📋' },
          { href: `/projects/${mode}/${name}/files`, label: 'Files', icon: '📁' }
        ];
    }
  };

  const isActiveRoute = (href: string) => {
    // Special handling for kanban sub-routes
    if (href.includes('/kanban') && pathname.includes('/kanban')) {
      return true;
    }
    return pathname.startsWith(href);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Project not found</div>
      </div>
    );
  }

  const modeColors: Record<string, string> = {
    feature: 'bg-blue-100 text-blue-800',
    script: 'bg-green-100 text-green-800',
    debug: 'bg-red-100 text-red-800',
    review: 'bg-purple-100 text-purple-800',
    vibe: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Left Sidebar - Navigation */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
            ← All Projects
          </Link>
          <h2 className="font-semibold text-lg mt-2">{name}</h2>
          <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${modeColors[mode]}`}>
            {mode}
          </span>
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {getNavItems().map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActiveRoute(item.href)
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Project Info */}
        <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
          <div className="mb-2">
            Created: {new Date(project.created).toLocaleDateString()}
          </div>
          <div>
            Modified: {new Date(project.modified).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}