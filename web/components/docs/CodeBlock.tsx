import React, { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language: string;
  title?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
}

export function CodeBlock({ 
  code, 
  language, 
  title, 
  showLineNumbers = false, 
  highlightLines = [] 
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  // Simple syntax highlighting with CSS classes
  const getLanguageClass = (lang: string) => {
    const languageMap: Record<string, string> = {
      typescript: 'text-blue-300',
      javascript: 'text-yellow-300',
      bash: 'text-green-300',
      json: 'text-purple-300',
      markdown: 'text-gray-300'
    };
    return languageMap[lang] || 'text-gray-100';
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const lines = code.split('\n');

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden my-4 shadow-lg">
      {title && (
        <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300 border-b border-gray-700 font-medium">
          {title}
        </div>
      )}
      
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors z-10 font-medium"
          aria-label="Copy code to clipboard"
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
        
        <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
          <code className={`language-${language} ${getLanguageClass(language)} font-mono`}>
            {showLineNumbers ? (
              <div className="table w-full">
                {lines.map((line, index) => {
                  const lineNumber = index + 1;
                  const isHighlighted = highlightLines.includes(lineNumber);
                  
                  return (
                    <div 
                      key={index} 
                      className={`table-row ${isHighlighted ? 'bg-blue-900/30 border-l-2 border-blue-400' : ''}`}
                    >
                      <span className="table-cell pr-4 text-gray-500 select-none text-right w-12 font-mono">
                        {lineNumber}
                      </span>
                      <span className="table-cell whitespace-pre">
                        {line || ' '}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="whitespace-pre">{code}</span>
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}