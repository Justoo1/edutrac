"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface SchoolContentItem {
  id: string;
  title: string;
  description: string;
  content: string;
  contentType: "announcement" | "page" | "newsletter";
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SchoolContentProps {
  schoolId: string;
}

export function SchoolContent({ schoolId }: SchoolContentProps) {
  const [content, setContent] = useState<SchoolContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch(`/api/school-content?schoolId=${schoolId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }
        const data = await response.json();
        setContent(data);
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [schoolId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (content.length === 0) {
    return <div>No content available</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {content.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <Badge variant={item.published ? "default" : "secondary"}>
                {item.published ? "Published" : "Draft"}
              </Badge>
            </div>
            <CardDescription>
              {format(new Date(item.createdAt), "PPP")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            <div className="mt-4">
              <Badge variant="outline" className="mb-2">
                {item.contentType}
              </Badge>
              <div className="prose prose-sm max-w-none">
                {item.content}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 