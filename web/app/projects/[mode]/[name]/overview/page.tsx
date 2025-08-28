'use client';

import { useState, useEffect, use } from 'react';
import { CounselProject } from '@/lib/counsel-reader';

interface OverviewPageProps {
  params: Promise<{ mode: string; name: string }>;
}

export default function OverviewPage({ params }: OverviewPageProps) {
  const { mode, name } = use(params);
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-600">Loading overview...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-gray-600">Project not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Project Overview</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Project Name</h3>
            <p className="text-lg">{project.name}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Mode</h3>
            <p className="text-lg capitalize">{project.mode}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
            <p className="text-lg">{new Date(project.created).toLocaleString()}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Last Modified</h3>
            <p className="text-lg">{new Date(project.modified).toLocaleString()}</p>
          </div>
          
          {project.metadata?.description && (
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
              <p className="text-lg">{project.metadata.description}</p>
            </div>
          )}
          
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Files</h3>
            <p className="text-lg">{project.files.length} files</p>
          </div>
        </div>
        
        {/* Quick Stats for Feature Mode */}
        {project.mode === 'feature' && project.metadata?.planItems && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Plan Status</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">{project.metadata.planItems} tasks</span>
              </div>
              {project.metadata.status && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm capitalize">{project.metadata.status}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Files List Preview */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Project Files</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {project.files.slice(0, 12).map((file) => (
            <div key={file} className="text-sm text-gray-600 truncate" title={file}>
              📄 {file}
            </div>
          ))}
          {project.files.length > 12 && (
            <div className="text-sm text-gray-400">
              +{project.files.length - 12} more files
            </div>
          )}
        </div>
      </div>
    </div>
  );
}