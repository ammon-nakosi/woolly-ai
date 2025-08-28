import React, { useState, useEffect } from 'react';

interface TOCItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  sections: TOCItem[];
  activeSection?: string;
  className?: string;
}

export function TableOfContents({ sections, activeSection, className = '' }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offsetTop = element.offsetTop - 120;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
      setIsOpen(false); // Close mobile TOC after navigation
    }
  };

  // Close TOC when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.toc-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={`toc-container ${className}`}>
      {/* Mobile TOC Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4"
        aria-expanded={isOpen}
        aria-label="Toggle table of contents"
      >
        <span className="font-medium text-gray-900 dark:text-white">Table of Contents</span>
        <svg 
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* TOC Content */}
      <div className={`
        lg:block
        ${isOpen ? 'block' : 'hidden'}
        bg-white dark:bg-gray-800 lg:bg-transparent
        border border-gray-200 dark:border-gray-700 lg:border-none
        rounded-lg lg:rounded-none
        p-4 lg:p-0
        shadow-lg lg:shadow-none
        absolute lg:relative
        left-0 right-0 lg:left-auto lg:right-auto
        z-50 lg:z-auto
        max-h-96 lg:max-h-none
        overflow-y-auto
      `}>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3 lg:mb-4">
          On This Page
        </h3>
        <nav aria-label="Table of contents">
          <ul className="space-y-1">
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              const paddingClass = section.level === 1 ? 'pl-0' : section.level === 2 ? 'pl-3' : 'pl-6';
              
              return (
                <li key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={`
                      w-full text-left py-1.5 px-2 rounded text-sm transition-all duration-200
                      ${paddingClass}
                      ${isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium border-l-2 border-blue-500' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {section.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}