// components/editor/PageEditor.tsx
import React, { useState, useEffect } from 'react';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import type { NodeData, SerializedNodes } from '@craftjs/core';
import { useRouter } from 'next/navigation';
import {
  TextComponent,
  ButtonComponent,
  ImageComponent,
  HeroContainer,
  Row,
  Column,
  TextSettings,
  ButtonSettings,
  ImageSettings,
  HeroContainerSettings,
  RowSettings,
  ColumnSettings,
} from './EditorComponent';
import { Toolbox } from './Toolbox';
import { SettingsPanel } from './SettingsPanel';
import { toast } from 'react-hot-toast';

// Define the resolver for all components
const resolver = {
  TextComponent,
  ButtonComponent,
  ImageComponent,
  HeroContainer,
  Row,
  Column,
};

interface PageEditorProps {
  schoolId: string;
  initialContent?: any;
  contentId?: string | null;
  contentType?: string;
  isHero?: boolean;
}

export default function PageEditor({ 
  schoolId, 
  initialContent, 
  contentId = null, 
  contentType = 'page', 
  isHero = false 
}: PageEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState<string>(initialContent?.title || '');
  const [slug, setSlug] = useState<string>(initialContent?.slug || '');
  const [editorContent, setEditorContent] = useState<any>(initialContent?.content ? JSON.parse(initialContent.content) : null);
  const [isPublished, setIsPublished] = useState<boolean>(initialContent?.published || false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Generate a slug from the title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/gi, '-');
  };

  // Handle title change and auto-generate slug if needed
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setTitle(e.target.value);
    if (!contentId || !slug) {
      setSlug(generateSlug(e.target.value));
    }
  };

  // Save changes to the database
  const saveContent = async (editorData: any): Promise<void> => {
    if (!title) {
      toast.error('Please enter a title for your page');
      return;
    }

    setIsSaving(true);

    try {
      const endpoint = contentId 
        ? `/api/schools/${schoolId}/content/${contentId}` 
        : `/api/schools/${schoolId}/content`;
      
      const method = contentId ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          slug,
          contentType,
          content: JSON.stringify(editorData),
          published: isPublished,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save content');
      }

      const data = await response.json();
      
      toast.success(contentId ? 'Page updated successfully' : 'Page created successfully');
      
      if (!contentId) {
        router.push(`/dashboard/${schoolId}/content/${data.id}`);
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle publish status
  const togglePublish = (): void => {
    setIsPublished(!isPublished);
  };

  interface EditorActionBarProps {
    isPublished: boolean;
    togglePublish: () => void;
    isSaving: boolean;
    saveContent: (data: any) => Promise<void>;
  }
  
  const EditorActionBar: React.FC<EditorActionBarProps> = ({
    isPublished,
    togglePublish,
    isSaving,
    saveContent
  }) => {
    const { query } = useEditor();
    
    const handleSave = () => {
      const editorData = query.serialize();
      saveContent(editorData);
    };
    
    return (
      <div className="flex justify-end gap-2 my-4">
        <button
          className={`px-4 py-2 rounded text-sm font-medium ${
            isPublished 
              ? 'bg-green-500 hover:bg-green-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
          onClick={togglePublish}
        >
          {isPublished ? 'Published' : 'Draft'}
        </button>
        <button
          className="px-4 py-2 bg-black text-white rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    );
  };

  // Content initializer (moved outside Frame)
  const ContentInitializer: React.FC = () => {
    const { actions } = useEditor();
    
    useEffect(() => {
      try {
        if (editorContent) {
          console.log("Deserializing saved content");
          actions.deserialize(editorContent);
        } else if (isHero && defaultHeroTemplate) {
          console.log("Using default hero template");
          // Convert to string and back to ensure it matches the SerializedNodes type
          const serializedTemplate = JSON.stringify(defaultHeroTemplate);
          actions.deserialize(JSON.parse(serializedTemplate));
        }
      } catch (error) {
        console.error("Error initializing content:", error);
      }
    }, [actions]);
    
    return null;
  };

  // Default hero template for new pages
  const defaultHeroTemplate = {
    ROOT: {
      type: { resolvedName: 'HeroContainer' },
      props: { backgroundColor: '#f8f9fa', padding: '60px 20px' },
      displayName: 'Hero Container',
      custom: { displayName: 'Hero Container' },
      hidden: false,
      isCanvas: true,
      nodes: ['row1'],
      linkedNodes: {},
      parent: null,
    },
    row1: {
      type: { resolvedName: 'Row' },
      props: { gap: '20px' },
      displayName: 'Row',
      custom: { displayName: 'Row' },
      hidden: false,
      nodes: ['column1'],
      linkedNodes: {},
      parent: 'ROOT',
      isCanvas: true,
    },
    column1: {
      type: { resolvedName: 'Column' },
      props: { width: '100%' },
      displayName: 'Column',
      custom: { displayName: 'Column' },
      hidden: false,
      nodes: ['text1', 'text2', 'button1', 'image1'],
      linkedNodes: {},
      parent: 'row1',
      isCanvas: true,
    },
    text1: {
      type: { resolvedName: 'Text' },
      props: {
        text: 'Welcome to Your School',
        fontSize: '32px',
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#333333',
        margin: '0 0 20px 0',
      },
      displayName: 'Text',
      custom: { displayName: 'Text' },
      hidden: false,
      nodes: [],
      linkedNodes: {},
      parent: 'column1',
      isCanvas: false,
    },
    text2: {
      type: { resolvedName: 'Text' },
      props: {
        text: 'Create a compelling hero section to engage your visitors',
        fontSize: '18px',
        textAlign: 'center',
        fontWeight: 'normal',
        color: '#666666',
        margin: '0 0 30px 0',
      },
      displayName: 'Text',
      custom: { displayName: 'Text' },
      hidden: false,
      nodes: [],
      linkedNodes: {},
      parent: 'column1',
      isCanvas: false,
    },
    button1: {
      type: { resolvedName: 'Button' },
      props: {
        text: 'Learn More',
        backgroundColor: '#0066cc',
        color: '#ffffff',
        borderRadius: '4px',
        padding: '12px 24px',
        fontSize: '16px',
        textAlign: 'center',
      },
      displayName: 'Button',
      custom: { displayName: 'Button' },
      hidden: false,
      nodes: [],
      linkedNodes: {},
      parent: 'column1',
      isCanvas: false,
    },
    image1: {
      type: { resolvedName: 'Image' },
      props: {
        src: '/placeholder-hero.jpg',
        alt: 'Hero Image',
        width: '100%',
        height: 'auto',
        objectFit: 'cover',
        margin: '30px 0 0 0',
      },
      displayName: 'Image',
      custom: { displayName: 'Image' },
      hidden: false,
      nodes: [],
      linkedNodes: {},
      parent: 'column1',
      isCanvas: false,
    },
  };

  return (
    <div className="container mx-auto px-4">
      <div className="mb-6">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Page Title
        </label>
        <input
          type="text"
          id="title"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={title}
          onChange={handleTitleChange}
          placeholder="Enter page title"
        />
      </div>
      
      <div className="mb-6">
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
          URL Slug
        </label>
        <div className="flex items-center">
          <span className="text-gray-500 mr-2">/</span>
          <input
            type="text"
            id="slug"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="page-slug"
          />
        </div>
      </div>

      <div className="border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <Editor
          resolver={resolver}
          enabled={true}
        >
          {/* Initialize content outside of Frame */}
          <ContentInitializer />
          
          {/* Editor Actions at the top */}
          <EditorActionBar 
            isPublished={isPublished} 
            togglePublish={togglePublish} 
            isSaving={isSaving} 
            saveContent={saveContent} 
          />
          
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-9 bg-white p-4">
              <div className="border-2 border-gray-200 rounded min-h-[400px] p-4">
                <Frame>
                  {!editorContent && !isHero && (
                    <Element 
                      canvas 
                      is={HeroContainer}
                      backgroundColor="#ffffff"
                      padding="20px"
                    >
                      <Element
                        canvas
                        is={Column}
                        width="100%"
                      >
                        <Element
                          is={TextComponent}
                          text="Start building your page here..."
                          fontSize="24px"
                          textAlign="center"
                          fontWeight="bold"
                          color="#333333"
                          margin="0 0 20px 0"
                        />
                        <Element
                          is={TextComponent}
                          text="Drag components from the sidebar to create your page."
                          fontSize="16px"
                          textAlign="center"
                          fontWeight="normal"
                          color="#666666"
                          margin="0 0 30px 0"
                        />
                        <Element
                          is={ButtonComponent}
                          text="Button Example"
                          backgroundColor="#0066cc"
                          color="#ffffff"
                          borderRadius="4px"
                          padding="10px 20px"
                          fontSize="16px"
                          textAlign="center"
                        />
                      </Element>
                    </Element>
                  )}
                </Frame>
              </div>
            </div>
            <div className="col-span-3 bg-gray-50 p-4 border-l border-gray-200">
              <div className="mb-6">
                <h3 className="font-medium text-lg mb-2">Components</h3>
                <Toolbox />
              </div>
              <div>
                <h3 className="font-medium text-lg mb-2">Settings</h3>
                <SettingsPanel />
              </div>
            </div>
          </div>
        </Editor>
      </div>
    </div>
  );
}