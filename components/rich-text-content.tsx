"use client";

import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { useEffect, useState } from "react";
import { SanitizedContent } from "./sanitized-content";

interface RichTextContentProps {
  content: string;
}

export function RichTextContent({ content }: RichTextContentProps) {
  const [mdxSource, setMdxSource] = useState<any>(null);

  useEffect(() => {
    const prepareMdx = async () => {
      try {
        const mdx = await serialize(content, {
          mdxOptions: {
            development: process.env.NODE_ENV === "development",
          },
        });
        setMdxSource(mdx);
      } catch (error) {
        console.error("Error preparing MDX:", error);
      }
    };

    prepareMdx();
  }, [content]);

  if (!mdxSource) {
    return <SanitizedContent content={content} />;
  }

  return (
    <article className="prose prose-stone max-w-none dark:prose-invert">
      <MDXRemote {...mdxSource} />
    </article>
  );
} 