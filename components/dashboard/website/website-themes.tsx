"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Palette, 
  Check, 
  Crown, 
  Eye, 
  Search,
  Grid,
  List
} from "lucide-react";

interface WebsiteTheme {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  isDefault: boolean;
  isPremium: boolean;
  category: string;
  config: any;
  styles: any;
  layouts?: any;
}

interface WebsiteConfig {
  id?: string;
  themeId?: string | null;
  theme?: WebsiteTheme | null;
  globalStyles?: any;
   isPublished?: boolean | null;  // Add this
  seoSettings?: unknown;  // Add this
  contactInfo?: unknown; 
}

interface WebsiteThemesProps {
  schoolId: string;
  currentConfig?: WebsiteConfig | null;
}

export function WebsiteThemes({ schoolId, currentConfig }: WebsiteThemesProps) {
  const [themes, setThemes] = useState<WebsiteTheme[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedThemeId, setSelectedThemeId] = useState<string | undefined>(
    currentConfig?.themeId!
  );

  // Mock themes data
  const mockThemes: WebsiteTheme[] = [
    {
      id: "default",
      name: "Classic Education",
      description: "Clean and professional theme perfect for educational institutions",
      thumbnail: "/api/placeholder/400/300",
      isDefault: true,
      isPremium: false,
      category: "education",
      config: {
        primaryColor: "#2563eb",
        secondaryColor: "#f8fafc",
        accentColor: "#0ea5e9",
        fontFamily: "Inter"
      },
      styles: {
        header: { background: "white", shadow: true },
        navigation: { style: "horizontal", position: "top" },
        footer: { background: "#1e293b", color: "white" }
      }
    },
    {
      id: "modern",
      name: "Modern Academy",
      description: "Contemporary design with bold typography and vibrant colors",
      thumbnail: "/api/placeholder/400/300",
      isDefault: false,
      isPremium: true,
      category: "education",
      config: {
        primaryColor: "#7c3aed",
        secondaryColor: "#f1f5f9",
        accentColor: "#f59e0b",
        fontFamily: "Poppins"
      },
      styles: {
        header: { background: "gradient", shadow: false },
        navigation: { style: "sidebar", position: "left" },
        footer: { background: "#7c3aed", color: "white" }
      }
    }
  ];

  useEffect(() => {
    const fetchThemes = async () => {
      setIsLoading(true);
      setTimeout(() => {
        setThemes(mockThemes);
        setIsLoading(false);
      }, 1000);
    };

    fetchThemes();
  }, [schoolId]);

  const categories = [
    { value: "all", label: "All Themes" },
    { value: "education", label: "Education" },
    { value: "corporate", label: "Corporate" },
    { value: "minimal", label: "Minimal" },
    { value: "technology", label: "Technology" }
  ];

  const filteredThemes = themes.filter(theme => {
    const matchesSearch = theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         theme.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || theme.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleApplyTheme = async (themeId: string) => {
    try {
      // TODO: Implement API call to apply theme
      console.log('Applying theme:', themeId);
      setSelectedThemeId(themeId);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  };

  const handlePreviewTheme = (themeId: string) => {
    window.open(`/preview?theme=${themeId}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-[4/3] bg-gray-200"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Website Themes</h2>
          <p className="text-muted-foreground">
            Choose a theme that reflects your school&apos;s identity and values
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {currentConfig?.theme && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 text-white rounded-full p-2">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Current Theme: {currentConfig.theme.name}</h3>
                <p className="text-sm text-gray-600">{currentConfig.theme.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search themes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredThemes.map(theme => {
          const isActive = selectedThemeId === theme.id;
          
          return (
            <Card key={theme.id} className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
              isActive ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}>
              <div className="relative aspect-[4/3] bg-gray-100">
                <img 
                  src={theme.thumbnail} 
                  alt={theme.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzllYTNhOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFByZXZpZXc8L3RleHQ+PC9zdmc+';
                  }}
                />
                
                <div className="absolute top-2 left-2 flex gap-2">
                  {theme.isDefault && (
                    <Badge variant="secondary" className="bg-gray-900 text-white">
                      Default
                    </Badge>
                  )}
                  {theme.isPremium && (
                    <Badge variant="secondary" className="bg-yellow-500 text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-blue-500 text-white rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{theme.name}</h3>
                    <Badge variant="outline" className="text-xs mt-1">
                      {categories.find(c => c.value === theme.category)?.label || theme.category}
                    </Badge>
                  </div>
                  {isActive && (
                    <Badge variant="default" className="bg-blue-500">
                      <Check className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{theme.description}</p>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handlePreviewTheme(theme.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  {!isActive ? (
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleApplyTheme(theme.id)}
                    >
                      Apply
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      className="flex-1"
                      variant="secondary"
                      disabled
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Active
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
