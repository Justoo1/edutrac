"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  X, 
  ExternalLink, 
  Smartphone,
  Tablet,
  Monitor,
  Eye
} from "lucide-react";

interface Block {
  id: string;
  type: string;
  content: any;
  styles: any;
  sortOrder: number;
}

interface WebsitePreviewProps {
  blocks: Block[];
  isOpen: boolean;
  onClose: () => void;
  pageTitle?: string;
}

const PreviewBlockRenderer = ({ block }: { block: Block }) => {
  const getBlockStyles = (block: Block) => {
    const styles: React.CSSProperties = {};
    
    // Apply common styling
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

  const renderBlockContent = () => {
    const blockStyles = getBlockStyles(block);
    
    switch (block.type) {
      case 'section':
        return (
          <section style={blockStyles} className="w-full">
            {/* In preview, sections are invisible containers */}
          </section>
        );

      case 'container':
        return (
          <div style={blockStyles} className="container mx-auto px-4">
            {/* In preview, containers are invisible containers */}
          </div>
        );

      case 'columns':
        const columns = parseInt(block.styles?.columns || '2');
        const gap = block.styles?.gap || 'medium';
        const gapMap = { small: '1rem', medium: '2rem', large: '3rem' };
        
        return (
          <div style={{
            ...blockStyles, 
            display: 'grid', 
            gridTemplateColumns: `repeat(${columns}, 1fr)`, 
            gap: gapMap[gap as keyof typeof gapMap] || '2rem'
          }}>
            {/* In preview, columns are invisible containers */}
          </div>
        );

      case 'hero':
        return (
          <div style={{
            ...blockStyles,
            backgroundImage: block.content?.backgroundImage ? `url(${block.content.backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
          }} className="text-white py-20 px-8 text-center">
            {!block.content?.backgroundImage && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"></div>
            )}
            <div className="relative z-10">
              <h1 className="text-5xl font-bold mb-6">
                {block.content?.title || "Welcome to Our School"}
              </h1>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                {block.content?.subtitle || "Providing quality education since 1990"}
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                style={{ backgroundColor: block.styles?.buttonColor }}
                onClick={() => block.content?.buttonLink && window.open(block.content.buttonLink, '_blank')}
              >
                {block.content?.buttonText || "Learn More"}
              </Button>
            </div>
          </div>
        );

      case 'text':
        return (
          <div style={blockStyles} className="prose max-w-none">
            <div 
              style={{
                fontSize: block.styles?.fontSize === 'small' ? '0.875rem' :
                         block.styles?.fontSize === 'large' ? '1.25rem' :
                         block.styles?.fontSize === 'extra-large' ? '1.5rem' : '1rem'
              }}
              dangerouslySetInnerHTML={{ 
                __html: block.content?.html || "<p>Add your text content here...</p>" 
              }} 
            />
          </div>
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
          <div style={{...blockStyles, ...alignmentMap[alignment as keyof typeof alignmentMap]}}>
            {block.content?.src ? (
              <div>
                {block.content?.link ? (
                  <a href={block.content.link} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={block.content.src} 
                      alt={block.content.alt || ""} 
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
                    alt={block.content.alt || ""} 
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
            ) : (
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-8 text-center text-gray-500">
                <p>No image configured</p>
              </div>
            )}
          </div>
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
          <div style={blockStyles}>
            {block.content?.title && (
              <h3 className="text-2xl font-bold mb-6 text-center">{block.content.title}</h3>
            )}
            {block.content?.images && block.content.images.length > 0 ? (
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
            ) : (
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-8 text-center text-gray-500">
                <p>No gallery images configured</p>
              </div>
            )}
          </div>
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
          <div style={{...blockStyles, ...videoAlignmentMap[videoAlignment as keyof typeof videoAlignmentMap]}}>
            {block.content?.title && (
              <h3 className="text-2xl font-bold mb-4">{block.content.title}</h3>
            )}
            {block.content?.videoUrl ? (
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
            ) : (
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-8 text-center text-gray-500">
                <p>No video configured</p>
              </div>
            )}
            {block.content?.description && (
              <p className="text-gray-600 mt-4">{block.content.description}</p>
            )}
          </div>
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
                    style={{ backgroundColor: block.styles?.buttonColor }}
                    className="w-full"
                  >
                    {block.content?.submitText || "Send Message"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'stats':
        const statsColumns = parseInt(block.styles?.columns || '4');
        return (
          <div style={blockStyles}>
            {block.content?.stats && block.content.stats.length > 0 ? (
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
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No statistics configured</p>
              </div>
            )}
          </div>
        );

      case 'testimonials':
        const testimonialColumns = parseInt(block.styles?.columns || '2');
        return (
          <div style={blockStyles}>
            {block.content?.title && (
              <h2 className="text-3xl font-bold text-center mb-8">{block.content.title}</h2>
            )}
            {block.content?.testimonials && block.content.testimonials.length > 0 ? (
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
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No testimonials configured</p>
              </div>
            )}
          </div>
        );

      case 'team':
        const teamColumns = parseInt(block.styles?.columns || '3');
        return (
          <div style={blockStyles}>
            {block.content?.title && (
              <h2 className="text-3xl font-bold text-center mb-8">{block.content.title}</h2>
            )}
            {block.content?.members && block.content.members.length > 0 ? (
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
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No team members configured</p>
              </div>
            )}
          </div>
        );

      case 'announcement':
        return (
          <div style={blockStyles}>
            {block.content?.title && (
              <h2 className="text-3xl font-bold text-center mb-8">{block.content.title}</h2>
            )}
            <div className="text-center text-gray-500 py-8">
              <p>Announcements will be populated from your school&pos;s announcement system</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <>{renderBlockContent()}</>;
};

export function WebsitePreview({ blocks, isOpen, onClose, pageTitle }: WebsitePreviewProps) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  const getViewportHeight = () => {
    switch (viewport) {
      case 'mobile': return '667px';
      case 'tablet': return '1024px';
      default: return '100vh';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-full flex flex-col">
        {/* Preview Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview: {pageTitle || 'Untitled Page'}
            </h2>
            
            {/* Viewport Controls */}
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 border">
              <Button
                variant={viewport === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewport('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={viewport === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewport('tablet')}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={viewport === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewport('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6">
          <div 
            className="mx-auto bg-white shadow-lg transition-all duration-200 overflow-auto"
            style={{ 
              width: getViewportWidth(), 
              height: viewport !== 'desktop' ? getViewportHeight() : 'auto',
              minHeight: viewport === 'desktop' ? '100vh' : 'auto'
            }}
          >
            {blocks.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Content to Preview</h3>
                  <p>Add some blocks to see the preview</p>
                </div>
              </div>
            ) : (
              <div>
                {blocks
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((block) => (
                    <PreviewBlockRenderer key={block.id} block={block} />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}