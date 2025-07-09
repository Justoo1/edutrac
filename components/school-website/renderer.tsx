"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  sortOrder?: number;
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
    const blockStyles = getBlockStyles(block);

    switch (block.blockType) {
      case 'section':
        return (
          <section key={block.id} style={blockStyles} className="w-full">
            {/* Sections are containers - content would be nested */}
          </section>
        );

      case 'container':
        return (
          <div key={block.id} style={blockStyles} className="container mx-auto px-4">
            {/* Containers are layout wrappers */}
          </div>
        );

      case 'columns':
        const columns = parseInt(block.styles?.columns || '2');
        const gap = block.styles?.gap || 'medium';
        const gapMap = { small: '1rem', medium: '2rem', large: '3rem' };
        
        return (
          <div 
            key={block.id} 
            style={{
              ...blockStyles,
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: gapMap[gap as keyof typeof gapMap] || '2rem'
            }}
          >
            {/* Column content would be nested */}
          </div>
        );

      case 'hero':
        return (
          <section 
            key={block.id} 
            style={{
              ...blockStyles,
              backgroundImage: block.content?.backgroundImage ? `url(${block.content.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }} 
            className="text-white py-20 px-8 text-center"
          >
            {!block.content?.backgroundImage && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"></div>
            )}
            <div className="relative z-10 container mx-auto">
              <h1 className="text-5xl font-bold mb-6">
                {block.content?.title || `Welcome to ${siteName}`}
              </h1>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                {block.content?.subtitle || tagline || "Providing quality education for tomorrow's leaders"}
              </p>
              {block.content?.buttonText && (
                <Button 
                  size="lg" 
                  variant="secondary"
                  style={{ backgroundColor: block.styles?.buttonColor }}
                  onClick={() => block.content?.buttonLink && window.open(block.content.buttonLink, '_blank')}
                >
                  {block.content.buttonText}
                </Button>
              )}
            </div>
          </section>
        );
        
      case 'text':
        return (
          <section key={block.id} className="py-8">
            <div className="container mx-auto px-4">
              <div 
                style={{
                  ...blockStyles,
                  fontSize: block.styles?.fontSize === 'small' ? '0.875rem' :
                           block.styles?.fontSize === 'large' ? '1.25rem' :
                           block.styles?.fontSize === 'extra-large' ? '1.5rem' : '1rem'
                }}
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: block.content?.html || "" }}
              />
            </div>
          </section>
        );
        
      case 'image':
        const imageSize = block.styles?.imageSize || 'auto';
        const imageSizeMap = {
          small: { maxWidth: '300px' },
          medium: { maxWidth: '500px' },
          large: { maxWidth: '700px' },
          full: { width: '100%' },
          auto: { maxWidth: '100%', height: 'auto' }
        };
        
        const alignment = block.styles?.alignment || 'center';
        const alignmentMap = {
          left: { textAlign: 'left' as const },
          center: { textAlign: 'center' as const },
          right: { textAlign: 'right' as const }
        };

        const borderRadius = block.styles?.borderRadius || 'none';
        const borderRadiusMap = {
          none: '0',
          small: '0.25rem',
          medium: '0.5rem',
          large: '1rem',
          full: '50%'
        };

        const shadow = block.styles?.shadow || 'none';
        const shadowMap = {
          none: 'none',
          small: '0 1px 3px rgba(0,0,0,0.12)',
          medium: '0 4px 6px rgba(0,0,0,0.1)',
          large: '0 10px 15px rgba(0,0,0,0.1)'
        };

        return (
          <section key={block.id} className="py-8">
            <div className="container mx-auto px-4">
              <div style={{...blockStyles, ...alignmentMap[alignment as keyof typeof alignmentMap]}}>
                {block.content?.src ? (
                  <div>
                    {block.content?.link ? (
                      <a href={block.content.link} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={block.content.src}
                          alt={block.content?.alt || ""}
                          style={{
                            ...imageSizeMap[imageSize as keyof typeof imageSizeMap],
                            borderRadius: borderRadiusMap[borderRadius as keyof typeof borderRadiusMap],
                            boxShadow: shadowMap[shadow as keyof typeof shadowMap],
                            display: alignment === 'center' ? 'block' : 'inline-block',
                            margin: alignment === 'center' ? '0 auto' : undefined
                          }}
                        />
                      </a>
                    ) : (
                      <img 
                        src={block.content.src}
                        alt={block.content?.alt || ""}
                        style={{
                          ...imageSizeMap[imageSize as keyof typeof imageSizeMap],
                          borderRadius: borderRadiusMap[borderRadius as keyof typeof borderRadiusMap],
                          boxShadow: shadowMap[shadow as keyof typeof shadowMap],
                          display: alignment === 'center' ? 'block' : 'inline-block',
                          margin: alignment === 'center' ? '0 auto' : undefined
                        }}
                      />
                    )}
                    {block.content?.caption && (
                      <p className="text-sm text-gray-600 mt-2">{block.content.caption}</p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        );

      case 'gallery':
        const galleryColumns = parseInt(block.styles?.columns || '3');
        const galleryGap = block.styles?.gap || 'medium';
        const galleryGapMap = { small: '0.5rem', medium: '1rem', large: '1.5rem' };
        const aspectRatio = block.styles?.aspectRatio || 'auto';
        
        const aspectRatioStyles = {
          auto: {},
          square: { aspectRatio: '1 / 1', objectFit: 'cover' as const },
          landscape: { aspectRatio: '16 / 9', objectFit: 'cover' as const },
          portrait: { aspectRatio: '3 / 4', objectFit: 'cover' as const }
        };

        return (
          <section key={block.id} className="py-8">
            <div className="container mx-auto px-4">
              <div style={blockStyles}>
                {block.content?.title && (
                  <h3 className="text-2xl font-bold mb-6 text-center">{block.content.title}</h3>
                )}
                {block.content?.images && block.content.images.length > 0 && (
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${galleryColumns}, 1fr)`,
                      gap: galleryGapMap[galleryGap as keyof typeof galleryGapMap] || '1rem'
                    }}
                  >
                    {block.content.images.map((imageUrl: string, index: number) => (
                      <div key={index} className="overflow-hidden rounded-lg">
                        <img 
                          src={imageUrl} 
                          alt={`Gallery image ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            ...aspectRatioStyles[aspectRatio as keyof typeof aspectRatioStyles]
                          }}
                          className="transition-transform hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        );

      case 'video':
        const videoSize = block.styles?.videoSize || 'medium';
        const videoSizeMap = {
          small: { maxWidth: '400px' },
          medium: { maxWidth: '600px' },
          large: { maxWidth: '800px' },
          full: { width: '100%' }
        };
        
        const videoAlignment = block.styles?.alignment || 'center';
        const videoAlignmentMap = {
          left: { textAlign: 'left' as const },
          center: { textAlign: 'center' as const },
          right: { textAlign: 'right' as const }
        };

        const getEmbedUrl = (url: string) => {
          if (url.includes('youtube.com/watch')) {
            const videoId = url.split('v=')[1]?.split('&')[0];
            return `https://www.youtube.com/embed/${videoId}`;
          } else if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1]?.split('?')[0];
            return `https://www.youtube.com/embed/${videoId}`;
          } else if (url.includes('vimeo.com/')) {
            const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
            return `https://player.vimeo.com/video/${videoId}`;
          }
          return url;
        };

        return (
          <section key={block.id} className="py-8">
            <div className="container mx-auto px-4">
              <div style={{...blockStyles, ...videoAlignmentMap[videoAlignment as keyof typeof videoAlignmentMap]}}>
                {block.content?.title && (
                  <h3 className="text-2xl font-bold mb-4">{block.content.title}</h3>
                )}
                {block.content?.videoUrl && (
                  <div style={videoSizeMap[videoSize as keyof typeof videoSizeMap]}>
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        src={getEmbedUrl(block.content.videoUrl)}
                        className="absolute inset-0 w-full h-full rounded-lg"
                        allowFullScreen
                        title={block.content?.title || 'Video'}
                      />
                    </div>
                  </div>
                )}
                {block.content?.description && (
                  <p className="text-gray-600 mt-4">{block.content.description}</p>
                )}
              </div>
            </div>
          </section>
        );
        
      case 'contact':
        const formWidth = block.styles?.formWidth || 'medium';
        const formWidthMap = {
          small: { maxWidth: '400px' },
          medium: { maxWidth: '600px' },
          large: { maxWidth: '800px' },
          full: { width: '100%' }
        };

        return (
          <section key={block.id} className="py-8">
            <div className="container mx-auto px-4">
              <div style={blockStyles}>
                <div style={{...formWidthMap[formWidth as keyof typeof formWidthMap], margin: '0 auto'}}>
                  <Card>
                    <CardHeader>
                      <CardTitle>{block.content?.title || "Contact Us"}</CardTitle>
                      {block.content?.subtitle && (
                        <p className="text-gray-600">{block.content.subtitle}</p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <form className="space-y-4">
                        {(!block.content?.fields || block.content.fields.name !== false) && (
                          <div className="grid grid-cols-2 gap-4">
                            <Input placeholder="First Name" />
                            <Input placeholder="Last Name" />
                          </div>
                        )}
                        {(!block.content?.fields || block.content.fields.email !== false) && (
                          <Input placeholder="Email" type="email" />
                        )}
                        {block.content?.fields?.phone && (
                          <Input placeholder="Phone" type="tel" />
                        )}
                        {(!block.content?.fields || block.content.fields.subject !== false) && (
                          <Input placeholder="Subject" />
                        )}
                        {(!block.content?.fields || block.content.fields.message !== false) && (
                          <Textarea placeholder="Message" rows={4} />
                        )}
                        <Button 
                          type="submit" 
                          style={{ backgroundColor: block.styles?.buttonColor }}
                          className="w-full"
                        >
                          {block.content?.submitText || "Send Message"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>
        );

      case 'stats':
        const statsColumns = parseInt(block.styles?.columns || '4');
        return (
          <section key={block.id} className="py-8">
            <div className="container mx-auto px-4">
              <div style={blockStyles}>
                {block.content?.stats && block.content.stats.length > 0 && (
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${statsColumns}, 1fr)`,
                      gap: '2rem'
                    }}
                  >
                    {block.content.stats.map((stat: any, index: number) => (
                      <div key={index} className="text-center">
                        <div 
                          className="text-4xl font-bold mb-2"
                          style={{ color: block.styles?.numberColor }}
                        >
                          {stat.number}
                        </div>
                        <div 
                          className="text-lg"
                          style={{ color: block.styles?.labelColor }}
                        >
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        );

      case 'testimonials':
        const testimonialColumns = parseInt(block.styles?.columns || '2');
        return (
          <section key={block.id} className="py-8">
            <div className="container mx-auto px-4">
              <div style={blockStyles}>
                {block.content?.title && (
                  <h2 className="text-3xl font-bold text-center mb-8">{block.content.title}</h2>
                )}
                {block.content?.testimonials && block.content.testimonials.length > 0 && (
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${testimonialColumns}, 1fr)`,
                      gap: '2rem'
                    }}
                  >
                    {block.content.testimonials.map((testimonial: any, index: number) => (
                      <Card key={index} style={{ backgroundColor: block.styles?.cardBackground }}>
                        <CardContent className="p-6">
                          <p className="text-lg mb-4 italic">&quot;{testimonial.text}&quot;</p>
                          <div className="flex items-center gap-3">
                            {testimonial.image && (
                              <img 
                                src={testimonial.image} 
                                alt={testimonial.author}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <p className="font-semibold">{testimonial.author}</p>
                              <p className="text-sm text-gray-600">{testimonial.role}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        );

      case 'team':
        const teamColumns = parseInt(block.styles?.columns || '3');
        return (
          <section key={block.id} className="py-8">
            <div className="container mx-auto px-4">
              <div style={blockStyles}>
                {block.content?.title && (
                  <h2 className="text-3xl font-bold text-center mb-8">{block.content.title}</h2>
                )}
                {block.content?.members && block.content.members.length > 0 && (
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${teamColumns}, 1fr)`,
                      gap: '2rem'
                    }}
                  >
                    {block.content.members.map((member: any, index: number) => (
                      <Card key={index} style={{ backgroundColor: block.styles?.cardBackground }}>
                        <CardContent className="p-6 text-center">
                          {member.image && (
                            <img 
                              src={member.image} 
                              alt={member.name}
                              className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
                            />
                          )}
                          <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                          <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                          <p className="text-gray-600 text-sm mb-3">{member.bio}</p>
                          {member.email && (
                            <a 
                              href={`mailto:${member.email}`}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              {member.email}
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        );

      case 'announcement':
        return (
          <section key={block.id} className="py-8">
            <div className="container mx-auto px-4">
              <div style={blockStyles}>
                {block.content?.title && (
                  <h2 className="text-3xl font-bold text-center mb-8">{block.content.title}</h2>
                )}
                <div className="text-center text-gray-500 py-8">
                  <p>Announcements will be populated from your school&apos;s announcement system</p>
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