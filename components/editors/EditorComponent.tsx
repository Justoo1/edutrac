// components/editor/EditorComponents.tsx
import React from 'react';
import { Element, useNode } from '@craftjs/core';
import Image from 'next/image';

// Define specific types for controlled values
type TextAlign = 'left' | 'center' | 'right' | 'justify';
type FontWeight = 'normal' | 'bold' | 'lighter' | 'bolder' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
type ObjectFit = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';

// Define interfaces for component props
interface TextComponentProps {
  text: string;
  fontSize: string;
  textAlign: TextAlign;
  fontWeight: FontWeight;
  color: string;
  margin: string;
  [x: string]: any;
}

// Default text component props
const defaultTextProps: Omit<TextComponentProps, 'children'> = {
  text: 'Text Block',
  fontSize: '16px',
  textAlign: 'left',
  fontWeight: 'normal',
  color: '#000000',
  margin: '0',
};

interface ButtonComponentProps {
  text: string;
  backgroundColor: string;
  color: string;
  borderRadius: string;
  padding: string;
  fontSize: string;
  textAlign: TextAlign;
  [x: string]: any;
}

// Default button component props
const defaultButtonProps: Omit<ButtonComponentProps, 'children'> = {
  text: 'Button',
  backgroundColor: '#0066cc',
  color: '#ffffff',
  borderRadius: '4px',
  padding: '10px 16px',
  fontSize: '16px',
  textAlign: 'center',
};

interface ImageComponentProps {
  src: string;
  alt: string;
  width: string;
  height: string;
  objectFit: ObjectFit;
  [x: string]: any;
}

// Default image component props
const defaultImageProps: Omit<ImageComponentProps, 'children'> = {
  src: 'https://via.placeholder.com/400x300',
  alt: 'placeholder image',
  width: '100%',
  height: 'auto',
  objectFit: 'cover',
};

interface ContainerProps {
  backgroundColor: string;
  padding: string;
  children?: React.ReactNode;
  [x: string]: any;
}

// Default container component props
const defaultContainerProps: Omit<ContainerProps, 'children'> = {
  backgroundColor: '#f5f5f5',
  padding: '40px 20px',
};

interface RowProps {
  gap: string;
  children?: React.ReactNode;
  [x: string]: any;
}

// Default row component props
const defaultRowProps: Omit<RowProps, 'children'> = {
  gap: '20px',
};

interface ColumnProps {
  width: string;
  children?: React.ReactNode;
  [x: string]: any;
}

// Default column component props
const defaultColumnProps: Omit<ColumnProps, 'children'> = {
  width: '100%',
};

// Basic Text component with editable properties
export const TextComponent = ({
  text = defaultTextProps.text,
  fontSize = defaultTextProps.fontSize,
  textAlign = defaultTextProps.textAlign,
  fontWeight = defaultTextProps.fontWeight,
  color = defaultTextProps.color,
  margin = defaultTextProps.margin,
  ...props
}: Partial<TextComponentProps>) => {
  return (
    <div
      {...props}
      style={{
        fontSize,
        textAlign,
        fontWeight,
        color,
        margin,
      }}
    >
      {text}
    </div>
  );
};

// Button Component with editable properties
export const ButtonComponent = ({
  text = defaultButtonProps.text,
  backgroundColor = defaultButtonProps.backgroundColor,
  color = defaultButtonProps.color,
  borderRadius = defaultButtonProps.borderRadius,
  padding = defaultButtonProps.padding,
  fontSize = defaultButtonProps.fontSize,
  textAlign = defaultButtonProps.textAlign,
  ...props
}: Partial<ButtonComponentProps>) => {
  return (
    <button
      {...props}
      style={{
        backgroundColor,
        color,
        borderRadius,
        padding,
        fontSize,
        textAlign,
      }}
    >
      {text}
    </button>
  );
};

// Image Component
export const ImageComponent = ({ 
  src = defaultImageProps.src, 
  alt = defaultImageProps.alt, 
  width = defaultImageProps.width, 
  height = defaultImageProps.height, 
  objectFit = defaultImageProps.objectFit, 
  ...props 
}: Partial<ImageComponentProps>) => {
  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      style={{
        width,
        height,
        objectFit,
      }}
    />
  );
};

// Hero Section Container Component
export const HeroContainer = ({ 
  backgroundColor = defaultContainerProps.backgroundColor, 
  padding = defaultContainerProps.padding, 
  children, 
  ...props 
}: Partial<ContainerProps>) => {
  return (
    <div
      {...props}
      style={{
        backgroundColor,
        padding,
        width: '100%',
        position: 'relative',
      }}
    >
      {children}
    </div>
  );
};

// Column layout component for creating multi-column sections
export const Column = ({ 
  width = defaultColumnProps.width, 
  children, 
  ...props 
}: Partial<ColumnProps>) => {
  return (
    <div
      {...props}
      style={{
        width,
        padding: '10px',
      }}
    >
      {children}
    </div>
  );
};

// Row component to hold columns
export const Row = ({ 
  gap = defaultRowProps.gap, 
  children, 
  ...props 
}: Partial<RowProps>) => {
  return (
    <div
      {...props}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap,
        width: '100%',
      }}
    >
      {children}
    </div>
  );
};

// Settings Component for Text
export const TextSettings: React.FC = () => {
  const { actions, fontSize, textAlign, text, fontWeight, color, margin } = useNode((node) => ({
    text: node.data.props.text,
    fontSize: node.data.props.fontSize,
    textAlign: node.data.props.textAlign,
    fontWeight: node.data.props.fontWeight,
    color: node.data.props.color,
    margin: node.data.props.margin,
  }));

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Text Settings</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs mb-1">Content</label>
          <textarea
            aria-label="Content"
            className="w-full border border-gray-300 p-2 rounded"
            value={text}
            onChange={(e) => {
              actions.setProp((props: Record<string, any>) => {
                props.text = e.target.value;
              });
            }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Font Size</label>
          <select
            aria-label="Font Size"
            className="w-full border border-gray-300 p-2 rounded"
            value={fontSize}
            onChange={(e) => {
              actions.setProp((props: Record<string, any>) => {
                props.fontSize = e.target.value;
              });
            }}
          >
            <option value="14px">Small</option>
            <option value="16px">Medium</option>
            <option value="20px">Large</option>
            <option value="24px">XL</option>
            <option value="32px">2XL</option>
            <option value="48px">3XL</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Alignment</label>
          <select
            aria-label="Alignment"
            className="w-full border border-gray-300 p-2 rounded"
            value={textAlign}
            onChange={(e) => {
              actions.setProp((props: Record<string, any>) => {
                props.textAlign = e.target.value as TextAlign;
              });
            }}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Font Weight</label>
          <select
            aria-label="Font Weight"
            className="w-full border border-gray-300 p-2 rounded"
            value={fontWeight}
            onChange={(e) => {
              actions.setProp((props: Record<string, any>) => {
                props.fontWeight = e.target.value as FontWeight;
              });
            }}
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Color</label>
          <input
            aria-label="Color"
            type="color"
            className="w-full border border-gray-300 p-1 rounded"
            value={color}
            onChange={(e) => {
              actions.setProp((props: Record<string, any>) => {
                props.color = e.target.value;
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Settings Component for Button
export const ButtonSettings: React.FC = () => {
  const { actions, text, backgroundColor, color, borderRadius, padding, fontSize } = useNode(
    (node) => ({
      text: node.data.props.text,
      backgroundColor: node.data.props.backgroundColor,
      color: node.data.props.color,
      borderRadius: node.data.props.borderRadius,
      padding: node.data.props.padding,
      fontSize: node.data.props.fontSize,
    })
  );

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Button Settings</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs mb-1">Text</label>
          <input
            aria-label="Text"
            type="text"
            className="w-full border border-gray-300 p-2 rounded"
            value={text}
            onChange={(e) => {
              actions.setProp((props: Record<string, any>) => {
                props.text = e.target.value;
              });
            }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Background Color</label>
          <input
            aria-label="Background Color"
            type="color"
            className="w-full border border-gray-300 p-1 rounded"
            value={backgroundColor}
            onChange={(e) => {
              actions.setProp((props: Record<string, any>) => {
                props.backgroundColor = e.target.value;
              });
            }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Text Color</label>
          <input
            aria-label="Text Color"
            type="color"
            className="w-full border border-gray-300 p-1 rounded"
            value={color}
            onChange={(e) => {
              actions.setProp((props: Record<string, any>) => {
                props.color = e.target.value;
              });
            }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Border Radius</label>
          <select
            aria-label="Border Radius"
            className="w-full border border-gray-300 p-2 rounded"
            value={borderRadius}
            onChange={(e) => {
              actions.setProp((props: Record<string, any>) => {
                props.borderRadius = e.target.value;
              });
            }}
          >
            <option value="0">None</option>
            <option value="4px">Small</option>
            <option value="8px">Medium</option>
            <option value="16px">Large</option>
            <option value="9999px">Rounded</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Font Size</label>
          <select
            aria-label="Font Size"
            className="w-full border border-gray-300 p-2 rounded"
            value={fontSize}
            onChange={(e) => {
              actions.setProp((props: Record<string, any>) => {
                props.fontSize = e.target.value;
              });
            }}
          >
            <option value="14px">Small</option>
            <option value="16px">Medium</option>
            <option value="20px">Large</option>
            <option value="24px">XL</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Settings Component for Image
export const ImageSettings: React.FC = () => {
  const { actions, src, alt, width, height, objectFit } = useNode(
    (node) => ({
      src: node.data.props.src,
      alt: node.data.props.alt,
      width: node.data.props.width,
      height: node.data.props.height,
      objectFit: node.data.props.objectFit,
    })
  );

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Image Settings</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs mb-1">Image URL</label>
          <input
            aria-label="Image URL"
            type="text"
            className="w-full border border-gray-300 p-2 rounded"
            value={src}
            onChange={(e) => {
              actions.setProp((props: Record<string, any>) => {
                props.src = e.target.value;
              });
            }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Alt Text</label>
          <input
            aria-label="Alt Text"
            type="text"
            className="w-full border border-gray-300 p-2 rounded"
            value={alt}
            onChange={(e) => {
              actions.setProp((props: Record<string, any>) => {
                props.alt = e.target.value;
              });
            }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Width</label>
          <input
            aria-label="Width"
            type="text"
            className="w-full border border-gray-300 p-2 rounded"
            value={width}
            onChange={(e) => {
              actions.setProp((props: Record<string, any>) => {
                props.width = e.target.value;
              });
            }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Object Fit</label>
          <select
            aria-label="Object Fit"
            className="w-full border border-gray-300 p-2 rounded"
            value={objectFit}
            onChange={(e) => {
              actions.setProp((props: Record<string, any>) => {
                props.objectFit = e.target.value as ObjectFit;
              });
            }}
          >
            <option value="contain">Contain</option>
            <option value="cover">Cover</option>
            <option value="fill">Fill</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export const HeroContainerSettings: React.FC = () => {
  const { actions, backgroundColor, padding } = useNode(
    (node) => ({
      backgroundColor: node.data.props.backgroundColor,
      padding: node.data.props.padding,
    })
  );

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Hero Container Settings</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs mb-1">Background Color</label>
          <input
            aria-label="Background Color"
            type="color"
            className="w-full border border-gray-300 p-1 rounded"
            value={backgroundColor}
            onChange={(e) => {
              actions.setProp((props: Record<string, any>) => {
                props.backgroundColor = e.target.value;
              });
            }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Padding</label>
          <input
            type="text"
            className="w-full border border-gray-300 p-2 rounded"
            value={padding}
            onChange={(e) => {
              actions.setProp((props: Record<string, any>) => {
                props.padding = e.target.value;
              });
            }}
            placeholder="40px 20px"
          />
        </div>
      </div>
    </div>
  );
};

export const ColumnSettings: React.FC = () => {
  const { actions, width } = useNode(
    (node) => ({
      width: node.data.props.width,
    })
  );

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Column Settings</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs mb-1">Width</label>
          <select
            aria-label="Width"
            className="w-full border border-gray-300 p-2 rounded"
            value={width}
            onChange={(e) => {
              actions.setProp((props: Record<string, any>) => {
                props.width = e.target.value;
              });
            }}
          >
            <option value="25%">25%</option>
            <option value="33%">33%</option>
            <option value="50%">50%</option>
            <option value="66%">66%</option>
            <option value="75%">75%</option>
            <option value="100%">100%</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export const RowSettings: React.FC = () => {
  const { actions, gap } = useNode(
    (node) => ({
      gap: node.data.props.gap,
    })
  );

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Row Settings</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs mb-1">Gap</label>
          <input
            type="text"
            className="w-full border border-gray-300 p-2 rounded"
            value={gap}
            onChange={(e) => {
              actions.setProp((props: Record<string, any>) => {
                props.gap = e.target.value;
              });
            }}
            placeholder="20px"
          />
        </div>
      </div>
    </div>
  );
};

// Now define Craft.js configurations for components AFTER all components are defined
// This solves the redeclaration issues

// Component settings for Text
TextComponent.craft = {
  props: {...defaultTextProps},
  related: {
    settings: TextSettings,
  },
  rules: {
    canDrag: true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  displayName: 'Text',
};

// Component settings for Button
ButtonComponent.craft = {
  props: {...defaultButtonProps},
  related: {
    settings: ButtonSettings,
  },
  rules: {
    canDrag: true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  displayName: 'Button',
};

// Component settings for Image
ImageComponent.craft = {
  props: {...defaultImageProps},
  related: {
    settings: ImageSettings,
  },
  rules: {
    canDrag: true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  displayName: 'Image',
};

HeroContainer.craft = {
  props: {...defaultContainerProps},
  related: {
    settings: HeroContainerSettings,
  },
  isCanvas: true,
  rules: {
    canDrag: true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  displayName: 'Hero Container',
};

Column.craft = {
  props: {...defaultColumnProps},
  related: {
    settings: ColumnSettings,
  },
  isCanvas: true,
  rules: {
    canDrag: true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  displayName: 'Column',
};

Row.craft = {
  props: {...defaultRowProps},
  related: {
    settings: RowSettings,
  },
  isCanvas: true,
  rules: {
    canDrag: true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  displayName: 'Row',
};