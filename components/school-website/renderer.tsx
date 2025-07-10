"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Target, 
  Eye, 
  Award, 
  BookOpen,
  Users,
  Zap
} from "lucide-react";
import { Block, BlockRenderer } from "../website-editor/blocks";

interface School {
  id: string;
  name: string;
   description?: string | null; 
  logo?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null; 
}

interface WebsitePage {
  id: string;
  title: string;
  slug: string;
  content?: any;
  blocks?: Block[];
  isHomePage: boolean | null;
  showInNavigation: boolean | null; 
}

// interface Block {
//   id: string;
//   blockType: string;
//   content: any;
//   styles?: any;
//   sortOrder?: number;
// }

interface WebsiteConfig {
  siteName?: string | null;
  tagline?: string | null;
  headerConfig?: any;
  footerConfig?: any;
  navigationMenu?: any;
  socialMedia?: any;
  contactInfo?: any;
  theme?: any;
}

interface SchoolWebsiteRendererProps {
  school: School;
  pages: WebsitePage[];
  currentPage?: WebsitePage;
  config?: WebsiteConfig;
}

export function SchoolWebsiteRenderer({ 
  school, 
  pages, 
  currentPage, 
  config 
}: SchoolWebsiteRendererProps) {
  const siteName = config?.siteName || school.name;
  const tagline = config?.tagline;

  const getBlockStyles = (block: Block) => {
    const styles: React.CSSProperties = {};
    
    // Apply common styling from the editor
    if (block.styles?.backgroundColor) {
      styles.backgroundColor = block.styles.backgroundColor;
    }
    if (block.styles?.textColor) {
      styles.color = block.styles.textColor;
    }
    if (block.styles?.padding) {
      const paddingMap = {
        small: '1rem',
        medium: '2rem',
        large: '3rem',
        'extra-large': '4rem'
      };
      styles.padding = paddingMap[block.styles.padding as keyof typeof paddingMap] || '2rem';
    }
    if (block.styles?.textAlign) {
      styles.textAlign = block.styles.textAlign;
    }
    if (block.styles?.maxWidth) {
      const maxWidthMap = {
        small: '600px',
        medium: '800px',
        large: '1000px',
        full: '100%'
      };
      styles.maxWidth = maxWidthMap[block.styles.maxWidth as keyof typeof maxWidthMap] || '100%';
      if (block.styles.maxWidth !== 'full') {
        styles.marginLeft = 'auto';
        styles.marginRight = 'auto';
      }
    }
    
    return styles;
  };

  const renderBlock = (block: Block) => {
    return <BlockRenderer key={block.id} block={block} />
  };

  const navigationPages = pages.filter(page => page.showInNavigation);

  // Sort blocks by sortOrder if available
  const sortedBlocks = currentPage?.blocks ? 
    [...currentPage.blocks].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) : 
    [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo and Site Name */}
            <div className="flex items-center space-x-3">
              {school.logo && (
                <img 
                  src={school.logo} 
                  alt={`${school.name} logo`}
                  className="h-10 w-auto"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{siteName}</h1>
                {tagline && (
                  <p className="text-sm text-gray-600">{tagline}</p>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigationPages.map((page) => (
                <a
                  key={page.id}
                  href={page.slug === "/" ? "/" : `?page=${page.slug}`}
                  className={`text-gray-700 hover:text-blue-600 transition-colors ${
                    currentPage?.id === page.id ? "text-blue-600 font-medium" : ""
                  }`}
                >
                  {page.title}
                </a>
              ))}
            </nav>

            {/* Mobile menu button */}
            <button className="md:hidden p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {sortedBlocks.length > 0 ? (
          sortedBlocks.map(renderBlock)
        ) : (
          // Default content if no blocks
          <section className="py-20">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-6">
                Welcome to {siteName}
              </h1>
              {tagline && (
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  {tagline}
                </p>
              )}
              {school.description && (
                <p className="text-gray-600 max-w-3xl mx-auto">
                  {school.description}
                </p>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* School Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{siteName}</h3>
              {school.description && (
                <p className="text-gray-300 mb-4">{school.description}</p>
              )}
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="space-y-2 text-gray-300">
                {school.address && (
                  <p className="flex items-start">
                    <span className="font-medium">Address:</span>
                    <span className="ml-2">{school.address}</span>
                  </p>
                )}
                {school.phone && (
                  <p className="flex items-center">
                    <span className="font-medium">Phone:</span>
                    <span className="ml-2">{school.phone}</span>
                  </p>
                )}
                {school.email && (
                  <p className="flex items-center">
                    <span className="font-medium">Email:</span>
                    <span className="ml-2">{school.email}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {navigationPages.slice(0, 5).map((page) => (
                  <li key={page.id}>
                    <a
                      href={page.slug === "/" ? "/" : `?page=${page.slug}`}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      {page.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              {config?.footerConfig?.copyrightText || 
                `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`
              }
            </p>
            <p className="mt-2 text-sm">
              Powered by EduTrac
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
