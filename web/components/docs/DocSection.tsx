import React from 'react';

interface DocSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  level?: number;
  className?: string;
  searchHighlight?: string;
  onCopyLink?: (message: string) => void;
}

export function DocSection({ 
  id, 
  title, 
  children, 
  level = 1, 
  className = '',
  searchHighlight = '',
  onCopyLink
}: DocSectionProps) {
  const getHeadingClasses = (level: number) => {
    switch (level) {
      case 1:
        return 'text-3xl font-bold text-gray-900 dark:text-white mb-6';
      case 2:
        return 'text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4 mt-8';
      case 3:
        return 'text-xl font-medium text-gray-700 dark:text-gray-300 mb-3 mt-6';
      default:
        return 'text-lg font-medium text-gray-600 dark:text-gray-400 mb-2 mt-4';
    }
  };

  // Copy section link to clipboard
  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      onCopyLink?.('Link copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      onCopyLink?.('Link copied to clipboard!');
    }
  };

  const renderHeading = () => {
    const headingContent = (
      <div className="group flex items-center">
        <a 
          href={`#${id}`} 
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          aria-label={`Link to ${title} section`}
        >
          {title}
        </a>
        <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
          <button
            onClick={copyLink}
            className="p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            aria-label="Copy link to section"
            title="Copy link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <span className="text-blue-500 dark:text-blue-400 text-sm">#</span>
        </div>
      </div>
    );

    const headingClass = getHeadingClasses(level);

    switch (level) {
      case 1:
        return <h1 className={headingClass}>{headingContent}</h1>;
      case 2:
        return <h2 className={headingClass}>{headingContent}</h2>;
      case 3:
        return <h3 className={headingClass}>{headingContent}</h3>;
      case 4:
        return <h4 className={headingClass}>{headingContent}</h4>;
      case 5:
        return <h5 className={headingClass}>{headingContent}</h5>;
      default:
        return <h2 className={headingClass}>{headingContent}</h2>;
    }
  };

  // Add search highlight effect
  const sectionClasses = searchHighlight && title.toLowerCase().includes(searchHighlight.toLowerCase())
    ? `scroll-mt-32 ${className} animate-pulse bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-400`
    : `scroll-mt-32 ${className}`;

  return (
    <section id={id} className={sectionClasses}>
      {renderHeading()}
      <div className="prose prose-gray max-w-none dark:prose-invert">
        {children}
      </div>
    </section>
  );
}