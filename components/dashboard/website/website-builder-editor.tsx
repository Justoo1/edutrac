"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Save, 
  Eye, 
  Undo, 
  Redo, 
  Plus, 
  Trash2, 
  Settings, 
  Type, 
  Image, 
  Video, 
  Layout,
  MousePointer,
  Smartphone,
  Tablet,
  Monitor,
  Copy,
  ArrowUp,
  ArrowDown,
  Grid,
  Box,
  Upload,
  ExternalLink
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WebsitePreview } from './website-preview';
import { HexColorPicker } from "react-colorful";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

interface WebsiteBuilderEditorProps {
  schoolId: string;
  pageId?: string;
  userId: string;
}

interface Block {
  id: string;
  type: string;
  content: any;
  styles: any;
  sortOrder: number;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  blocks: Block[];
}

// Enhanced block types with layout options
const LAYOUT_TYPES = [
  { type: "section", label: "Section Container", icon: Box, description: "Full-width section container" },
  { type: "container", label: "Container", icon: Layout, description: "Centered content container" },
  { type: "columns", label: "Column Layout", icon: Grid, description: "Multi-column layout" },
  { type: "row", label: "Row Layout", icon: Layout, description: "Horizontal row layout" },
];

const CONTENT_BLOCKS = [
  { type: "hero", label: "Hero Section", icon: Layout, description: "Large banner with heading and CTA" },
  { type: "text", label: "Text Block", icon: Type, description: "Rich text content" },
  { type: "image", label: "Image", icon: Image, description: "Single image with caption" },
  { type: "gallery", label: "Image Gallery", icon: Image, description: "Multiple images in grid" },
  { type: "video", label: "Video", icon: Video, description: "Embedded video content" },
  { type: "contact", label: "Contact Form", icon: Type, description: "Contact form with fields" },
  { type: "stats", label: "Statistics", icon: Layout, description: "Number counters and stats" },
  { type: "testimonials", label: "Testimonials", icon: Type, description: "Customer testimonials" },
  { type: "team", label: "Team Section", icon: Layout, description: "Staff/team member cards" },
  { type: "announcement", label: "Announcements", icon: Type, description: "School announcements" },
];

const DraggableBlock = ({ blockType, onDrop, category }: { 
  blockType: typeof LAYOUT_TYPES[0] | typeof CONTENT_BLOCKS[0], 
  onDrop: (type: string) => void,
  category: string 
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'block',
    item: { blockType: blockType.type, category },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && dropResult) {
        onDrop(item.blockType);
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const Icon = blockType.icon;

  return (
    <div
      ref={drag}
      className={`p-3 border rounded-lg cursor-move hover:bg-gray-50 transition-colors ${
        isDragging ? 'opacity-50' : ''
      } ${category === 'layout' ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{blockType.label}</span>
      </div>
      <p className="text-xs text-muted-foreground">{blockType.description}</p>
    </div>
  );
};

const DroppableCanvas = ({ 
  blocks, 
  onAddBlock, 
  onSelectBlock, 
  selectedBlockId,
  onMoveBlock,
  onDeleteBlock 
}: {
  blocks: Block[];
  onAddBlock: (type: string) => void;
  onSelectBlock: (blockId: string) => void;
  selectedBlockId?: string;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onDeleteBlock: (blockId: string) => void;
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'block',
    drop: () => ({ name: 'canvas' }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`min-h-screen bg-white ${isOver ? 'bg-blue-50' : ''}`}
    >
      {blocks.length === 0 ? (
        <div className="flex items-center justify-center h-96 border-2 border-dashed border-gray-300 rounded-lg m-6">
          <div className="text-center">
            <Layout className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start Building Your Page</h3>
            <p className="text-gray-500 mb-4">Drag layout containers first, then add content blocks</p>
          </div>
        </div>
      ) : (
        <div>
          {blocks.map((block, index) => (
            <BlockRenderer 
              key={block.id} 
              block={block} 
              isSelected={selectedBlockId === block.id}
              onSelect={() => onSelectBlock(block.id)}
              onMoveUp={index > 0 ? () => onMoveBlock(block.id, 'up') : undefined}
              onMoveDown={index < blocks.length - 1 ? () => onMoveBlock(block.id, 'down') : undefined}
              onDelete={() => onDeleteBlock(block.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const BlockRenderer = ({ 
  block, 
  isSelected, 
  onSelect, 
  onMoveUp, 
  onMoveDown, 
  onDelete 
}: {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
}) => {
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
            <div className="border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
              <Box className="h-8 w-8 mx-auto mb-2" />
              <p>Section Container</p>
              <p className="text-sm">Add content blocks inside this section</p>
            </div>
          </section>
        );

      case 'container':
        return (
          <div style={blockStyles} className="container mx-auto px-4">
            <div className="border-2 border-dashed border-gray-300 p-6 text-center text-gray-500">
              <Layout className="h-6 w-6 mx-auto mb-2" />
              <p>Content Container</p>
            </div>
          </div>
        );

      case 'columns':
        const columns = parseInt(block.styles?.columns || '2');
        const gap = block.styles?.gap || 'medium';
        const gapMap = { small: '1rem', medium: '2rem', large: '3rem' };
        
        return (
          <div style={{...blockStyles, display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: gapMap[gap as keyof typeof gapMap] || '2rem'}}>
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="border-2 border-dashed border-gray-300 p-4 text-center text-gray-500 min-h-32">
                <Grid className="h-6 w-6 mx-auto mb-2" />
                <p>Column {i + 1}</p>
              </div>
            ))}
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
              <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Add image URL</p>
                </div>
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
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Add image URLs to create gallery</p>
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
              <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Add video URL</p>
                </div>
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
                <p>Add statistics in the properties panel</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div style={blockStyles} className="p-6 bg-gray-100 rounded-lg text-center">
            <p className="text-gray-600">Block type: {block.type}</p>
            <p className="text-sm text-gray-500">Configure this block in the sidebar</p>
          </div>
        );
    }
  };

  return (
    <div
      className={`relative group ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={onSelect}
    >
      {renderBlockContent()}
      
      {/* Block Controls */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1 bg-white rounded-lg shadow-lg border p-1">
          {onMoveUp && (
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
              <ArrowUp className="h-3 w-3" />
            </Button>
          )}
          {onMoveDown && (
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
              <ArrowDown className="h-3 w-3" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); /* copy block */ }}>
            <Copy className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (color: string) => void }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <div className="flex items-center gap-2">
      <div 
        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
        style={{ backgroundColor: value || '#000000' }}
        onClick={() => {/* You can implement a popover here */}}
      />
      <Input
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        className="flex-1"
      />
    </div>
  </div>
);

const GridLayoutSelector = ({ value, onChange }: { value?: string; onChange: (layout: string) => void }) => (
 <div className="space-y-2">
   <Label>Columns</Label>
   <div className="grid grid-cols-2 gap-2">
     {[
       { value: '1', label: '1 Column', icon: '▐' },
       { value: '2', label: '2 Columns', icon: '▐▐' },
       { value: '3', label: '3 Columns', icon: '▐▐▐' },
       { value: '4', label: '4 Columns', icon: '▐▐▐▐' }
     ].map((layout) => (
       <button
         key={layout.value}
         onClick={() => onChange(layout.value)}
         className={`p-3 border rounded text-xs flex flex-col items-center gap-1 transition-colors ${
           value === layout.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'
         }`}
       >
         <span className="text-lg font-mono">{layout.icon}</span>
         <span>{layout.label}</span>
       </button>
     ))}
   </div>
 </div>
);

const BlockPropertiesPanel = ({ 
  selectedBlock, 
  onUpdateBlock 
}: {
  selectedBlock?: Block;
  onUpdateBlock: (blockId: string, updates: Partial<Block>) => void;
}) => {
  if (!selectedBlock) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>Select a block to edit its properties</p>
      </div>
    );
  }

  const updateContent = (updates: any) => {
    onUpdateBlock(selectedBlock.id, {
      content: { ...selectedBlock.content, ...updates }
    });
  };

  const updateStyles = (updates: any) => {
    onUpdateBlock(selectedBlock.id, {
      styles: { ...selectedBlock.styles, ...updates }
    });
  };

  const renderPropertiesForm = () => {
      switch (selectedBlock.type) {
        case 'section':
        case 'container':
          return (
            <div className="space-y-4">
              <ColorPicker
                label="Background Color"
                value={selectedBlock.styles?.backgroundColor}
                onChange={(color) => updateStyles({ backgroundColor: color })}
              />
              <div>
                <Label>Padding</Label>
                <Select
                  value={selectedBlock.styles?.padding || 'medium'}
                  onValueChange={(value) => updateStyles({ padding: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="extra-large">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );

        case 'columns':
          return (
            <div className="space-y-4">
              <GridLayoutSelector
                value={selectedBlock.styles?.columns || '2'}
                onChange={(columns) => updateStyles({ columns })}
              />
              <div>
                <Label>Gap Between Columns</Label>
                <Select
                  value={selectedBlock.styles?.gap || 'medium'}
                  onValueChange={(value) => updateStyles({ gap: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ColorPicker
                label="Background Color"
                value={selectedBlock.styles?.backgroundColor}
                onChange={(color) => updateStyles({ backgroundColor: color })}
              />
            </div>
          );

        case 'hero':
          return (
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={selectedBlock.content?.title || ""}
                    onChange={(e) => updateContent({ title: e.target.value })}
                    placeholder="Enter hero title"
                  />
                </div>
                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Textarea
                    id="subtitle"
                    value={selectedBlock.content?.subtitle || ""}
                    onChange={(e) => updateContent({ subtitle: e.target.value })}
                    placeholder="Enter hero subtitle"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="buttonText">Button Text</Label>
                  <Input
                    id="buttonText"
                    value={selectedBlock.content?.buttonText || ""}
                    onChange={(e) => updateContent({ buttonText: e.target.value })}
                    placeholder="Learn More"
                  />
                </div>
                <div>
                  <Label htmlFor="buttonLink">Button Link</Label>
                  <Input
                    id="buttonLink"
                    value={selectedBlock.content?.buttonLink || ""}
                    onChange={(e) => updateContent({ buttonLink: e.target.value })}
                    placeholder="/about"
                  />
                </div>
                <div>
                  <Label htmlFor="backgroundImage">Background Image URL</Label>
                  <Input
                    id="backgroundImage"
                    value={selectedBlock.content?.backgroundImage || ""}
                    onChange={(e) => updateContent({ backgroundImage: e.target.value })}
                    placeholder="https://example.com/hero-bg.jpg"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="style" className="space-y-4">
                <ColorPicker
                  label="Background Color"
                  value={selectedBlock.styles?.backgroundColor}
                  onChange={(color) => updateStyles({ backgroundColor: color })}
                />
                <ColorPicker
                  label="Text Color"
                  value={selectedBlock.styles?.textColor}
                  onChange={(color) => updateStyles({ textColor: color })}
                />
                <ColorPicker
                  label="Button Color"
                  value={selectedBlock.styles?.buttonColor}
                  onChange={(color) => updateStyles({ buttonColor: color })}
                />
                <div>
                  <Label>Text Alignment</Label>
                  <Select
                    value={selectedBlock.styles?.textAlign || 'center'}
                    onValueChange={(value) => updateStyles({ textAlign: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Padding</Label>
                  <Select
                    value={selectedBlock.styles?.padding || 'large'}
                    onValueChange={(value) => updateStyles({ padding: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="extra-large">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          );

        case 'text':
          return (
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label htmlFor="content">Content (HTML supported)</Label>
                  <Textarea
                    id="content"
                    value={selectedBlock.content?.html || ""}
                    onChange={(e) => updateContent({ html: e.target.value })}
                    placeholder="Enter your text content... You can use HTML tags like <h2>, <p>, <strong>, etc."
                    rows={10}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="style" className="space-y-4">
                <ColorPicker
                  label="Text Color"
                  value={selectedBlock.styles?.textColor}
                  onChange={(color) => updateStyles({ textColor: color })}
                />
                <ColorPicker
                  label="Background Color"
                  value={selectedBlock.styles?.backgroundColor}
                  onChange={(color) => updateStyles({ backgroundColor: color })}
                />
                <div>
                  <Label>Font Size</Label>
                  <Select
                    value={selectedBlock.styles?.fontSize || 'medium'}
                    onValueChange={(value) => updateStyles({ fontSize: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="extra-large">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Text Alignment</Label>
                  <Select
                    value={selectedBlock.styles?.textAlign || 'left'}
                    onValueChange={(value) => updateStyles({ textAlign: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="justify">Justify</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Max Width</Label>
                  <Select
                    value={selectedBlock.styles?.maxWidth || 'full'}
                    onValueChange={(value) => updateStyles({ maxWidth: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (600px)</SelectItem>
                      <SelectItem value="medium">Medium (800px)</SelectItem>
                      <SelectItem value="large">Large (1000px)</SelectItem>
                      <SelectItem value="full">Full Width</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          );

        case 'image':
          return (
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label htmlFor="src">Image URL</Label>
                  <Input
                    id="src"
                    value={selectedBlock.content?.src || ""}
                    onChange={(e) => updateContent({ src: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a direct image URL (jpg, png, gif, webp)
                  </p>
                </div>
                <div>
                  <Label htmlFor="alt">Alt Text</Label>
                  <Input
                    id="alt"
                    value={selectedBlock.content?.alt || ""}
                    onChange={(e) => updateContent({ alt: e.target.value })}
                    placeholder="Describe the image for accessibility"
                  />
                </div>
                <div>
                  <Label htmlFor="caption">Caption</Label>
                  <Input
                    id="caption"
                    value={selectedBlock.content?.caption || ""}
                    onChange={(e) => updateContent({ caption: e.target.value })}
                    placeholder="Optional image caption"
                  />
                </div>
                <div>
                  <Label htmlFor="link">Image Link (optional)</Label>
                  <Input
                    id="link"
                    value={selectedBlock.content?.link || ""}
                    onChange={(e) => updateContent({ link: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="style" className="space-y-4">
                <div>
                  <Label>Image Size</Label>
                  <Select
                    value={selectedBlock.styles?.imageSize || 'auto'}
                    onValueChange={(value) => updateStyles({ imageSize: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="small">Small (300px)</SelectItem>
                      <SelectItem value="medium">Medium (500px)</SelectItem>
                      <SelectItem value="large">Large (700px)</SelectItem>
                      <SelectItem value="full">Full Width</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Alignment</Label>
                  <Select
                    value={selectedBlock.styles?.alignment || 'center'}
                    onValueChange={(value) => updateStyles({ alignment: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Border Radius</Label>
                  <Select
                    value={selectedBlock.styles?.borderRadius || 'none'}
                    onValueChange={(value) => updateStyles({ borderRadius: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="full">Full (Circle)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Shadow</Label>
                  <Select
                    value={selectedBlock.styles?.shadow || 'none'}
                    onValueChange={(value) => updateStyles({ shadow: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          );

        case 'gallery':
          return (
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label>Gallery Title</Label>
                  <Input
                    value={selectedBlock.content?.title || ""}
                    onChange={(e) => updateContent({ title: e.target.value })}
                    placeholder="Gallery Title"
                  />
                </div>
                <div>
                  <Label>Images (URLs, one per line)</Label>
                  <Textarea
                    value={selectedBlock.content?.images?.join('\n') || ''}
                    onChange={(e) => updateContent({ images: e.target.value.split('\n').filter(url => url.trim()) })}
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
                    rows={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter one image URL per line. Use direct image URLs (jpg, png, gif, webp)
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="style" className="space-y-4">
                <GridLayoutSelector
                  value={selectedBlock.styles?.columns || '3'}
                  onChange={(columns) => updateStyles({ columns })}
                />
                <div>
                  <Label>Gap Between Images</Label>
                  <Select
                    value={selectedBlock.styles?.gap || 'medium'}
                    onValueChange={(value) => updateStyles({ gap: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Image Aspect Ratio</Label>
                  <Select
                    value={selectedBlock.styles?.aspectRatio || 'auto'}
                    onValueChange={(value) => updateStyles({ aspectRatio: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="square">Square (1:1)</SelectItem>
                      <SelectItem value="landscape">Landscape (16:9)</SelectItem>
                      <SelectItem value="portrait">Portrait (3:4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          );

        case 'video':
          return (
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label htmlFor="videoUrl">Video URL (YouTube, Vimeo, or direct link)</Label>
                  <Input
                    id="videoUrl"
                    value={selectedBlock.content?.videoUrl || ""}
                    onChange={(e) => updateContent({ videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supports YouTube, Vimeo, and direct video file URLs
                  </p>
                </div>
                <div>
                  <Label htmlFor="title">Video Title</Label>
                  <Input
                    id="title"
                    value={selectedBlock.content?.title || ""}
                    onChange={(e) => updateContent({ title: e.target.value })}
                    placeholder="Video title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={selectedBlock.content?.description || ""}
                    onChange={(e) => updateContent({ description: e.target.value })}
                    placeholder="Video description"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoplay"
                    checked={selectedBlock.content?.autoplay || false}
                    onChange={(e) => updateContent({ autoplay: e.target.checked })}
                  />
                  <Label htmlFor="autoplay">Autoplay</Label>
                </div>
              </TabsContent>
              
              <TabsContent value="style" className="space-y-4">
                <div>
                  <Label>Video Size</Label>
                  <Select
                    value={selectedBlock.styles?.videoSize || 'medium'}
                    onValueChange={(value) => updateStyles({ videoSize: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="full">Full Width</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Alignment</Label>
                  <Select
                    value={selectedBlock.styles?.alignment || 'center'}
                    onValueChange={(value) => updateStyles({ alignment: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          );

        case 'contact':
          return (
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label htmlFor="formTitle">Form Title</Label>
                  <Input
                    id="formTitle"
                    value={selectedBlock.content?.title || ""}
                    onChange={(e) => updateContent({ title: e.target.value })}
                    placeholder="Contact Us"
                  />
                </div>
                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Textarea
                    id="subtitle"
                    value={selectedBlock.content?.subtitle || ""}
                    onChange={(e) => updateContent({ subtitle: e.target.value })}
                    placeholder="Get in touch with us"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="submitText">Submit Button Text</Label>
                  <Input
                    id="submitText"
                    value={selectedBlock.content?.submitText || ""}
                    onChange={(e) => updateContent({ submitText: e.target.value })}
                    placeholder="Send Message"
                  />
                </div>
                <div>
                  <Label htmlFor="successMessage">Success Message</Label>
                  <Input
                    id="successMessage"
                    value={selectedBlock.content?.successMessage || ""}
                    onChange={(e) => updateContent({ successMessage: e.target.value })}
                    placeholder="Thank you for your message!"
                  />
                </div>
                <div>
                  <Label>Form Fields</Label>
                  <div className="space-y-2">
                    {['Name', 'Email', 'Phone', 'Subject', 'Message'].map((field) => (
                      <div key={field} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={field.toLowerCase()}
                          checked={selectedBlock.content?.fields?.[field.toLowerCase()] !== false}
                          onChange={(e) => updateContent({ 
                            fields: { 
                              ...selectedBlock.content?.fields, 
                              [field.toLowerCase()]: e.target.checked 
                            }
                          })}
                        />
                        <Label htmlFor={field.toLowerCase()}>{field}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="style" className="space-y-4">
                <ColorPicker
                  label="Background Color"
                  value={selectedBlock.styles?.backgroundColor}
                  onChange={(color) => updateStyles({ backgroundColor: color })}
                />
                <ColorPicker
                  label="Button Color"
                  value={selectedBlock.styles?.buttonColor}
                  onChange={(color) => updateStyles({ buttonColor: color })}
                />
                <div>
                  <Label>Form Width</Label>
                  <Select
                    value={selectedBlock.styles?.formWidth || 'medium'}
                    onValueChange={(value) => updateStyles({ formWidth: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="full">Full Width</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          );

        case 'stats':
          return (
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label>Statistics (one per line: number|label)</Label>
                  <Textarea
                    value={selectedBlock.content?.stats?.map((stat: any) => `${stat.number}|${stat.label}`).join('\n') || ''}
                    onChange={(e) => {
                      const stats = e.target.value.split('\n').map(line => {
                        const [number, label] = line.split('|');
                        return { number: number?.trim(), label: label?.trim() };
                      }).filter(stat => stat.number && stat.label);
                      updateContent({ stats });
                    }}
                    placeholder="1000|Students&#10;50|Teachers&#10;25|Years of Excellence&#10;100|% Success Rate"
                    rows={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: number|label (e.g.,&quot;1000|Students&quot;)
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="style" className="space-y-4">
                <GridLayoutSelector
                  value={selectedBlock.styles?.columns || '4'}
                  onChange={(columns) => updateStyles({ columns })}
                />
                <ColorPicker
                  label="Number Color"
                  value={selectedBlock.styles?.numberColor}
                  onChange={(color) => updateStyles({ numberColor: color })}
                />
                <ColorPicker
                  label="Label Color"
                  value={selectedBlock.styles?.labelColor}
                  onChange={(color) => updateStyles({ labelColor: color })}
                />
                <ColorPicker
                  label="Background Color"
                  value={selectedBlock.styles?.backgroundColor}
                  onChange={(color) => updateStyles({ backgroundColor: color })}
                />
              </TabsContent>
            </Tabs>
          );

        case 'testimonials':
          return (
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label>Section Title</Label>
                  <Input
                    value={selectedBlock.content?.title || ""}
                    onChange={(e) => updateContent({ title: e.target.value })}
                    placeholder="What People Say About Us"
                  />
                </div>
                <div>
                  <Label>Testimonials (JSON format)</Label>
                  <Textarea
                    value={JSON.stringify(selectedBlock.content?.testimonials || [], null, 2)}
                    onChange={(e) => {
                      try {
                        const testimonials = JSON.parse(e.target.value);
                        updateContent({ testimonials });
                      } catch (error) {
                        // Invalid JSON, ignore
                      }
                    }}
                    placeholder='[&#10;  {&#10;    "text": "Great school with excellent teachers!",&#10;    "author": "John Doe",&#10;    "role": "Parent",&#10;    "image": "https://example.com/photo.jpg"&#10;  }&#10;]'
                    rows={8}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="style" className="space-y-4">
                <GridLayoutSelector
                  value={selectedBlock.styles?.columns || '2'}
                  onChange={(columns) => updateStyles({ columns })}
                />
                <ColorPicker
                  label="Background Color"
                  value={selectedBlock.styles?.backgroundColor}
                  onChange={(color) => updateStyles({ backgroundColor: color })}
                />
                <ColorPicker
                  label="Text Color"
                  value={selectedBlock.styles?.textColor}
                  onChange={(color) => updateStyles({ textColor: color })}
                />
              </TabsContent>
            </Tabs>
          );

        case 'team':
          return (
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label>Section Title</Label>
                  <Input
                    value={selectedBlock.content?.title || ""}
                    onChange={(e) => updateContent({ title: e.target.value })}
                    placeholder="Meet Our Team"
                  />
                </div>
                <div>
                  <Label>Team Members (JSON format)</Label>
                  <Textarea
                    value={JSON.stringify(selectedBlock.content?.members || [], null, 2)}
                    onChange={(e) => {
                      try {
                        const members = JSON.parse(e.target.value);
                        updateContent({ members });
                      } catch (error) {
                        // Invalid JSON, ignore
                      }
                    }}
                    placeholder='[&#10;  {&#10;    "name": "Dr. Jane Smith",&#10;    "role": "Headmaster",&#10;    "bio": "Experienced educator with 20 years in academia",&#10;    "image": "https://example.com/jane.jpg",&#10;    "email": "jane@school.com"&#10;  }&#10;]'
                    rows={8}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="style" className="space-y-4">
                <GridLayoutSelector
                  value={selectedBlock.styles?.columns || '3'}
                  onChange={(columns) => updateStyles({ columns })}
                />
                <ColorPicker
                  label="Background Color"
                  value={selectedBlock.styles?.backgroundColor}
                  onChange={(color) => updateStyles({ backgroundColor: color })}
                />
                <ColorPicker
                  label="Card Background"
                  value={selectedBlock.styles?.cardBackground}
                  onChange={(color) => updateStyles({ cardBackground: color })}
                />
              </TabsContent>
            </Tabs>
          );

        case 'announcement':
          return (
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label>Section Title</Label>
                  <Input
                    value={selectedBlock.content?.title || ""}
                    onChange={(e) => updateContent({ title: e.target.value })}
                    placeholder="Latest Announcements"
                  />
                </div>
                <div>
                  <Label>Number of Announcements to Show</Label>
                  <Select
                    value={selectedBlock.content?.count?.toString() || '3'}
                    onValueChange={(value) => updateContent({ count: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showDate"
                    checked={selectedBlock.content?.showDate !== false}
                    onChange={(e) => updateContent({ showDate: e.target.checked })}
                  />
                  <Label htmlFor="showDate">Show Date</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showExcerpt"
                    checked={selectedBlock.content?.showExcerpt !== false}
                    onChange={(e) => updateContent({ showExcerpt: e.target.checked })}
                  />
                  <Label htmlFor="showExcerpt">Show Excerpt</Label>
                </div>
              </TabsContent>
              
              <TabsContent value="style" className="space-y-4">
                <div>
                  <Label>Layout Style</Label>
                  <Select
                    value={selectedBlock.styles?.layout || 'list'}
                    onValueChange={(value) => updateStyles({ layout: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="list">List</SelectItem>
                      <SelectItem value="cards">Cards</SelectItem>
                      <SelectItem value="timeline">Timeline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ColorPicker
                  label="Background Color"
                  value={selectedBlock.styles?.backgroundColor}
                  onChange={(color) => updateStyles({ backgroundColor: color })}
                />
                <ColorPicker
                  label="Text Color"
                  value={selectedBlock.styles?.textColor}
                  onChange={(color) => updateStyles({ textColor: color })}
                />
              </TabsContent>
            </Tabs>
          );

        default:
          return (
            <div className="text-center text-gray-500 py-8">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No properties available for this block type</p>
              <p className="text-sm mt-2">This block type is not yet fully configured</p>
            </div>
          );
      }
    };

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{selectedBlock.type} Block</h3>
        <p className="text-sm text-gray-600">Configure the block properties</p>
      </div>
      <Separator className="mb-4" />
      {renderPropertiesForm()}
    </div>
  );
};

export function WebsiteBuilderEditor({ schoolId, pageId, userId }: WebsiteBuilderEditorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string>();
  const [showPreview, setShowPreview] = useState(false);
  const [page, setPage] = useState<Page>({
    id: pageId || 'new',
    title: 'New Page',
    slug: 'new-page',
    blocks: []
  });

  useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === 'p') {
      event.preventDefault();
      setShowPreview(true);
    }
    if (event.key === 'Escape' && showPreview) {
      setShowPreview(false);
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [showPreview]);

  // Add this useEffect after the state declarations
  useEffect(() => {
    const loadPage = async () => {
      if (pageId && pageId !== 'new') {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/website/pages/${pageId}`);
          if (response.ok) {
            const data = await response.json();
            const pageData = data.page;
            
            setPage({
              id: pageData.id,
              title: pageData.title,
              slug: pageData.slug,
              blocks: []
            });
            
            // Load blocks
            if (pageData.blocks && pageData.blocks.length > 0) {
              const loadedBlocks = pageData.blocks.map((block: any) => ({
                id: block.id,
                type: block.blockType,
                content: block.content,
                styles: block.styles,
                sortOrder: block.sortOrder
              }));
              setBlocks(loadedBlocks);
            }
          }
        } catch (error) {
          console.error('Failed to load page:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadPage();
  }, [pageId]);

  const selectedBlock = blocks.find(block => block.id === selectedBlockId);

  const addBlock = useCallback((type: string) => {
    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: {},
      styles: {},
      sortOrder: blocks.length
    };
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  }, [blocks.length]);

  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ));
  }, []);

  const moveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    setBlocks(prev => {
      const blockIndex = prev.findIndex(b => b.id === blockId);
      if (blockIndex === -1) return prev;
      
      const newBlocks = [...prev];
      const targetIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
      
      if (targetIndex >= 0 && targetIndex < newBlocks.length) {
        [newBlocks[blockIndex], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[blockIndex]];
        
        // Update sort orders
        newBlocks[blockIndex].sortOrder = blockIndex;
        newBlocks[targetIndex].sortOrder = targetIndex;
      }
      
      return newBlocks;
    });
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(undefined);
    }
  }, [selectedBlockId]);

  const savePage = async () => {
    setIsLoading(true);
    try {
      const pageData = {
        title: page.title,
        slug: page.slug,
        blocks: blocks,
        // Don't override publish status for existing pages
        ...(pageId === 'new' && { isPublished: false })
      };

      if (pageId && pageId !== 'new') {
        // Update existing page
        const response = await fetch(`/api/website/pages/${pageId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pageData),
        });

        if (!response.ok) {
          throw new Error('Failed to update page');
        }
      } else {
        // Create new page
        const response = await fetch('/api/website/pages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...pageData, isPublished: false }),
        });

        if (!response.ok) {
          throw new Error('Failed to create page');
        }

        const result = await response.json();
        setPage(prev => ({ ...prev, id: result.page.id }));
        window.history.replaceState({}, '', `/website/builder?page=${result.page.id}`);
      }

      console.log('Page saved successfully');
    } catch (error) {
      console.error('Failed to save page:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const previewPage = () => {
    // TODO: Open preview in new tab
    // window.open(`/preview/${page.id}`, '_blank');
    setShowPreview(true);
  };

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex overflow-hidden bg-gray-50">
        {/* Left Sidebar - Block Library */}
        <div className="w-80 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Block Library</h2>
            <p className="text-sm text-gray-600">Drag blocks to the canvas</p>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Layout Blocks Section */}
              <div>
                <h3 className="text-sm font-medium text-blue-700 mb-3 flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Layout Blocks
                </h3>
                <div className="space-y-2">
                  {LAYOUT_TYPES.map(blockType => (
                    <DraggableBlock 
                      key={blockType.type} 
                      blockType={blockType} 
                      onDrop={addBlock}
                      category="layout"
                    />
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Content Blocks Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Content Blocks
                </h3>
                <div className="space-y-2">
                  {CONTENT_BLOCKS.map(blockType => (
                    <DraggableBlock 
                      key={blockType.type} 
                      blockType={blockType} 
                      onDrop={addBlock}
                      category="content"
                    />
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Toolbar */}
          <div className="bg-white border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Input
                  value={page.title}
                  onChange={(e) => setPage(prev => ({ ...prev, title: e.target.value }))}
                  className="font-semibold"
                  placeholder="Page Title"
                />
                <div>
                  <Input
                    value={page.slug}
                    onChange={(e) => setPage(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-32"
                    placeholder="/slug"
                  />
                </div>
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Undo className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Viewport Controls */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
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

              <Separator orientation="vertical" className="h-6" />

              <Button variant="outline" onClick={previewPage}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              
              <Button onClick={savePage} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-gray-100 p-6">
            <div 
              className="mx-auto bg-white shadow-lg transition-all duration-200"
              style={{ width: getViewportWidth(), minHeight: '100vh' }}
            >
              <DroppableCanvas
                blocks={blocks}
                onAddBlock={addBlock}
                onSelectBlock={setSelectedBlockId}
                selectedBlockId={selectedBlockId}
                onMoveBlock={moveBlock}
                onDeleteBlock={deleteBlock}
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties Panel */}
        <div className="w-80 bg-white border-l flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Properties</h2>
            <p className="text-sm text-gray-600">Edit selected block</p>
          </div>
          
          <ScrollArea className="flex-1">
            <BlockPropertiesPanel 
              selectedBlock={selectedBlock}
              onUpdateBlock={updateBlock}
            />
          </ScrollArea>
        </div>
      </div>
      <WebsitePreview
        blocks={blocks}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        pageTitle={page.title}
      />
    </DndProvider>
  );
}