"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Layout } from "lucide-react";
import Link from "next/link";

interface WebsiteBuilderProps {
  schoolId: string;
}

export function WebsiteBuilder({ schoolId }: WebsiteBuilderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Website Builder</h2>
          <p className="text-muted-foreground">
            Use our drag-and-drop builder to create beautiful pages
          </p>
        </div>
        <Button asChild>
          <Link href="/website/builder">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Builder
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <Layout className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Start Building Your Website
          </h3>
          <p className="text-gray-500 mb-4">
            Use our intuitive drag-and-drop builder to create stunning web pages
          </p>
          <Button asChild>
            <Link href="/website/builder">
              <ExternalLink className="h-4 w-4 mr-2" />
              Launch Website Builder
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
