"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Image, 
  Video, 
  FileText, 
  Search, 
  Grid, 
  List,
  Trash2,
  Copy,
  Eye,
  Edit
} from "lucide-react";

interface MediaFile {
  id: string;
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  dimensions?: { width: number; height: number };
  altText?: string;
  caption?: string;
  tags: string[];
  uploadedAt: string;
}

interface WebsiteMediaProps {
  schoolId: string;
}

export function WebsiteMedia({ schoolId }: WebsiteMediaProps) {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data
  const mockMedia: MediaFile[] = [
    {
      id: "1",
      fileName: "school-logo.png",
      originalName: "School Logo.png",
      fileUrl: "/api/placeholder/200/200",
      fileType: "image",
      mimeType: "image/png",
      fileSize: 45600,
      dimensions: { width: 200, height: 200 },
      altText: "School Logo",
      caption: "Official school logo",
      tags: ["logo", "branding"],
      uploadedAt: "2024-01-15T10:00:00Z"
    }
  ];

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true);
    try {
      // TODO: Implement file upload to server
      console.log('Uploading files:', files);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMedia(prev => [...prev, ...mockMedia]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        // eslint-disable-next-line
        return <Image className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Media Library</h2>
          <p className="text-muted-foreground">
            Upload and manage images, videos, and other media files
          </p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Upload Files'}
        </Button>
      </div>

      <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer">
        <CardContent className="p-12 text-center">
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Drag and drop files here, or click to select
          </h3>
          <p className="text-gray-500">
            Supports images (JPG, PNG, GIF), videos (MP4, MOV), and documents (PDF, DOC)
          </p>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search media..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={selectedType} onValueChange={setSelectedType}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="document">Documents</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          {/* eslint-disable-next-line */}
          <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No media files yet
          </h3>
          <p className="text-gray-500 mb-4">
            Upload your first media file to get started
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
