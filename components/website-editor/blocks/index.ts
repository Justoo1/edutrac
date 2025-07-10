// Central block registry that imports all block types
import { BlockType } from "./types";

// Import all block categories
import { HERO_BLOCKS } from "./hero-blocks";
import { INFORMATION_BLOCKS } from "./information-blocks";
import { ACADEMIC_BLOCKS } from "./academic-blocks";
import { COMMUNITY_BLOCKS } from "./community-blocks";
import { LAYOUT_BLOCKS } from "./layout-blocks";
import { EVENTS_BLOCKS } from "./events-blocks";
import { INTERACTIVE_BLOCKS } from "./interactive-blocks";

// Combine all blocks
export const ALL_SCHOOL_BLOCKS: BlockType[] = [
  ...HERO_BLOCKS,
  ...INFORMATION_BLOCKS,
  ...ACADEMIC_BLOCKS,
  ...COMMUNITY_BLOCKS,
  ...EVENTS_BLOCKS,
  ...INTERACTIVE_BLOCKS,
  ...LAYOUT_BLOCKS,
];

// Group blocks by category
export const BLOCKS_BY_CATEGORY = ALL_SCHOOL_BLOCKS.reduce((acc, block) => {
  if (!acc[block.category]) {
    acc[block.category] = [];
  }
  acc[block.category].push(block);
  return acc;
}, {} as Record<string, BlockType[]>);

// Export all block components
export * from "./hero-blocks";
export * from "./information-blocks";
export * from "./academic-blocks";
export * from "./community-blocks";
export * from "./events-blocks";
export * from "./interactive-blocks";
export * from "./layout-blocks";
export * from "./types";
export * from "./block-renderer";
