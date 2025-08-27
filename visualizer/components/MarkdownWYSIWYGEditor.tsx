'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import MDXEditor to avoid SSR issues
const MDXEditorComponent = dynamic(() => import('./MDXEditorWrapper'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-50 animate-pulse rounded-lg flex items-center justify-center">
      Loading editor...
    </div>
  ),
});

interface MarkdownWYSIWYGEditorProps {
  initialContent: string;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
  fileName?: string;
}

export default function MarkdownWYSIWYGEditor({ 
  initialContent, 
  onSave, 
  onCancel,
  fileName 
}: MarkdownWYSIWYGEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasChanges(value !== initialContent);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(content);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmCancel) return;
    }
    onCancel();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          {fileName && (
            <h3 className="text-lg font-semibold text-gray-900">
              Editing: {fileName}
            </h3>
          )}
          {hasChanges && (
            <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isSaving || !hasChanges
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* WYSIWYG Editor */}
      <div className="flex-1 overflow-auto bg-white p-8">
        <MDXEditorComponent
          initialContent={initialContent}
          onChange={handleContentChange}
        />
      </div>
    </div>
  );
}