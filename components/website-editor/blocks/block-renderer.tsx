import React from "react";
import { Block } from "./types";

// Import all block components
import { 
  HeroWelcomeBlock, 
  HeroAboutBlock, 
  HeroAdmissionsBlock,
  getHeroDefaultContent
} from "./hero-blocks";
import { 
  SchoolInfoBlock, 
  QuickFactsBlock, 
  MissionVisionBlock,
  getInformationDefaultContent
} from "./information-blocks";
import { 
  ProgramsGridBlock, 
  SubjectsListBlock, 
  AchievementsBlock,
  getAcademicDefaultContent
} from "./academic-blocks";
import { 
  StaffGridBlock, 
  StudentTestimonialsBlock, 
  ParentTestimonialsBlock,
  getCommunityDefaultContent
} from "./community-blocks";
import { 
  TwoColumnLayout, 
  ThreeColumnLayout, 
  FourColumnLayout, 
  SectionContainer,
  getLayoutDefaultContent
} from "./layout-blocks";
import {
  EventCalendarBlock,
  NewsAnnouncementsBlock,
  EventRegistrationBlock,
  getEventsDefaultContent
} from "./events-blocks";
import {
  ContactFormBlock,
  NewsletterSignupBlock,
  LiveChatBlock,
  FeedbackFormBlock,
  getInteractiveDefaultContent
} from "./interactive-blocks";

interface BlockRendererProps {
  block: Block;
  isSelected?: boolean;
  onSelect?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}

// Main block renderer component
export const BlockRenderer: React.FC<BlockRendererProps> = (props) => {
  const { block } = props;

  switch (block.type) {
    // Hero Blocks
    case 'hero-welcome':
      return <HeroWelcomeBlock {...props} />;
    case 'hero-about':
      return <HeroAboutBlock {...props} />;
    case 'hero-admissions':
      return <HeroAdmissionsBlock {...props} />;

    // Information Blocks
    case 'school-info':
      return <SchoolInfoBlock {...props} />;
    case 'quick-facts':
      return <QuickFactsBlock {...props} />;
    case 'mission-vision':
      return <MissionVisionBlock {...props} />;

    // Academic Blocks
    case 'programs-grid':
      return <ProgramsGridBlock {...props} />;
    case 'subjects-list':
      return <SubjectsListBlock {...props} />;
    case 'achievements':
      return <AchievementsBlock {...props} />;

    // Community Blocks
    case 'staff-grid':
      return <StaffGridBlock {...props} />;
    case 'student-testimonials':
      return <StudentTestimonialsBlock {...props} />;
    case 'parent-testimonials':
      return <ParentTestimonialsBlock {...props} />;

    // Events Blocks
    case 'event-calendar':
      return <EventCalendarBlock {...props} />;
    case 'news-announcements':
      return <NewsAnnouncementsBlock {...props} />;
    case 'event-registration':
      return <EventRegistrationBlock {...props} />;

    // Interactive Blocks
    case 'contact-form':
      return <ContactFormBlock {...props} />;
    case 'newsletter-signup':
      return <NewsletterSignupBlock {...props} />;
    case 'live-chat':
      return <LiveChatBlock {...props} />;
    case 'feedback-form':
      return <FeedbackFormBlock {...props} />;

    // Layout Blocks
    case 'two-column':
      return <TwoColumnLayout {...props} />;
    case 'three-column':
      return <ThreeColumnLayout {...props} />;
    case 'four-column':
      return <FourColumnLayout {...props} />;
    case 'section-container':
      return <SectionContainer {...props} />;

    // Basic Text Block
    case 'text':
      return (
        <div className="prose max-w-none p-6" style={block.styles}>
          <div dangerouslySetInnerHTML={{ __html: block.content?.html || '<p>Add your content here</p>' }} />
        </div>
      );

    default:
      return (
        <div className="p-8 bg-gray-100 rounded-lg text-center">
          <p className="text-gray-600">Unknown block type: {block.type}</p>
          <p className="text-sm text-gray-500">Block content will be rendered here</p>
        </div>
      );
  }
};

// Get default content for any block type
export const getDefaultContent = (type: string) => {
  // Handle basic text block
  if (type === 'text') {
    return {
      html: '<p>Add your content here</p>'
    };
  }
  
  // Try each category's default content function
  return (
    getHeroDefaultContent(type) ||
    getInformationDefaultContent(type) ||
    getAcademicDefaultContent(type) ||
    getCommunityDefaultContent(type) ||
    getEventsDefaultContent(type) ||
    getInteractiveDefaultContent(type) ||
    getLayoutDefaultContent(type) ||
    {}
  );
};
