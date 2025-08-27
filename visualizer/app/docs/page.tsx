"use client";

import React, { useState, useEffect, useCallback } from "react";
import { NavigationSidebar } from "../../components/docs/NavigationSidebar";
import { SearchBox } from "../../components/docs/SearchBox";
import { DocSection } from "../../components/docs/DocSection";
import { TableOfContents } from "../../components/docs/TableOfContents";
import { DarkModeToggle } from "../../components/docs/DarkModeToggle";
import { docsContent } from "../../lib/docs-content";
import { SearchResult } from "../../lib/docs-types";

// Metadata cannot be exported from client components in Next.js 15
// Move this to a layout.tsx or server component if needed

interface NavigationItem {
  id: string;
  title: string;
  level: number;
  children?: NavigationItem[];
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("");
  const [searchHighlight, setSearchHighlight] = useState<string>("");
  const [copyFeedback, setCopyFeedback] = useState<string>("");

  // Generate navigation items from docs content
  const navigationItems: NavigationItem[] = docsContent.sections.map(
    (section) => ({
      id: section.id,
      title: section.title,
      level: section.level,
      children: section.subsections?.map((subsection) => ({
        id: subsection.id,
        title: subsection.title,
        level: subsection.level,
      })),
    })
  );

  // Generate TOC items (flattened list of all sections)
  const tocItems = docsContent.sections.flatMap((section) => [
    { id: section.id, title: section.title, level: section.level },
    ...(section.subsections?.map((subsection) => ({
      id: subsection.id,
      title: subsection.title,
      level: subsection.level,
    })) || []),
  ]);

  // Handle search result selection
  const handleSearchResultSelect = useCallback(
    (result: SearchResult, searchQuery?: string) => {
      // Navigate to the section
      const element = document.getElementById(result.id);
      if (element) {
        const offsetTop = element.offsetTop - 120; // Account for both navigation headers
        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        });
        setActiveSection(result.id);

        // Set search highlight for better UX
        if (searchQuery) {
          setSearchHighlight(searchQuery);
          // Clear highlight after a few seconds
          setTimeout(() => setSearchHighlight(""), 5000);
        }
      }
    },
    []
  );

  // Back to top functionality
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  // Show back to top button when scrolled down
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);

      // Update active section based on scroll position
      const sections = document.querySelectorAll("section[id]");
      let currentSection = "";

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom >= 150) {
          currentSection = section.id;
        }
      });

      if (currentSection && currentSection !== activeSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeSection]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K for search focus
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        const searchInput = document.querySelector(
          'input[type="text"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Ctrl/Cmd + P for print
      if ((event.ctrlKey || event.metaKey) && event.key === "p") {
        event.preventDefault();
        window.print();
      }

      // Home key to scroll to top
      if (event.key === "Home" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        scrollToTop();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scrollToTop]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header with Search */}
      <header className="sticky top-16 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Title */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Documentation
              </h1>
              <span className="hidden sm:inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                v{docsContent.metadata.version}
              </span>
            </div>

            {/* Search box */}
            <div className="flex-1 max-w-xs sm:max-w-md mx-2 sm:mx-4 relative">
              <SearchBox
                onResultSelect={handleSearchResultSelect}
                placeholder="Search docs... (⌘K)"
                className="w-full"
              />
            </div>

            {/* Quick actions */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <DarkModeToggle />
              <button
                onClick={scrollToTop}
                className="hidden md:block text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap"
                title="Scroll to top (Home key)"
              >
                Back to Top
              </button>
              <button
                onClick={() => window.print()}
                className="hidden sm:block p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors no-print"
                aria-label="Print documentation"
                title="Print documentation (⌘P)"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
              </button>
              <div className="hidden lg:block relative group">
                <button
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors no-print"
                  aria-label="Keyboard shortcuts"
                  title="Keyboard shortcuts"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                    />
                  </svg>
                </button>
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50">
                  <div className="p-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Keyboard Shortcuts
                    </h4>
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Search</span>
                        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          ⌘K
                        </kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Print</span>
                        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          ⌘P
                        </kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Back to top</span>
                        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          Home
                        </kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Sidebar Navigation - Desktop */}
          <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
            <div className="sticky top-32">
              <NavigationSidebar
                items={navigationItems}
                activeSection={activeSection}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="flex flex-col xl:flex-row gap-8">
              {/* Primary content */}
              <div className="flex-1 min-w-0 max-w-4xl">
                {/* Mobile Table of Contents */}
                <div className="xl:hidden mb-6">
                  <TableOfContents
                    sections={tocItems}
                    activeSection={activeSection}
                  />
                </div>
                {/* Page intro */}
                <div className="mb-8 sm:mb-10 lg:mb-12">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
                      {docsContent.metadata.title}
                    </h1>
                    <div className="flex items-center space-x-2 no-print">
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: docsContent.metadata.title,
                              text: docsContent.metadata.description,
                              url: window.location.href,
                            });
                          } else {
                            navigator.clipboard.writeText(window.location.href);
                            setCopyFeedback("Page URL copied to clipboard!");
                            setTimeout(() => setCopyFeedback(""), 3000);
                          }
                        }}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Share this page"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 leading-relaxed">
                    {docsContent.metadata.description}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm text-gray-500 dark:text-gray-400">
                    <span>Version {docsContent.metadata.version}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Last updated {docsContent.metadata.lastUpdated}</span>
                  </div>
                </div>

                {/* Documentation sections */}
                <div className="space-y-12 sm:space-y-14 lg:space-y-16">
                  {docsContent.sections.map((section) => (
                    <DocSection
                      key={section.id}
                      id={section.id}
                      title={section.title}
                      level={section.level}
                      searchHighlight={searchHighlight}
                      className="doc-section"
                      onCopyLink={(message) => {
                        setCopyFeedback(message);
                        setTimeout(() => setCopyFeedback(""), 3000);
                      }}
                    >
                      {section.content}

                      {/* Render subsections */}
                      {section.subsections &&
                        section.subsections.length > 0 && (
                          <div className="mt-6 sm:mt-8 space-y-6 sm:space-y-8">
                            {section.subsections.map((subsection) => (
                              <DocSection
                                key={subsection.id}
                                id={subsection.id}
                                title={subsection.title}
                                level={subsection.level}
                                searchHighlight={searchHighlight}
                                className="doc-section"
                                onCopyLink={(message) => {
                                  setCopyFeedback(message);
                                  setTimeout(() => setCopyFeedback(""), 3000);
                                }}
                              >
                                {subsection.content}
                              </DocSection>
                            ))}
                          </div>
                        )}
                    </DocSection>
                  ))}
                </div>

                {/* Footer */}
                <footer className="mt-24 pt-12 border-t border-gray-200 dark:border-gray-700 no-print">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <p className="mb-4">
                      Found an issue with the documentation?
                      <a
                        href="https://github.com/ammon-nakosi/counsel-framework/issues"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Report it on GitHub
                      </a>
                    </p>
                    <p className="text-sm">
                      © 2025 Counsel Framework. Built with ❤️ for developers.
                    </p>
                  </div>
                </footer>
              </div>

              {/* Desktop Table of Contents */}
              <aside className="hidden xl:block w-64 flex-shrink-0">
                <div className="sticky top-32">
                  <TableOfContents
                    sections={tocItems}
                    activeSection={activeSection}
                  />
                </div>
              </aside>
            </div>
          </main>
        </div>
      </div>

      {/* Back to top button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 p-2 sm:p-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-30 no-print"
          aria-label="Back to top"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}

      {/* Mobile navigation sidebar */}
      <div className="lg:hidden no-print">
        <NavigationSidebar
          items={navigationItems}
          activeSection={activeSection}
        />
      </div>

      {/* Copy feedback toast */}
      {copyFeedback && (
        <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 no-print animate-fade-in">
          {copyFeedback}
        </div>
      )}
    </div>
  );
}
