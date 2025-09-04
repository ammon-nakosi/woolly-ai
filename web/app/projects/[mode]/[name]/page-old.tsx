'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CounselProject, PlanStatus } from '@/lib/woolly-reader';
import dynamic from 'next/dynamic';
import MarkdownViewer from '@/components/MarkdownViewerSimple';

const MarkdownEditor = dynamic(() => import('@/components/MarkdownEditor'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-50 animate-pulse rounded-lg" />
});

interface ProjectPageProps {
  params: Promise<{ mode: string; name: string }>;
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { mode, name } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<CounselProject | null>(null);
  const [planStatus, setPlanStatus] = useState<PlanStatus | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [mode, name]);

  useEffect(() => {
    if (selectedFile) {
      fetchFileContent(selectedFile);
      setIsEditing(false); // Reset editing state when switching files
    }
  }, [selectedFile]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${mode}/${name}`);
      const data = await res.json();
      setProject(data);
      if (data.planStatus) {
        setPlanStatus(data.planStatus);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async (fileName: string) => {
    try {
      const res = await fetch(`/api/projects/${mode}/${name}?file=${fileName}`);
      const data = await res.json();
      setFileContent(data.content || '');
    } catch (error) {
      console.error('Failed to fetch file content:', error);
    }
  };

  const saveFileContent = async (content: string) => {
    if (!selectedFile) return;
    
    try {
      const res = await fetch(`/api/projects/${mode}/${name}/file?file=${selectedFile}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to save file');
      }
      
      setFileContent(content);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
    }
  };

  const getTabs = () => {
    switch (mode) {
      case 'feature':
        return ['overview', 'kanban', 'list'];
      case 'script':
        return ['overview', 'output', 'code'];
      case 'debug':
        return ['issue', 'timeline', 'solution'];
      case 'review':
        return ['scope', 'findings', 'checklist'];
      case 'vibe':
        return ['context', 'activity', 'notes'];
      default:
        return ['overview'];
    }
  };

  const renderTabContent = () => {
    if (!project) return null;

    switch (mode) {
      case 'feature':
        switch (activeTab) {
          case 'overview':
            return <OverviewTab project={project} />;
          case 'kanban':
            return <KanbanTab planStatus={planStatus} />;
          case 'list':
            return <ListView planStatus={planStatus} />;
          default:
            return null;
        }
      default:
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 capitalize">{activeTab}</h2>
            <p className="text-gray-600">Content for {mode} mode - {activeTab} tab</p>
          </div>
        );
    }
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* File Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
            ← All Projects
          </Link>
          <h2 className="font-semibold text-lg mt-2">{name}</h2>
          <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
            mode === 'feature' ? 'bg-blue-100 text-blue-800' :
            mode === 'script' ? 'bg-green-100 text-green-800' :
            mode === 'debug' ? 'bg-red-100 text-red-800' :
            mode === 'review' ? 'bg-purple-100 text-purple-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {mode}
          </span>
        </div>
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Files</h3>
          <ul className="space-y-1">
            {project.files.map((file) => (
              <li key={file}>
                <button
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${
                    selectedFile === file ? 'bg-gray-100 font-medium' : ''
                  }`}
                >
                  {file}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6">
            <nav className="flex space-x-8">
              {getTabs().map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content or File Content */}
        <div className="flex-1 overflow-auto">
          {selectedFile ? (
            isEditing && selectedFile.endsWith('.md') ? (
              <div className="h-full">
                <MarkdownEditor
                  initialContent={fileContent}
                  fileName={selectedFile}
                  onSave={saveFileContent}
                  onCancel={() => setIsEditing(false)}
                />
              </div>
            ) : (
              <div className="p-6 bg-white m-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">{selectedFile}</h3>
                {selectedFile.endsWith('.md') ? (
                  fileContent ? (
                    <MarkdownViewer
                      content={fileContent}
                      onEdit={() => setIsEditing(true)}
                    />
                  ) : (
                    <div className="text-gray-500">Loading...</div>
                  )
                ) : selectedFile.endsWith('.json') ? (
                  <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded overflow-x-auto">
                    {fileContent}
                  </pre>
                ) : (
                  <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded">
                    {fileContent}
                  </pre>
                )}
              </div>
            )
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ project }: { project: CounselProject }) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Project Overview</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Name</h3>
          <p className="mt-1">{project.name}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Mode</h3>
          <p className="mt-1 capitalize">{project.mode}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Created</h3>
          <p className="mt-1">{new Date(project.created).toLocaleString()}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Modified</h3>
          <p className="mt-1">{new Date(project.modified).toLocaleString()}</p>
        </div>
        {project.metadata?.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1">{project.metadata.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanTab({ planStatus }: { planStatus: PlanStatus | null }) {
  if (!planStatus) {
    return (
      <div className="p-6">
        <p className="text-gray-600">No plan status available</p>
      </div>
    );
  }

  // Handle new phase-based format
  if (planStatus.phases) {
    const allItems = planStatus.phases.flatMap(phase => 
      (phase.checklist || []).map(item => ({
        ...item,
        phase: phase.title,
        phaseNumber: phase.phaseNumber
      }))
    );

    const columns = {
      'to-do': allItems.filter(item => item.status === 'to-do' || item.status === 'pending'),
      'in-progress': allItems.filter(item => item.status === 'in-progress' || item.status === 'in-Progress'),
      completed: allItems.filter(item => item.status === 'completed' || item.status === 'partially-completed'),
      blocked: allItems.filter(item => item.status === 'blocked')
    };

    const priorityColors: Record<string, string> = {
      high: 'border-red-300',
      medium: 'border-yellow-300',
      low: 'border-gray-300'
    };

    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Kanban Board</h2>
        {planStatus.project && typeof planStatus.project === 'object' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold">{planStatus.project.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{planStatus.project.description}</p>
            <p className="text-xs text-gray-500 mt-2">
              {planStatus.project.totalPhases} phases • Last updated: {new Date(planStatus.project.lastUpdated).toLocaleDateString()}
            </p>
          </div>
        )}
        {planStatus.project && typeof planStatus.project === 'string' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold">{planStatus.project}</h3>
            {planStatus.description && <p className="text-sm text-gray-600 mt-1">{planStatus.description}</p>}
            {planStatus.totalPhases && (
              <p className="text-xs text-gray-500 mt-2">
                {planStatus.totalPhases} phases • Last updated: {planStatus.lastUpdated ? new Date(planStatus.lastUpdated).toLocaleDateString() : 'N/A'}
              </p>
            )}
          </div>
        )}
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(columns).map(([status, items]) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-sm text-gray-700 mb-3 uppercase">
                {status} ({items.length})
              </h3>
              <div className="space-y-2 max-h-screen overflow-y-auto">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className={`bg-white p-3 rounded shadow-sm border-l-4 ${priorityColors[item.priority]}`}
                  >
                    <p className="text-xs font-semibold text-gray-500 mb-1">{item.category}</p>
                    <p className="text-sm">{item.description}</p>
                    <p className="text-xs text-gray-400 mt-2">Phase {item.phaseNumber}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback for legacy format
  if (planStatus.items) {
    const columns = {
      todo: planStatus.items.filter(item => item.status === 'todo'),
      'in-progress': planStatus.items.filter(item => item.status === 'in-progress'),
      done: planStatus.items.filter(item => item.status === 'done'),
      blocked: planStatus.items.filter(item => item.status === 'blocked')
    };

    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Kanban Board</h2>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(columns).map(([status, items]) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-sm text-gray-700 mb-3 uppercase">{status}</h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="bg-white p-3 rounded shadow-sm">
                    <p className="text-sm font-medium">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <p className="text-gray-600">No plan data available</p>
    </div>
  );
}

function ListView({ planStatus }: { planStatus: PlanStatus | null }) {
  if (!planStatus) {
    return (
      <div className="p-6">
        <p className="text-gray-600">No plan status available</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    blocked: 'bg-red-100 text-red-800',
    // Legacy format support
    todo: 'bg-gray-100 text-gray-800',
    done: 'bg-green-100 text-green-800'
  };

  const priorityColors: Record<string, string> = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-gray-600'
  };

  // Handle new phase-based format
  if (planStatus.phases) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Task List</h2>
        {planStatus.project && typeof planStatus.project === 'object' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold">{planStatus.project.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{planStatus.project.description}</p>
          </div>
        )}
        {planStatus.project && typeof planStatus.project === 'string' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold">{planStatus.project}</h3>
            {planStatus.description && <p className="text-sm text-gray-600 mt-1">{planStatus.description}</p>}
          </div>
        )}
        {planStatus.phases.map((phase) => (
          <div key={phase.phaseNumber} className="mb-8">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                Phase {phase.phaseNumber}: {phase.title}
              </h3>
              <p className="text-sm text-gray-600">{phase.description}</p>
              <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${statusColors[phase.status]}`}>
                {phase.status}
              </span>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(phase.checklistItems || []).map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-medium text-sm ${priorityColors[item.priority]}`}>
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[item.status]}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Fallback for legacy format
  if (planStatus.items) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Task List</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {planStatus.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusColors[item.status]}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.description || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <p className="text-gray-600">No plan data available</p>
    </div>
  );
}