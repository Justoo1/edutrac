import React, { useCallback } from "react";
import { Grid, Box } from "lucide-react";
import { useDrop } from "react-dnd";
import { BlockType } from "./types";

// Two Column Layout
export const TwoColumnLayout: React.FC<{ block: any }> = ({ block }) => {
  return (
    <div className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DropZone 
            columnId={`${block.id}-col-1`}
            placeholder="Drop content in Column 1"
          />
          <DropZone 
            columnId={`${block.id}-col-2`}
            placeholder="Drop content in Column 2"
          />
        </div>
      </div>
    </div>
  );
};

// Three Column Layout
export const ThreeColumnLayout: React.FC<{ block: any }> = ({ block }) => {
  return (
    <div className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DropZone 
            columnId={`${block.id}-col-1`}
            placeholder="Drop content in Column 1"
          />
          <DropZone 
            columnId={`${block.id}-col-2`}
            placeholder="Drop content in Column 2"
          />
          <DropZone 
            columnId={`${block.id}-col-3`}
            placeholder="Drop content in Column 3"
          />
        </div>
      </div>
    </div>
  );
};

// Four Column Layout
export const FourColumnLayout: React.FC<{ block: any }> = ({ block }) => {
  return (
    <div className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DropZone 
            columnId={`${block.id}-col-1`}
            placeholder="Column 1"
          />
          <DropZone 
            columnId={`${block.id}-col-2`}
            placeholder="Column 2"
          />
          <DropZone 
            columnId={`${block.id}-col-3`}
            placeholder="Column 3"
          />
          <DropZone 
            columnId={`${block.id}-col-4`}
            placeholder="Column 4"
          />
        </div>
      </div>
    </div>
  );
};

// Section Container
export const SectionContainer: React.FC<{ block: any }> = ({ block }) => {
  return (
    <div className="py-8 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <DropZone 
          columnId={block.id}
          placeholder="Drop content blocks here"
        />
      </div>
    </div>
  );
};

// Drop zone component for layouts
interface DropZoneProps {
  columnId: string;
  placeholder: string;
  blocks?: any[];
  onDrop?: (type: string, columnId: string) => void;
  onSelectBlock?: (blockId: string) => void;
  selectedBlockId?: string;
  onMoveBlock?: (blockId: string, direction: 'up' | 'down') => void;
  onDeleteBlock?: (blockId: string) => void;
}

const DropZone = ({ 
  columnId, 
  placeholder, 
  blocks = [], 
  onDrop,
  onSelectBlock,
  selectedBlockId,
  onMoveBlock,
  onDeleteBlock
}: DropZoneProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'block',
    drop: (item: any) => {
      if (onDrop) {
        onDrop(item.blockType, columnId);
      }
      return { name: 'dropzone', columnId };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const dropRef = useCallback((node: HTMLDivElement | null) => {
    drop(node);
  }, [drop]);

  return (
    <div
      ref={dropRef}
      className={`min-h-32 border-2 border-dashed rounded-lg p-4 transition-colors ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
      }`}
    >
      {blocks.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <Box className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{placeholder}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.map((block, index) => (
            <div key={block.id} className="bg-white p-4 rounded border">
              {/* Block content would be rendered here */}
              <p className="text-sm text-gray-600">Block: {block.type}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Block Type Definitions
export const LAYOUT_BLOCKS: BlockType[] = [
  {
    type: "two-column",
    label: "Two Columns",
    icon: Grid,
    description: "2-column layout",
    category: "Layout",
    defaultContent: {
      children: []
    }
  },
  {
    type: "three-column",
    label: "Three Columns",
    icon: Grid,
    description: "3-column layout",
    category: "Layout",
    defaultContent: {
      children: []
    }
  },
  {
    type: "four-column",
    label: "Four Columns",
    icon: Grid,
    description: "4-column layout",
    category: "Layout",
    defaultContent: {
      children: []
    }
  },
  {
    type: "section-container",
    label: "Section",
    icon: Box,
    description: "Full-width section",
    category: "Layout",
    defaultContent: {
      children: []
    }
  }
];

// Get default content function
export const getLayoutDefaultContent = (type: string) => {
  const block = LAYOUT_BLOCKS.find(b => b.type === type);
  return block?.defaultContent || null;
};
