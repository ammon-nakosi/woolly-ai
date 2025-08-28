import React, { useState, useEffect, useCallback } from 'react';

interface NavigationItem {
  id: string;
  title: string;
  level: number;
  children?: NavigationItem[];
}

interface NavigationSidebarProps {
  items: NavigationItem[];
  activeSection?: string;
}

export function NavigationSidebar({ items, activeSection }: NavigationSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentActiveSection, setCurrentActiveSection] = useState(activeSection || '');

  // Auto-detect active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = items.flatMap(item => [
        item,
        ...(item.children || [])
      ]);

      let currentSection = '';
      
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Consider section active if it's in the top half of the viewport
          if (rect.top <= window.innerHeight / 2 && rect.bottom >= 0) {
            currentSection = section.id;
          }
        }
      }

      if (currentSection && currentSection !== currentActiveSection) {
        setCurrentActiveSection(currentSection);
      }
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', throttledScroll);
  }, [items, currentActiveSection]);

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Smooth scroll with offset for sticky headers
      const offsetTop = element.offsetTop - 120;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
      setIsOpen(false); // Close mobile menu after navigation
      setCurrentActiveSection(id);
    }
  }, []);

  const renderNavItem = (item: NavigationItem) => {
    const isActive = currentActiveSection === item.id;
    const hasActiveChild = item.children?.some(child => currentActiveSection === child.id);
    const paddingClass = item.level === 1 ? 'pl-0' : item.level === 2 ? 'pl-4' : 'pl-8';
    
    return (
      <div key={item.id} className="relative">
        <button
          onClick={() => scrollToSection(item.id)}
          className={`
            w-full text-left py-2 px-3 rounded-md text-sm transition-all duration-200
            ${paddingClass}
            ${isActive 
              ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-500 shadow-sm' 
              : hasActiveChild
              ? 'text-blue-600 font-medium'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
          `}
          aria-current={isActive ? 'page' : undefined}
        >
          {item.title}
        </button>
        {item.children && (
          <div className="ml-2 mt-1 space-y-1">
            {item.children.map(renderNavItem)}
          </div>
        )}
      </div>
    );
  };

  // Close mobile menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
      >
        <svg 
          className={`w-6 h-6 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Navigation sidebar */}
      <nav 
        className={`
          fixed lg:sticky top-0 left-0 h-screen lg:h-auto lg:max-h-screen
          w-80 lg:w-64 bg-white lg:bg-transparent
          border-r lg:border-r-0 border-gray-200
          overflow-y-auto z-50 lg:z-auto
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          pt-16 lg:pt-8 px-4 lg:px-0
          lg:sticky lg:top-8
        `}
        aria-label="Documentation navigation"
      >
        <div className="space-y-1 pb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 lg:hidden">
            Documentation
          </h3>
          <div className="hidden lg:block mb-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Contents
            </h3>
          </div>
          {items.map(renderNavItem)}
        </div>
      </nav>
    </>
  );
}