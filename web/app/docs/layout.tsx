import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Woolly Framework Documentation",
  description: "Comprehensive guide to the Woolly Framework for AI-assisted development. Learn about features, CLI commands, integrations, and best practices.",
  keywords: [
    "woolly framework",
    "ai development",
    "development workflow",
    "cli tools",
    "chromadb",
    "linear integration",
    "git integration",
    "documentation",
    "developer tools"
  ],
  authors: [{ name: "Woolly Framework Team" }],
  creator: "Woolly Framework",
  publisher: "Woolly Framework",
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
    url: 'https://woolly-framework.dev/docs',
    title: 'Woolly Framework Documentation',
    description: 'Comprehensive guide to the Woolly Framework for AI-assisted development',
    siteName: 'Woolly Framework',
    images: [
      {
        url: '/og-docs.png',
        width: 1200,
        height: 630,
        alt: 'Woolly Framework Documentation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Woolly Framework Documentation',
    description: 'Comprehensive guide to the Woolly Framework for AI-assisted development',
    images: ['/og-docs.png'],
    creator: '@counsel_framework',
  },
  alternates: {
    canonical: 'https://woolly-framework.dev/docs',
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
            headline: 'Woolly Framework Documentation',
            description: 'Comprehensive guide to the Woolly Framework for AI-assisted development',
            author: {
              '@type': 'Organization',
              name: 'Woolly Framework Team',
            },
            publisher: {
              '@type': 'Organization',
              name: 'Woolly Framework',
              logo: {
                '@type': 'ImageObject',
                url: 'https://woolly-framework.dev/logo.png',
              },
            },
            datePublished: '2025-01-26',
            dateModified: '2025-01-26',
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': 'https://woolly-framework.dev/docs',
            },
            articleSection: 'Documentation',
            keywords: 'woolly framework, ai development, development workflow, cli tools',
          }),
        }}
      />
      {children}
    </>
  );
}