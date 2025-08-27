'use client';

import { useState, useEffect, use } from 'react';
import { CounselProject } from '@/lib/counsel-reader';
import MarkdownViewer from '@/components/MarkdownViewerSimple';
import dynamic from 'next/dynamic';

const MarkdownWYSIWYGEditor = dynamic(() => import('@/components/SimpleWYSIWYGEditor'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-50 animate-pulse rounded-lg" />
});

interface FilesPageProps {
  params: Promise<{ mode: string; name: string }>;
}

export default function FilesPage({ params }: FilesPageProps) {
  const { mode, name } = use(params);
  const [project, setProject] = useState<CounselProject | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [mode, name]);

  useEffect(() => {
    if (selectedFile) {
      fetchFileContent(selectedFile);
      setIsEditing(false);
    }
  }, [selectedFile]);

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-600">Loading files...</div>
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

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.md')) return '📝';
    if (fileName.endsWith('.json')) return '📊';
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return '🟦';
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return '🟨';
    if (fileName.endsWith('.css')) return '🎨';
    return '📄';
  };

  // If no file is selected, show file list
  if (!selectedFile) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Project Files</h1>
          <p className="text-gray-600 mt-2">{project.files.length} files</p>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <div className="divide-y divide-gray-200">
            {project.files.map((file) => (
              <button
                key={file}
                onClick={() => setSelectedFile(file)}
                className="w-full flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-xl flex-shrink-0">{getFileIcon(file)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{file}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {file.split('/').slice(0, -1).join('/') || 'Root'}
                  </p>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // File viewer
  return (
    <div className="h-full overflow-auto">
      {isEditing && selectedFile.endsWith('.md') ? (
        <div className="h-full">
          <MarkdownWYSIWYGEditor
            initialContent={fileContent}
            fileName={selectedFile}
            onSave={saveFileContent}
            onCancel={() => {
              setIsEditing(false);
              setSelectedFile(null);
            }}
          />
        </div>
      ) : (
        <div className="p-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-gray-500 hover:text-gray-700"
                    title="Back to files"
                  >
                    ← Back to files
                  </button>
                  <h3 className="text-lg font-semibold">{selectedFile}</h3>
                </div>
              </div>
              
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
          </div>
        </div>
      )}
    </div>
  );
}