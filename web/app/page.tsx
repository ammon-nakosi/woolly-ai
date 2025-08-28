'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CounselProject } from '@/lib/counsel-reader';

type SortField = 'name' | 'mode' | 'modified' | 'created';
type SortOrder = 'asc' | 'desc';

export default function ProjectList() {
  const [projects, setProjects] = useState<CounselProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('modified');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterMode, setFilterMode] = useState<string>('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedProjects = [...projects]
    .filter(p => filterMode === 'all' || p.mode === filterMode)
    .sort((a, b) => {
      let aVal: string | number = a[sortField] as string;
      let bVal: string | number = b[sortField] as string;
      
      if (sortField === 'modified' || sortField === 'created') {
        aVal = new Date(aVal as string).getTime();
        bVal = new Date(bVal as string).getTime();
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const modeColors: Record<string, string> = {
    feature: 'bg-blue-100 text-blue-800',
    script: 'bg-green-100 text-green-800',
    debug: 'bg-red-100 text-red-800',
    review: 'bg-purple-100 text-purple-800',
    vibe: 'bg-yellow-100 text-yellow-800'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Counsel Projects</h1>
              <a 
                href="/docs" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
              >
                View Documentation
              </a>
            </div>
            
            {/* Filters */}
            <div className="mb-6 flex gap-2">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded ${
                  filterMode === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                All ({projects.length})
              </button>
              {['feature', 'script', 'debug', 'review', 'vibe'].map(mode => {
                const count = projects.filter(p => p.mode === mode).length;
                if (count === 0) return null;
                return (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`px-3 py-1 rounded ${
                      filterMode === mode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {mode} ({count})
                  </button>
                );
              })}
            </div>

            {/* Table */}
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handleSort('name')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('mode')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Mode {sortField === 'mode' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th
                      onClick={() => handleSort('modified')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Modified {sortField === 'modified' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedProjects.map((project) => (
                    <tr key={`${project.mode}-${project.name}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/projects/${project.mode}/${project.name}`}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          {project.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${modeColors[project.mode]}`}>
                          {project.mode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {project.metadata?.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(project.modified).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
