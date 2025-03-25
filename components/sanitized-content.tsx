"use client";

import { useEffect, useState } from 'react';
import createDOMPurify from 'dompurify';

interface SanitizedContentProps {
  content: string | null;
}

export function SanitizedContent({ content }: SanitizedContentProps) {
  const [sanitizedContent, setSanitizedContent] = useState('');

  useEffect(() => {
    const DOMPurify = createDOMPurify(window);
    setSanitizedContent(DOMPurify.sanitize(content || ''));
  }, [content]);
  
  return (
    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
  );
} 