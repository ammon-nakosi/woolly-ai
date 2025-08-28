'use client';

import React, { useState, useEffect, useRef } from 'react';
import '@mdxeditor/editor/style.css';

interface SimpleWYSIWYGEditorProps {
  initialContent: string;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
  fileName?: string;
}

export default function SimpleWYSIWYGEditor({ 
  initialContent, 
  onSave, 
  onCancel,
  fileName 
}: SimpleWYSIWYGEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [EditorComponent, setEditorComponent] = useState<any>(null);
  const editorRef = useRef<any>(null);
  const initialContentRef = useRef(initialContent);

  useEffect(() => {
    // Dynamically import MDXEditor on client side only
    import('@mdxeditor/editor').then((module) => {
      const { 
        MDXEditor, 
        headingsPlugin, 
        listsPlugin, 
        quotePlugin, 
        thematicBreakPlugin,
        linkPlugin,
        linkDialogPlugin,
        imagePlugin,
        tablePlugin,
        markdownShortcutPlugin,
        toolbarPlugin,
        UndoRedo,
        BoldItalicUnderlineToggles,
        BlockTypeSelect,
        CreateLink,
        InsertImage,
        InsertTable,
        ListsToggle,
        InsertThematicBreak,
        MDXEditorMethods
      } = module;
      
      // Create a wrapper component with the plugins
      const MDXEditorWrapper = React.forwardRef<MDXEditorMethods, any>(({ markdown, onChange }, ref) => (
        <MDXEditor
          ref={ref}
          className="mdx-editor-wrapper"
          markdown={markdown}
          onChange={(newContent) => {
            if (onChange) {
              onChange(newContent);
            }
          }}
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            imagePlugin(),
            tablePlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            markdownShortcutPlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  <BoldItalicUnderlineToggles />
                  <BlockTypeSelect />
                  <ListsToggle />
                  <CreateLink />
                  <InsertImage />
                  <InsertTable />
                  <InsertThematicBreak />
                </>
              )
            })
          ]}
        />
      ));
      
      MDXEditorWrapper.displayName = 'MDXEditorWrapper';
      setEditorComponent(() => MDXEditorWrapper);
    });
  }, []);

  const handleContentChange = (value: string) => {
    setContent(value);
    // Check if content has actually changed
    const trimmedValue = (value || '').trim();
    const trimmedInitial = (initialContentRef.current || '').trim();
    setHasChanges(trimmedValue !== trimmedInitial);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Get the latest content from the editor
      const latestContent = editorRef.current?.getMarkdown ? editorRef.current.getMarkdown() : content;
      await onSave(latestContent);
      setHasChanges(false);
      // Update the initial content reference after successful save
      initialContentRef.current = latestContent;
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

  // Force enable save button for testing - can be removed later
  const handleForceChange = () => {
    setHasChanges(true);
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
      <div className="flex-1 overflow-auto bg-white" onClick={handleForceChange}>
        <div className="mdx-editor-container p-8">
          {EditorComponent ? (
            <EditorComponent 
              ref={editorRef}
              markdown={initialContent}
              onChange={handleContentChange}
            />
          ) : (
            <div className="h-96 bg-gray-50 animate-pulse rounded-lg flex items-center justify-center">
              Loading editor...
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .mdx-editor-wrapper {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .mdx-editor-container .mdxeditor {
          min-height: 400px;
        }
        .mdx-editor-container .mdxeditor-toolbar {
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          padding: 8px;
        }
        .mdx-editor-container .mdxeditor-root-contenteditable {
          padding: 20px;
          min-height: 400px;
        }
        .mdx-editor-container h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
        }
        .mdx-editor-container h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.83em 0;
        }
        .mdx-editor-container h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 1em 0;
        }
        .mdx-editor-container p {
          margin: 1em 0;
          line-height: 1.6;
        }
        .mdx-editor-container ul, .mdx-editor-container ol {
          margin: 1em 0;
          padding-left: 2em;
          list-style-position: outside;
        }
        .mdx-editor-container ul {
          list-style-type: disc;
        }
        .mdx-editor-container ol {
          list-style-type: decimal;
        }
        .mdx-editor-container li {
          margin: 0.5em 0;
          padding-left: 0.5em;
        }
        .mdx-editor-container ul ul {
          list-style-type: circle;
        }
        .mdx-editor-container ul ul ul {
          list-style-type: square;
        }
        .mdx-editor-container blockquote {
          margin: 1em 0;
          padding-left: 1em;
          border-left: 4px solid #e5e7eb;
          color: #6b7280;
        }
        .mdx-editor-container code {
          background-color: #f3f4f6;
          padding: 0.125em 0.25em;
          border-radius: 0.25em;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
        }
        .mdx-editor-container pre {
          background-color: #1f2937;
          color: #e5e7eb;
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
        }
        .mdx-editor-container pre code {
          background-color: transparent;
          padding: 0;
        }
      `}</style>
    </div>
  );
}