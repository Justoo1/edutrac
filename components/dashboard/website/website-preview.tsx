"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Monitor, Tablet, Smartphone } from 'lucide-react';
import { Block, BlockRenderer } from '@/components/website-editor/blocks';


interface WebsitePreviewProps {
  blocks: Block[];
  isOpen: boolean;
  onClose: () => void;
  pageTitle: string;
  viewport?: 'desktop' | 'tablet' | 'mobile';
  config?: any;
}

export function WebsitePreview({ 
  blocks, 
  isOpen, 
  onClose, 
  pageTitle,
  viewport = 'desktop',
  config 
}: WebsitePreviewProps) {
  const [currentViewport, setCurrentViewport] = React.useState(viewport);
  
  const siteName = config?.siteName || 'School Website';
  const tagline = config?.tagline;

  const getViewportWidth = () => {
    switch (currentViewport) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  const getBlockStyles = (block: Block) => {
    const styles: React.CSSProperties = {};
    
    if (block.styles?.backgroundColor) {
      styles.backgroundColor = block.styles.backgroundColor;
    }
    if (block.styles?.textColor) {
      styles.color = block.styles.textColor;
    }
    if (block.styles?.padding) {
      const paddingMap = {
        none: '0',
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
    if (block.isVisible === false) return null;

    return <BlockRenderer key={block.id} block={block} />
  };

  const sortedBlocks = [...blocks].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full h-full p-0 m-0 overflow-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <DialogHeader>
                <DialogTitle>Preview: {pageTitle}</DialogTitle>
              </DialogHeader>
              
              {/* Viewport Controls */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={currentViewport === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentViewport('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={currentViewport === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentViewport('tablet')}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={currentViewport === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentViewport('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-auto bg-gray-100 p-4">
            <div 
              className="mx-auto bg-white shadow-lg transition-all duration-200 min-h-full"
              style={{ width: getViewportWidth() }}
            >
              {/* Header */}
              <header className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4">
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded"></div>
                      <div>
                        <h1 className="text-xl font-bold text-gray-900">{siteName}</h1>
                        {tagline && (
                          <p className="text-sm text-gray-600">{tagline}</p>
                        )}
                      </div>
                    </div>
                    <nav className="hidden md:flex space-x-8">
                      <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Home</a>
                      <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">About</a>
                      <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Programs</a>
                      <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Contact</a>
                    </nav>
                  </div>
                </div>
              </header>

              {/* Main Content */}
              <main>
                {sortedBlocks.length > 0 ? (
                  sortedBlocks.map(renderBlock)
                ) : (
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
                      <p className="text-gray-600 max-w-3xl mx-auto">
                        Start adding blocks to create your website content.
                      </p>
                    </div>
                  </section>
                )}
              </main>

              {/* Footer */}
              <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">{siteName}</h3>
                      <p className="text-gray-300">
                        Quality education for tomorrow&apos;s leaders
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Contact</h3>
                      <div className="space-y-2 text-gray-300">
                        <p>Email: info@school.edu</p>
                        <p>Phone: +233 XX XXX XXXX</p>
                        <p>Address: School Address</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                      <ul className="space-y-2">
                        <li><a href="#" className="text-gray-300 hover:text-white">Home</a></li>
                        <li><a href="#" className="text-gray-300 hover:text-white">About</a></li>
                        <li><a href="#" className="text-gray-300 hover:text-white">Programs</a></li>
                        <li><a href="#" className="text-gray-300 hover:text-white">Contact</a></li>
                      </ul>
                    </div>
                  </div>
                  <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                    <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
                    <p className="mt-2 text-sm">Powered by EduTrac</p>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
