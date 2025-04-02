// components/dashboard/PageEditorContainer.tsx
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Simple loading spinner component
const LoadingSpinner = ({ size = "lg" }: { size?: "sm" | "lg" }) => {
  const sizeClass = size === "lg" ? "w-8 h-8" : "w-4 h-4";
  return <Loader2 className={`${sizeClass} animate-spin`} />;
};

// Dynamically import the PageEditor component (to avoid SSR issues with Craft.js)
const PageEditor = dynamic(() => import('@/components/editors/PageEditor'), {
  ssr: false,
  loading: () => <div className="min-h-[600px] flex items-center justify-center"><LoadingSpinner size="lg" /></div>,
});

interface PageEditorContainerProps {
  schoolId: string;
  initialContent?: any;
  contentId?: string | null;
  contentType?: string;
  isHero?: boolean;
}

export default function PageEditorContainer({ 
  schoolId, 
  initialContent, 
  contentId, 
  contentType = 'page', 
  isHero = false 
}: PageEditorContainerProps) {
  // Add any client-side only state or logic here

  return (
    <Suspense fallback={<div className="min-h-[600px] flex items-center justify-center"><LoadingSpinner /></div>}>
      <PageEditor 
        schoolId={schoolId} 
        initialContent={initialContent} 
        contentId={contentId} 
        contentType={contentType} 
        isHero={isHero} 
      />
    </Suspense>
  );
}