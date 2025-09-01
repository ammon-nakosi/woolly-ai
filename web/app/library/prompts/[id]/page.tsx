'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Prompt } from '@/lib/library-reader';

export default function PromptDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Prompt>>({});

  useEffect(() => {
    fetchPrompt();
  }, [params.id]);

  const fetchPrompt = async () => {
    try {
      const res = await fetch(`/api/library/prompts/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setPrompt(data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Failed to fetch prompt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/library/prompts/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const updated = await res.json();
        setPrompt(updated);
        setEditing(false);
      }
    } catch (error) {
      console.error('Failed to save prompt:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    
    try {
      const res = await fetch(`/api/library/prompts/${params.id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  };

  const handleUse = async () => {
    // Increment usage count
    const newCount = (prompt?.usage_count || 0) + 1;
    await fetch(`/api/library/prompts/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usage_count: newCount })
    });
    
    // Copy to clipboard
    if (prompt?.content) {
      navigator.clipboard.writeText(prompt.content);
      alert('Prompt copied to clipboard!');
      
      // Refresh to show updated count
      fetchPrompt();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading prompt...</div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Prompt not found</div>
      </div>
    );
  }

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(t => t.trim()).filter(Boolean);
    setFormData({ ...formData, tags });
  };

  const handleVariablesChange = (value: string) => {
    const variables = value.split(',').map(v => v.trim()).filter(Boolean);
    setFormData({ ...formData, variables });
  };

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
                  {editing ? 'Edit Prompt' : prompt.title}
                </h1>
                <p className="text-sm text-gray-500 mt-1">ID: {prompt.id}</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleUse}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Use Prompt ({prompt.usage_count})
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
                        setFormData(prompt);
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

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                {editing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{prompt.description}</p>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Tags</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.tags?.join(', ') || ''}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="Comma-separated tags"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                ) : (
                  <div className="mt-1 flex gap-1">
                    {prompt.tags?.map(tag => (
                      <span key={tag} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Variables */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Variables</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.variables?.join(', ') || ''}
                    onChange={(e) => handleVariablesChange(e.target.value)}
                    placeholder="Comma-separated variable names"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                ) : (
                  <div className="mt-1">
                    {prompt.variables && prompt.variables.length > 0 ? (
                      <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {prompt.variables.join(', ')}
                      </code>
                    ) : (
                      <span className="text-sm text-gray-500">No variables</span>
                    )}
                  </div>
                )}
              </div>

              {/* Context */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Context</label>
                {editing ? (
                  <textarea
                    value={formData.context || ''}
                    onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                    rows={3}
                    placeholder="Optional context or usage instructions"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {prompt.context || 'No context provided'}
                  </p>
                )}
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Prompt Content</label>
                {editing ? (
                  <textarea
                    value={formData.content || ''}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={15}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                  />
                ) : (
                  <pre className="mt-1 text-sm text-gray-900 bg-gray-50 p-4 rounded overflow-x-auto whitespace-pre-wrap">
                    {prompt.content}
                  </pre>
                )}
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>Created: {new Date(prompt.created).toLocaleString()}</div>
                <div>Updated: {new Date(prompt.updated).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}