'use client';

import React from 'react';
import '@mdxeditor/editor/style.css';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  ListsToggle,
  InsertThematicBreak
} from '@mdxeditor/editor';

interface MDXEditorWrapperProps {
  initialContent: string;
  onChange: (content: string) => void;
}

export default function MDXEditorWrapper({ initialContent, onChange }: MDXEditorWrapperProps) {
  return (
    <MDXEditor
      className="prose prose-gray max-w-none"
      markdown={initialContent}
      onChange={onChange}
      plugins={[
        headingsPlugin(),
        listsPlugin(),
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
              <InsertThematicBreak />
            </>
          )
        })
      ]}
    />
  );
}