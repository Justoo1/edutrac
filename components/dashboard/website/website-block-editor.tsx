// components/website-editor/WebsiteBlockEditor.tsx
"use client";

import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  GripVertical, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  Type,
  Image,
  Video,
  MessageSquare,
  Users,
  BarChart3,
  Grid3X3,
  Star,
  Mail,
  Layout,
  Palette
} from 'lucide-react';
import { BlockConfigPanel } from './BlockConfigPanel';

interface Block {
  id: string;
  type: string;
  content: any;
  styles: any;
  sortOrder: number;
  isVisible: boolean;
}

interface WebsiteBlockEditorProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  schoolId: string;
}

const BLOCK_TYPES = [
  { id: 'hero', name: 'Hero Section', icon: Layout, category: 'Layout' },
  { id: 'text', name: 'Text Block', icon: Type, category: 'Content' },
  { id: 'image', name: 'Image', icon: Image, category: 'Media' },
  { id: 'gallery', name: 'Gallery', icon: Grid3X3, category: 'Media' },
  { id: 'video', name: 'Video', icon: Video, category: 'Media' },
  { id: 'contact', name: 'Contact Form', icon: Mail, category: 'Forms' },
  { id: 'stats', name: 'Statistics', icon: BarChart3, category: 'Content' },
  { id: 'testimonials', name: 'Testimonials', icon: Star, category: 'Content' },
  { id: 'team', name: 'Team Members', icon: Users, category: 'Content' },
  { id: 'announcement', name: 'Announcements', icon: MessageSquare, category: 'Content' },
];

export function WebsiteBlockEditor({ 
  blocks, 
  onBlocksChange, 
  schoolId 
}: WebsiteBlockEditorProps) {
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(BLOCK_TYPES.map(type => type.category)))];

  const generateBlockId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const createBlock = (type: string): Block => {
    const baseBlock = {
      id: generateBlockId(),
      type,
      sortOrder: blocks.length,
      isVisible: true,
      content: {},
      styles: {
        padding: 'medium',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        textAlign: 'left',
        maxWidth: 'full'
      }
    };

    // Default content based on block type
    switch (type) {
      case 'hero':
        return {
          ...baseBlock,
          content: {
            title: 'Welcome to Our School',
            subtitle: 'Providing quality education for tomorrow\'s leaders',
            buttonText: 'Learn More',
            buttonLink: '#',
            backgroundImage: null
          },
          styles: {
            ...baseBlock.styles,
            backgroundColor: '#3b82f6',
            textColor: '#ffffff',
            textAlign: 'center',
            padding: 'large'
          }
        };
        
      case 'text':
        return {
          ...baseBlock,
          content: {
            html: '<p>Add your content here...</p>'
          }
        };
        
      case 'image':
        return {
          ...baseBlock,
          content: {
            src: null,
            alt: 'Image description',
            caption: '',
            link: null
          },
          styles: {
            ...baseBlock.styles,
            imageSize: 'medium',
            alignment: 'center',
            borderRadius: 'none',
            shadow: 'none'
          }
        };
        
      case 'gallery':
        return {
          ...baseBlock,
          content: {
            title: 'Gallery',
            images: []
          },
          styles: {
            ...baseBlock.styles,
            columns: '3',
            gap: 'medium',
            aspectRatio: 'square'
          }
        };
        
      case 'video':
        return {
          ...baseBlock,
          content: {
            title: 'Video',
            videoUrl: '',
            description: ''
          },
          styles: {
            ...baseBlock.styles,
            videoSize: 'medium',
            alignment: 'center'
          }
        };
        
      case 'contact':
        return {
          ...baseBlock,
          content: {
            title: 'Contact Us',
            subtitle: 'Get in touch with us',
            submitText: 'Send Message',
            fields: {
              name: true,
              email: true,
              phone: false,
              subject: true,
              message: true
            }
          },
          styles: {
            ...baseBlock.styles,
            formWidth: 'medium',
            buttonColor: '#3b82f6'
          }
        };
        
      case 'stats':
        return {
          ...baseBlock,
          content: {
            stats: [
              { number: '500+', label: 'Students' },
              { number: '50+', label: 'Teachers' },
              { number: '20+', label: 'Years' },
              { number: '95%', label: 'Success Rate' }
            ]
          },
          styles: {
            ...baseBlock.styles,
            columns: '4',
            numberColor: '#3b82f6',
            labelColor: '#6b7280'
          }
        };
        
      case 'testimonials':
        return {
          ...baseBlock,
          content: {
            title: 'What People Say',
            testimonials: [
              {
                text: 'This school has provided excellent education for my child.',
                author: 'Parent Name',
                role: 'Parent',
                image: null
              }
            ]
          },
          styles: {
            ...baseBlock.styles,
            columns: '2',
            cardBackground: '#f9fafb'
          }
        };
        
      case 'team':
        return {
          ...baseBlock,
          content: {
            title: 'Our Team',
            members: [
              {
                name: 'John Doe',
                role: 'Headmaster',
                bio: 'Brief bio about the team member',
                image: null,
                email: 'john@school.edu'
              }
            ]
          },
          styles: {
            ...baseBlock.styles,
            columns: '3',
            cardBackground: '#ffffff'
          }
        };
        
      case 'announcement':
        return {
          ...baseBlock,
          content: {
            title: 'Latest Announcements',
            showDate: true,
            showAuthor: true,
            limit: 5
          }
        };
        
      default:
        return baseBlock;
    }
  };

  const addBlock = (type: string) => {
    const newBlock = createBlock(type);
    const updatedBlocks = [...blocks, newBlock];
    onBlocksChange(updatedBlocks);
    setSelectedBlock(newBlock);
  };

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    const updatedBlocks = blocks.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    );
    onBlocksChange(updatedBlocks);
    
    if (selectedBlock && selectedBlock.id === blockId) {
      setSelectedBlock({ ...selectedBlock, ...updates });
    }
  };

  const deleteBlock = (blockId: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== blockId);
    onBlocksChange(updatedBlocks);
    
    if (selectedBlock && selectedBlock.id === blockId) {
      setSelectedBlock(null);
    }
  };

  const duplicateBlock = (blockId: string) => {
    const blockToDuplicate = blocks.find(block => block.id === blockId);
    if (!blockToDuplicate) return;
    
    const duplicatedBlock = {
      ...blockToDuplicate,
      id: generateBlockId(),
      sortOrder: blocks.length
    };
    
    const updatedBlocks = [...blocks, duplicatedBlock];
    onBlocksChange(updatedBlocks);
  };

  const toggleBlockVisibility = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      updateBlock(blockId, { isVisible: !block.isVisible });
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort order
    const updatedBlocks = items.map((block, index) => ({
      ...block,
      sortOrder: index
    }));

    onBlocksChange(updatedBlocks);
  };

  const filteredBlockTypes = activeCategory === 'All' 
    ? BLOCK_TYPES 
    : BLOCK_TYPES.filter(type => type.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Add Block Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Blocks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={activeCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
            
            {/* Block Types Grid */}
            <div className="grid grid-cols-2 gap-2">
              {filteredBlockTypes.map(blockType => {
                const Icon = blockType.icon;
                return (
                  <Button
                    key={blockType.id}
                    variant="outline"
                    className="h-auto p-3 flex flex-col items-center gap-2"
                    onClick={() => addBlock(blockType.id)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{blockType.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Page Structure</CardTitle>
        </CardHeader>
        <CardContent>
          {blocks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Layout className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No blocks added yet</p>
              <p className="text-sm">Add blocks above to start building your page</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="blocks">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {blocks.map((block, index) => (
                      <Draggable key={block.id} draggableId={block.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`
                              flex items-center gap-3 p-3 bg-white border rounded-lg
                              ${selectedBlock?.id === block.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                              ${!block.isVisible ? 'opacity-50' : ''}
                            `}
                          >
                            <div {...provided.dragHandleProps} className="cursor-move">
                              <GripVertical className="h-4 w-4 text-gray-400" />
                            </div>
                            
                            <div className="flex-1" onClick={() => setSelectedBlock(block)}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {BLOCK_TYPES.find(t => t.id === block.type)?.name || block.type}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {block.type}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleBlockVisibility(block.id)}
                                className="h-8 w-8 p-0"
                              >
                                {block.isVisible ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => duplicateBlock(block.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteBlock(block.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* Block Configuration */}
      {selectedBlock && (
        <BlockConfigPanel
          block={selectedBlock}
          onUpdate={(updates: Partial<Block>) => updateBlock(selectedBlock.id, updates)}
          onDelete={() => deleteBlock(selectedBlock.id)}
        />
      )}
    </div>
  );
};