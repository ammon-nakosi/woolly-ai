import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Counsel Framework Documentation",
  description: "Comprehensive guide to the Counsel Framework for AI-assisted development. Learn about features, CLI commands, integrations, and best practices.",
  keywords: [
    "counsel framework",
    "ai development",
    "development workflow",
    "cli tools",
    "chromadb",
    "linear integration",
    "git integration",
    "documentation",
    "developer tools"
  ],
  authors: [{ name: "Counsel Framework Team" }],
  creator: "Counsel Framework",
  publisher: "Counsel Framework",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://counsel-framework.dev/docs',
    title: 'Counsel Framework Documentation',
    description: 'Comprehensive guide to the Counsel Framework for AI-assisted development',
    siteName: 'Counsel Framework',
    images: [
      {
        url: '/og-docs.png',
        width: 1200,
        height: 630,
        alt: 'Counsel Framework Documentation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Counsel Framework Documentation',
    description: 'Comprehensive guide to the Counsel Framework for AI-assisted development',
    images: ['/og-docs.png'],
    creator: '@counsel_framework',
  },
  alternates: {
    canonical: 'https://counsel-framework.dev/docs',
  },
  other: {
    'msapplication-TileColor': '#3b82f6',
    'theme-color': '#3b82f6',
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Print-specific styles */}
      <link rel="stylesheet" href="/docs/print.css" media="print" />
      
      {/* JSON-LD structured data for better SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'TechArticle',
            headline: 'Counsel Framework Documentation',
            description: 'Comprehensive guide to the Counsel Framework for AI-assisted development',
            author: {
              '@type': 'Organization',
              name: 'Counsel Framework Team',
            },
            publisher: {
              '@type': 'Organization',
              name: 'Counsel Framework',
              logo: {
                '@type': 'ImageObject',
                url: 'https://counsel-framework.dev/logo.png',
              },
            },
            datePublished: '2025-01-26',
            dateModified: '2025-01-26',
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': 'https://counsel-framework.dev/docs',
            },
            articleSection: 'Documentation',
            keywords: 'counsel framework, ai development, development workflow, cli tools',
          }),
        }}
      />
      {children}
    </>
  );
}