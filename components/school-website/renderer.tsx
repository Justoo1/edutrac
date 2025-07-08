"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

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

interface Block {
  id: string;
  blockType: string;
  content: any;
  styles?: any;
}

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

  const renderBlock = (block: Block) => {
    switch (block.blockType) {
      case 'hero':
        return (
          <section key={block.id} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-5xl font-bold mb-6">
                {block.content?.title || `Welcome to ${siteName}`}
              </h1>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                {block.content?.subtitle || tagline || "Providing quality education for tomorrow's leaders"}
              </p>
              {block.content?.buttonText && (
                <Button size="lg" variant="secondary">
                  {block.content.buttonText}
                </Button>
              )}
            </div>
          </section>
        );
        
      case 'text':
        return (
          <section key={block.id} className="py-16">
            <div className="container mx-auto px-4">
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: block.content?.html || "" }}
              />
            </div>
          </section>
        );
        
      case 'image':
        return (
          <section key={block.id} className="py-16">
            <div className="container mx-auto px-4 text-center">
              {block.content?.src && (
                <img 
                  src={block.content.src}
                  alt={block.content?.alt || ""}
                  className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                />
              )}
              {block.content?.caption && (
                <p className="text-gray-600 mt-4">{block.content.caption}</p>
              )}
            </div>
          </section>
        );
        
      case 'contact':
        return (
          <section key={block.id} className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-8">
                  {block.content?.title || "Contact Us"}
                </h2>
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <form className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="First Name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Subject"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <textarea
                      placeholder="Message"
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    ></textarea>
                    <Button type="submit" className="w-full">
                      {block.content?.submitText || "Send Message"}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        );
        
      default:
        return (
          <section key={block.id} className="py-8">
            <div className="container mx-auto px-4">
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-600">Unsupported block type: {block.blockType}</p>
              </div>
            </div>
          </section>
        );
    }
  };

  const navigationPages = pages.filter(page => page.showInNavigation);

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
        {currentPage?.blocks && currentPage.blocks.length > 0 ? (
          currentPage.blocks.map(renderBlock)
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
