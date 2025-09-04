'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CounselProject } from '@/lib/woolly-reader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Filter, Calendar, Clock, FolderOpen, FileText, BookOpen, ChevronRight, ArrowUpDown } from 'lucide-react';

type SortField = 'name' | 'mode' | 'modified' | 'created';
type SortOrder = 'asc' | 'desc';
type TabView = 'projects' | 'library';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabView>('projects');
  const [projects, setProjects] = useState<CounselProject[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('modified');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [libraryView, setLibraryView] = useState<'rules' | 'prompts'>('rules');

  useEffect(() => {
    // Fetch all data on initial load
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProjects(), fetchLibrary()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchLibrary = async () => {
    try {
      const [rulesRes, promptsRes] = await Promise.all([
        fetch('/api/library/rules'),
        fetch('/api/library/prompts')
      ]);
      const rulesData = await rulesRes.json();
      const promptsData = await promptsRes.json();
      setRules(rulesData);
      setPrompts(promptsData);
    } catch (error) {
      console.error('Failed to fetch library:', error);
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
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const modeColors: Record<string, string> = {
    feature: 'bg-blue-100 text-blue-800',
    debug: 'bg-red-100 text-red-800',
    review: 'bg-purple-100 text-purple-800',
    script: 'bg-green-100 text-green-800',
    vibe: 'bg-yellow-100 text-yellow-800',
    prompt: 'bg-purple-100 text-purple-800'
  };

  const getRuleTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'coding-practices': 'bg-blue-100 text-blue-800',
      'code-snippet': 'bg-green-100 text-green-800',
      'workaround': 'bg-orange-100 text-orange-800',
      'config': 'bg-purple-100 text-purple-800',
      'reference': 'bg-indigo-100 text-indigo-800',
      'guideline': 'bg-pink-100 text-pink-800',
      'general-note': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getScopeColor = (scope: string) => {
    const colors: Record<string, string> = {
      'project': 'bg-blue-100 text-blue-800',
      'session': 'bg-yellow-100 text-yellow-800',
      'user': 'bg-green-100 text-green-800'
    };
    return colors[scope] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'projects'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Projects ({projects.length})
                </button>
                <button
                  onClick={() => setActiveTab('library')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'library'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Library ({rules.length + prompts.length})
                </button>
              </nav>
            </div>

            {/* Projects Tab Content */}
            {activeTab === 'projects' && (
              <>
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

                {/* Projects Table */}
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
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${modeColors[project.mode]}`}>
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
              </>
            )}

            {/* Library Tab Content */}
            {activeTab === 'library' && (
              <>
                {/* Library Sub-tabs */}
                <div className="mb-6 flex gap-2">
                  <button
                    onClick={() => setLibraryView('rules')}
                    className={`px-3 py-1 rounded ${
                      libraryView === 'rules' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Rules ({rules.length})
                  </button>
                  <button
                    onClick={() => setLibraryView('prompts')}
                    className={`px-3 py-1 rounded ${
                      libraryView === 'prompts' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Prompts ({prompts.length})
                  </button>
                </div>

                {/* Rules Table */}
                {libraryView === 'rules' && (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Scope
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Project
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Updated
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rules.map((rule) => (
                          <tr key={rule.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link
                                href={`/library/rules/${rule.id}`}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                {rule.title}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRuleTypeColor(rule.type)}`}>
                                {rule.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getScopeColor(rule.scope)}`}>
                                {rule.scope}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                rule.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {rule.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {rule.projectName || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(rule.updated).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Prompts Table */}
                {libraryView === 'prompts' && (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tags
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usage
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Updated
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {prompts.map((prompt) => (
                          <tr key={prompt.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link
                                href={`/library/prompts/${prompt.id}`}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                {prompt.title}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {prompt.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex gap-1">
                                {prompt.tags?.map((tag: string) => (
                                  <span key={tag} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {prompt.usage_count || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(prompt.updated).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}