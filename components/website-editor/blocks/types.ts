import { LucideIcon } from "lucide-react";

// Block type definitions
export interface Block {
  id: string;
  type?: string;
  content: any;
  styles: any;
  sortOrder: number | null | undefined;
  isVisible?: boolean | null | undefined;
  isContainer?: boolean;
  children?: Block[];
}

export interface BlockType {
  type: string;
  label: string;
  icon: LucideIcon;
  description: string;
  category: string;
  defaultContent?: any;
}

export interface BlockRendererProps {
  block: Block;
  isSelected?: boolean;
  onSelect?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}
