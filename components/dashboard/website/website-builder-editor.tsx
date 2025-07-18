"use client";

import { useState, useCallback, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Save, 
  Eye, 
  Undo, 
  Redo, 
  Trash2, 
  Settings, 
  Smartphone,
  Tablet,
  Monitor,
  Copy,
  ArrowUp,
  ArrowDown,
  GraduationCap,
  Calendar,
  BookOpen,
  MapPin,
  Phone,
  Mail,
  Users,
  Layout,
  Globe
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WebsitePreview } from './website-preview';
import { BlockConfigPanel } from '../../website-editor/BlockConfigPanel';
import { toast } from "sonner";

// Import modular blocks
import { 
  ALL_SCHOOL_BLOCKS, 
  BLOCKS_BY_CATEGORY, 
  BlockRenderer, 
  getDefaultContent,
  Block,
  BlockType
} from '../../website-editor/blocks';

interface WebsiteBuilderEditorProps {
  schoolId: string;
  pageId?: string;
  userId: string;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  blocks: Block[];
  isPublished?: boolean;
}

const DraggableBlock = ({ blockType, onDrop, category }: { 
  blockType: BlockType, 
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
  const categoryColors = {
    Hero: 'bg-blue-50 border-blue-200 text-blue-800',
    Information: 'bg-green-50 border-green-200 text-green-800',
    Academic: 'bg-purple-50 border-purple-200 text-purple-800',
    Community: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    Events: 'bg-red-50 border-red-200 text-red-800',
    Interactive: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    Layout: 'bg-gray-50 border-gray-200 text-gray-800',
  };

  return (
    <div
      ref={drag}
      className={`p-3 border rounded-lg cursor-move hover:shadow-md transition-all ${
        isDragging ? 'opacity-50' : ''
      } ${categoryColors[category as keyof typeof categoryColors] || 'border-gray-200'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{blockType.label}</span>
      </div>
      <p className="text-xs opacity-75">{blockType.description}</p>
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
  onAddBlock: (type: string, parentId?: string) => void;
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

  const BlockWrapper = ({ 
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
    return (
      <div
        className={`relative group ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        onClick={onSelect}
      >
        <BlockRenderer block={block} />
        
        {/* Block Controls */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); }}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={drop}
      className={`min-h-screen bg-white ${isOver ? 'bg-blue-50' : ''}`}
    >
      {blocks.length === 0 ? (
        <div className="flex items-center justify-center h-96 border-2 border-dashed border-gray-300 rounded-lg m-6">
          <div className="text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start Building Your School Website</h3>
            <p className="text-gray-500 mb-4">Drag pre-designed school blocks from the left sidebar</p>
          </div>
        </div>
      ) : (
        <div>
          {blocks.map((block, index) => (
            <BlockWrapper 
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
    blocks: [],
    isPublished: false
  });

  // Load page data on mount
  useEffect(() => {
    if (pageId && pageId !== 'new') {
      loadPage();
    } else {
      // For new pages or when no pageId, just set loading to false
      setIsLoading(false);
    }
    // eslint-disable-next-line
  }, [pageId]);

  const loadPage = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/website/pages/${pageId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPage({
          id: data.page.id,
          title: data.page.title,
          slug: data.page.slug,
          blocks: [],
          isPublished: data.page.isPublished
        });
        
        // Convert database blocks to Block format
        const pageBlocks = (data.page.blocks || []).map((dbBlock: any) => ({
          id: dbBlock.id,
          type: dbBlock.blockType,
          content: dbBlock.content || {},
          styles: dbBlock.styles || {},
          sortOrder: dbBlock.sortOrder,
          isVisible: dbBlock.isVisible !== false,
        }));
        
        setBlocks(pageBlocks);
      } else {
        toast.error('Failed to load page');
      }
    } catch (error) {
      console.error('Error loading page:', error);
      toast.error('Failed to load page');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        setShowPreview(true);
      }
      if (event.key === 'Escape' && showPreview) {
        setShowPreview(false);
      }
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        savePage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line
  }, [showPreview]);

  const selectedBlock = blocks.find(block => block.id === selectedBlockId);

  const addBlock = useCallback((type: string, parentId?: string) => {
    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: getDefaultContent(type),
      styles: {},
      sortOrder: blocks.length,
      isVisible: true,
      isContainer: ['two-column', 'three-column', 'four-column', 'section-container'].includes(type),
      children: ['two-column', 'three-column', 'four-column', 'section-container'].includes(type) ? [] : undefined
    };

    if (parentId) {
      // Add to parent container
      setBlocks(prev => prev.map(block => 
        block.id === parentId 
          ? { ...block, children: [...(block.children || []), newBlock] }
          : block
      ));
    } else {
      // Add to main canvas
      setBlocks(prev => [...prev, newBlock]);
    }
    
    setSelectedBlockId(newBlock.id);
  }, [blocks.length]);

  const updateBlock = useCallback(async (blockId: string, updates: Partial<Block>) => {
    // Update local state immediately for responsiveness
    const updateBlockRecursively = (blocks: Block[]): Block[] => {
      return blocks.map(block => {
        if (block.id === blockId) {
          return { ...block, ...updates };
        }
        if (block.children) {
          return { ...block, children: updateBlockRecursively(block.children) };
        }
        return block;
      });
    };
    
    setBlocks(prev => updateBlockRecursively(prev));

    // If this is an existing page, save individual block changes
    if (pageId && pageId !== 'new') {
      try {
        // Find the block in the current blocks array
        const blockIndex = blocks.findIndex(b => b.id === blockId);
        if (blockIndex !== -1) {
          const updatedBlock = { ...blocks[blockIndex], ...updates };
          
          const blockData = {
            pageId: pageId,
            blockType: updatedBlock.type,
            content: updatedBlock.content || {},
            styles: updatedBlock.styles || {},
            sortOrder: blockIndex,
            isVisible: updatedBlock.isVisible !== false,
          };

          const response = await fetch('/api/website/blocks', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              blockId: blockId,
              ...blockData,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to update block');
          }
        }
      } catch (error) {
        console.error('Error updating block:', error);
        toast.error('Failed to save block changes');
      }
    }
  }, [pageId, blocks]);

  const moveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    const moveBlockRecursively = (blocks: Block[]): Block[] => {
      const blockIndex = blocks.findIndex(b => b.id === blockId);
      if (blockIndex === -1) {
        return blocks.map(block => ({
          ...block,
          children: block.children ? moveBlockRecursively(block.children) : undefined
        }));
      }
      
      const newBlocks = [...blocks];
      const targetIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
      
      if (targetIndex >= 0 && targetIndex < newBlocks.length) {
        [newBlocks[blockIndex], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[blockIndex]];
      }
      
      return newBlocks;
    };
    
    setBlocks(prev => moveBlockRecursively(prev));
  }, []);

  const deleteBlock = useCallback(async (blockId: string) => {
    const deleteBlockRecursively = (blocks: Block[]): Block[] => {
      return blocks.filter(block => block.id !== blockId).map(block => ({
        ...block,
        children: block.children ? deleteBlockRecursively(block.children) : undefined
      }));
    };
    
    setBlocks(prev => deleteBlockRecursively(prev));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(undefined);
    }

    // If this is an existing page, delete from database
    if (pageId && pageId !== 'new') {
      try {
        const response = await fetch(`/api/website/blocks?blockId=${blockId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete block');
        }
      } catch (error) {
        console.error('Error deleting block:', error);
        toast.error('Failed to delete block');
      }
    }
  }, [selectedBlockId, pageId]);

  const savePage = async () => {
    setIsLoading(true);
    try {
      // Prepare page data
      const pageData = {
        title: page.title,
        slug: page.slug,
        content: {}, // Keep empty for now, blocks are stored separately
        metaTitle: page.title,
        metaDescription: `${page.title} - Learn more about our school`,
        isPublished: page.isPublished || false,
        pageType: "page",
        showInNavigation: true,
        accessLevel: "public",
      };

      let response;
      let savedPage;

      if (pageId && pageId !== 'new') {
        // Update existing page
        response = await fetch(`/api/website/pages/${pageId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pageData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update page');
        }
        
        savedPage = await response.json();
      } else {
        // Create new page
        response = await fetch('/api/website/pages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pageData),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to create page:', errorText);
          throw new Error('Failed to create page');
        }
        
        savedPage = await response.json();
        console.log('New page created:', savedPage);
      }

      const currentPageId = savedPage.page?.id || page.id;
      
      console.log('Saving blocks for page:', currentPageId, 'Number of blocks:', blocks.length);

      // Now save blocks separately
      if (blocks.length > 0) {
        // First, delete existing blocks for this page (only for existing pages)
        if (pageId && pageId !== 'new') {
          await fetch(`/api/website/blocks?pageId=${currentPageId}`, {
            method: 'DELETE',
          });
        }

        // Then create new blocks
        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];
          const blockData = {
            pageId: currentPageId,
            blockType: block.type,
            content: block.content || {},
            styles: block.styles || {},
            sortOrder: i,
            isVisible: block.isVisible !== false,
          };

          console.log('Creating block:', blockData);

          const blockResponse = await fetch('/api/website/blocks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(blockData),
          });

          if (!blockResponse.ok) {
            const errorText = await blockResponse.text();
            console.error('Failed to save block:', errorText);
            toast.error(`Failed to save block: ${errorText}`);
          } else {
            console.log('Block saved successfully');
          }
        }
      }

      // Update local state
      if (pageId === 'new') {
        setPage(prev => ({ ...prev, id: currentPageId }));
        // Update URL to reflect the new page
        window.history.replaceState(null, '', `/website/builder?page=${currentPageId}`);
      }

      toast.success('Page saved successfully!');
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error('Failed to save page');
    } finally {
      setIsLoading(false);
    }
  };

  const previewPage = () => {
    setShowPreview(true);
  };

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  const publishPage = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/website/pages/${page.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: page.title,
          slug: page.slug,
          isPublished: true,
        }),
      });

      if (response.ok) {
        setPage(prev => ({ ...prev, isPublished: true }));
        toast.success('Page published successfully!');
      } else {
        throw new Error('Failed to publish page');
      }
    } catch (error) {
      console.error('Error publishing page:', error);
      toast.error('Failed to publish page');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading page...</p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex overflow-hidden bg-gray-50">
        {/* Left Sidebar - School Block Library */}
        <div className="w-80 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              School Blocks
            </h2>
            <p className="text-sm text-gray-600">Pre-designed blocks for schools</p>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {Object.entries(BLOCKS_BY_CATEGORY).map(([category, categoryBlocks]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    {category === 'Hero' && <GraduationCap className="h-4 w-4" />}
                    {category === 'Information' && <MapPin className="h-4 w-4" />}
                    {category === 'Academic' && <BookOpen className="h-4 w-4" />}
                    {category === 'Community' && <Users className="h-4 w-4" />}
                    {category === 'Events' && <Calendar className="h-4 w-4" />}
                    {category === 'Interactive' && <Mail className="h-4 w-4" />}
                    {category === 'Layout' && <Layout className="h-4 w-4" />}
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {categoryBlocks.map(blockType => (
                      <DraggableBlock 
                        key={blockType.type} 
                        blockType={blockType} 
                        onDrop={addBlock}
                        category={category}
                      />
                    ))}
                  </div>
                  {category !== 'Layout' && <Separator className="mt-4" />}
                </div>
              ))}
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
                <Button variant="ghost" size="sm" disabled>
                  <Undo className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" disabled>
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

              {page.isPublished ? (
                <Button variant="outline" className="text-green-600 border-green-600">
                  <Globe className="h-4 w-4 mr-2" />
                  Published
                </Button>
              ) : (
                <Button variant="outline" onClick={publishPage} disabled={isLoading}>
                  <Globe className="h-4 w-4 mr-2" />
                  Publish
                </Button>
              )}
              
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

        {/* Right Sidebar - Content Editor */}
        <div className="w-80 bg-white border-l flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Content Editor</h2>
            <p className="text-sm text-gray-600">Edit block content and styles</p>
          </div>
          
          <ScrollArea className="flex-1">
            {selectedBlock ? (
              <div className="p-4">
                <BlockConfigPanel 
                  block={selectedBlock}
                  onUpdate={(updates: Partial<Block>) => updateBlock(selectedBlock.id, updates)}
                  onDelete={() => deleteBlock(selectedBlock.id)}
                  onDuplicate={() => {
                    const newBlock = {
                      ...selectedBlock,
                      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      sortOrder: blocks.length
                    };
                    setBlocks(prev => [...prev, newBlock]);
                  }}
                  onToggleVisibility={() => updateBlock(selectedBlock.id, { isVisible: !selectedBlock.isVisible })}
                />
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Select a block to edit its content</p>
                <p className="text-sm mt-2">Click on any block in the canvas to start editing</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
      
      <WebsitePreview
        blocks={blocks}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        pageTitle={page.title}
        viewport={viewport}
      />
    </DndProvider>
  );
}
