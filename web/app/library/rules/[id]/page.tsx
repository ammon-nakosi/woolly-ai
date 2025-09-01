'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Rule, RuleType, RuleScope, RuleStatus, RuleDisplay } from '@/lib/library-reader';

export default function RuleDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [rule, setRule] = useState<Rule | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Rule>>({});

  useEffect(() => {
    fetchRule();
  }, [params.id]);

  const fetchRule = async () => {
    try {
      const res = await fetch(`/api/library/rules/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setRule(data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Failed to fetch rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/library/rules/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const updated = await res.json();
        setRule(updated);
        setEditing(false);
      }
    } catch (error) {
      console.error('Failed to save rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      const res = await fetch(`/api/library/rules/${params.id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = rule?.status === 'active' ? 'inactive' : 'active';
    setFormData({ ...formData, status: newStatus });
    
    try {
      const res = await fetch(`/api/library/rules/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        const updated = await res.json();
        setRule(updated);
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading rule...</div>
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Rule not found</div>
      </div>
    );
  }

  const ruleTypes: RuleType[] = ['coding-practices', 'code-snippet', 'workaround', 'config', 'reference', 'guideline', 'general-note'];
  const ruleScopes: RuleScope[] = ['project', 'session', 'user'];
  const ruleDisplays: RuleDisplay[] = ['full', 'summary', 'hidden'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <Link href="/" className="text-blue-600 hover:text-blue-900 text-sm mb-2 inline-block">
                  ← Back to Library
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                  {editing ? 'Edit Rule' : rule.title}
                </h1>
                <p className="text-sm text-gray-500 mt-1">ID: {rule.id}</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleToggleStatus}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    rule.status === 'active'
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {rule.status === 'active' ? 'Active' : 'Inactive'}
                </button>
                
                {!editing && (
                  <>
                    <button
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </>
                )}
                
                {editing && (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setFormData(rule);
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  {editing ? (
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as RuleType })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {ruleTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{rule.type}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Scope</label>
                  {editing ? (
                    <select
                      value={formData.scope}
                      onChange={(e) => setFormData({ ...formData, scope: e.target.value as RuleScope })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {ruleScopes.map(scope => (
                        <option key={scope} value={scope}>{scope}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{rule.scope}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Display Mode</label>
                  {editing ? (
                    <select
                      value={formData.display}
                      onChange={(e) => setFormData({ ...formData, display: e.target.value as RuleDisplay })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {ruleDisplays.map(display => (
                        <option key={display} value={display}>{display}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{rule.display}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project</label>
                  <p className="mt-1 text-sm text-gray-900">{rule.projectName || '-'}</p>
                </div>
              </div>

              {/* Title */}
              {editing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Summary</label>
                {editing ? (
                  <textarea
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{rule.summary}</p>
                )}
              </div>

              {/* Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Details</label>
                {editing ? (
                  <textarea
                    value={formData.details || ''}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    rows={10}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                  />
                ) : (
                  <pre className="mt-1 text-sm text-gray-900 bg-gray-50 p-4 rounded overflow-x-auto">
                    {rule.details || 'No details provided'}
                  </pre>
                )}
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>Created: {new Date(rule.created).toLocaleString()}</div>
                <div>Updated: {new Date(rule.updated).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}