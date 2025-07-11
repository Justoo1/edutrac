"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  FileText, 
  Globe, 
  Lock,
  Home,
  ExternalLink,
  Settings,
  Search,
  Filter
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface WebsitePage {
  id: string;
  title: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  pageType: string;
  isHomePage: boolean;
  isPublished: boolean;
  showInNavigation: boolean;
  accessLevel: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface WebsitePagesProps {
  schoolId: string;
}

export function WebsitePages({ schoolId }: WebsitePagesProps) {
  const router = useRouter();
  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with actual API calls
  const mockPages: WebsitePage[] = [
    {
      id: "1",
      title: "Home",
      slug: "/",
      metaTitle: "Welcome to Our School",
      metaDescription: "Discover quality education at our institution",
      pageType: "landing",
      isHomePage: true,
      isPublished: true,
      showInNavigation: true,
      accessLevel: "public",
      publishedAt: "2024-01-15T10:00:00Z",
      createdAt: "2024-01-10T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z"
    },
    {
      id: "2",
      title: "About Us",
      slug: "/about",
      metaTitle: "About Our School - History & Mission",
      metaDescription: "Learn about our school's history, mission, and values",
      pageType: "page",
      isHomePage: false,
      isPublished: true,
      showInNavigation: true,
      accessLevel: "public",
      publishedAt: "2024-01-12T10:00:00Z",
      createdAt: "2024-01-11T10:00:00Z",
      updatedAt: "2024-01-12T10:00:00Z"
    },
    {
      id: "3",
      title: "Admissions",
      slug: "/admissions",
      pageType: "page",
      isHomePage: false,
      isPublished: false,
      showInNavigation: true,
      accessLevel: "public",
      createdAt: "2024-01-13T10:00:00Z",
      updatedAt: "2024-01-13T10:00:00Z"
    }
  ];

  useEffect(() => {
  const fetchPages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/website/pages');
      console.log({response})
      if (!response.ok) {
        toast.error(`Failed to fetch pages ${response.statusText}`);
        throw new Error('Failed to fetch pages');
      }
      const data = await response.json();
      setPages(data.pages || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
      setPages([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  fetchPages();
}, [schoolId]);

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.slug.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === "all" || 
                         (filterType === "published" && page.isPublished) ||
                         (filterType === "draft" && !page.isPublished) ||
                         (filterType === "home" && page.isHomePage);
    
    return matchesSearch && matchesFilter;
  });

  const handleCreatePage = () => {
    router.push(`/website/builder?new=true`);
  };

  const handleEditPage = (pageId: string) => {
    router.push(`/website/builder?page=${pageId}`);
  };

  const handleDeletePage = async (pageId: string) => {
    if (confirm("Are you sure you want to delete this page?")) {
      // TODO: Implement delete API call
      setPages(prev => prev.filter(page => page.id !== pageId));
    }
  };

  const handleDuplicatePage = async (pageId: string) => {
    // TODO: Implement duplicate API call
    const originalPage = pages.find(p => p.id === pageId);
    if (originalPage) {
      const duplicatedPage = {
        ...originalPage,
        id: Date.now().toString(),
        title: `${originalPage.title} (Copy)`,
        slug: `${originalPage.slug}-copy`,
        isPublished: false,
        isHomePage: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setPages(prev => [...prev, duplicatedPage]);
    }
  };

  const handleTogglePublish = async (pageId: string) => {
    // TODO: Implement publish toggle API call
    setPages(prev => prev.map(page => 
      page.id === pageId 
        ? { 
            ...page, 
            isPublished: !page.isPublished,
            publishedAt: !page.isPublished ? new Date().toISOString() : undefined
          }
        : page
    ));
    let pageData = pages.find(p => p.id === pageId);
    if (!pageData) {
      toast.error('Page not found');
      return;
    }
    if (pageData.isPublished) {
      pageData = {
        ...pageData,
        publishedAt :new Date().toISOString()
      }
    }
    const response = await fetch(`/api/website/pages/${pageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pageData),
    });
    if (response.ok) {
      toast.success('Page published successfully!');
    } else {
      toast.error('Failed to publish page');
    }
  };

  const getPageStatusBadge = (page: WebsitePage) => {
    if (page.isHomePage) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Home className="h-3 w-3 mr-1" />Home</Badge>;
    }
    if (page.isPublished) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><Globe className="h-3 w-3 mr-1" />Published</Badge>;
    }
    return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><FileText className="h-3 w-3 mr-1" />Draft</Badge>;
  };

  const getAccessLevelIcon = (accessLevel: string) => {
    switch (accessLevel) {
      case "private":
        return <Lock className="h-4 w-4 text-red-500" />;
      case "members-only":
        return <Lock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Globe className="h-4 w-4 text-green-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Website Pages</h2>
          <p className="text-muted-foreground">
            Manage your website pages and content structure
          </p>
        </div>
        <Button onClick={handleCreatePage}>
          <Plus className="h-4 w-4 mr-2" />
          New Page
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pages</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="home">Home Page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pages List */}
      <div className="space-y-4">
        {filteredPages.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterType !== "all" ? "No pages found" : "No pages yet"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterType !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by creating your first page"
                }
              </p>
              {!searchTerm && filterType === "all" && (
                <Button onClick={handleCreatePage}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Page
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredPages.map((page) => (
            <Card key={page.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{page.title}</h3>
                      {getPageStatusBadge(page)}
                      {getAccessLevelIcon(page.accessLevel)}
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">URL:</span> {page.slug}
                    </div>
                    
                    {page.metaDescription && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {page.metaDescription}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Created: {new Date(page.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(page.updatedAt).toLocaleDateString()}</span>
                      {page.publishedAt && (
                        <span>Published: {new Date(page.publishedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {/* Quick Actions */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPage(page.id)}
                      title="Edit page"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicatePage(page.id)}
                      title="Duplicate page"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    
                    {page.isPublished && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Preview page"
                        asChild
                      >
                        <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    
                    {/* <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(page.id)}
                      title={page.isPublished ? "Unpublish" : "Publish"}
                      className={page.isPublished ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                    >
                      {page.isPublished ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                    </Button> */}
                    
                    {!page.isHomePage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePage(page.id)}
                        title="Delete page"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
