// components/website-editor/WebsiteSettingsPanel.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Globe, 
  Eye, 
  EyeOff, 
  Home, 
  Navigation,
  Palette,
  Search,
  Share2,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube
} from 'lucide-react';

interface WebsiteSettingsPanelProps {
  page: any;
  config: any;
  onPageChange: (updates: any) => void;
  onConfigChange: (updates: any) => void;
}

export function WebsiteSettingsPanel({ 
  page, 
  config, 
  onPageChange, 
  onConfigChange 
}: WebsiteSettingsPanelProps) {
  const handlePageUpdate = (field: string, value: any) => {
    onPageChange({ [field]: value });
  };

  const handleConfigUpdate = (field: string, value: any) => {
    onConfigChange({ [field]: value });
  };

  const handleSEOUpdate = (field: string, value: any) => {
    onConfigChange({
      seoSettings: {
        ...config.seoSettings,
        [field]: value
      }
    });
  };

  const handleContactUpdate = (field: string, value: any) => {
    onConfigChange({
      contactInfo: {
        ...config.contactInfo,
        [field]: value
      }
    });
  };

  const handleSocialUpdate = (field: string, value: any) => {
    onConfigChange({
      socialMedia: {
        ...config.socialMedia,
        [field]: value
      }
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="page" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="page">Page</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="site">Site</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="page" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Page Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pageTitle">Page Title</Label>
                <Input
                  id="pageTitle"
                  value={page.title || ''}
                  onChange={(e) => handlePageUpdate('title', e.target.value)}
                  placeholder="Enter page title"
                />
              </div>

              <div>
                <Label htmlFor="pageSlug">URL Slug</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    /
                  </span>
                  <Input
                    id="pageSlug"
                    value={page.slug || ''}
                    onChange={(e) => handlePageUpdate('slug', e.target.value)}
                    placeholder="page-url"
                    className="rounded-l-none"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This will be the URL path for your page
                </p>
              </div>

              <div>
                <Label htmlFor="pageDescription">Page Description</Label>
                <Textarea
                  id="pageDescription"
                  value={page.metaDescription || ''}
                  onChange={(e) => handlePageUpdate('metaDescription', e.target.value)}
                  placeholder="Brief description of this page"
                  rows={3}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isHomePage">Set as Home Page</Label>
                    <p className="text-sm text-gray-500">Make this the main landing page</p>
                  </div>
                  <Switch
                    id="isHomePage"
                    checked={page.isHomePage || false}
                    onCheckedChange={(checked) => handlePageUpdate('isHomePage', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="showInNav">Show in Navigation</Label>
                    <p className="text-sm text-gray-500">Display in main navigation menu</p>
                  </div>
                  <Switch
                    id="showInNav"
                    checked={page.showInNavigation !== false}
                    onCheckedChange={(checked) => handlePageUpdate('showInNavigation', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isPublished">Published</Label>
                    <p className="text-sm text-gray-500">Make page visible to visitors</p>
                  </div>
                  <Switch
                    id="isPublished"
                    checked={page.isPublished || false}
                    onCheckedChange={(checked) => handlePageUpdate('isPublished', checked)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="accessLevel">Access Level</Label>
                <Select
                  value={page.accessLevel || 'public'}
                  onValueChange={(value) => handlePageUpdate('accessLevel', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Public - Everyone can view
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4" />
                        Private - Only admins can view
                      </div>
                    </SelectItem>
                    <SelectItem value="members-only">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Members Only - Logged in users only
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                SEO Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={config.seoSettings?.metaTitle || ''}
                  onChange={(e) => handleSEOUpdate('metaTitle', e.target.value)}
                  placeholder="Page title for search engines"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 50-60 characters
                </p>
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={config.seoSettings?.metaDescription || ''}
                  onChange={(e) => handleSEOUpdate('metaDescription', e.target.value)}
                  placeholder="Brief description for search engines"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 150-160 characters
                </p>
              </div>

              <div>
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  value={config.seoSettings?.keywords || ''}
                  onChange={(e) => handleSEOUpdate('keywords', e.target.value)}
                  placeholder="school, education, ghana, accra"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate keywords with commas
                </p>
              </div>

              <div>
                <Label htmlFor="canonicalUrl">Canonical URL</Label>
                <Input
                  id="canonicalUrl"
                  value={config.seoSettings?.canonicalUrl || ''}
                  onChange={(e) => handleSEOUpdate('canonicalUrl', e.target.value)}
                  placeholder="https://yourschool.com/page"
                />
              </div>

              <Separator />

              <div>
                <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
                <Input
                  id="googleAnalytics"
                  value={config.seoSettings?.googleAnalytics || ''}
                  onChange={(e) => handleSEOUpdate('googleAnalytics', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div>
                <Label htmlFor="facebookPixel">Facebook Pixel ID</Label>
                <Input
                  id="facebookPixel"
                  value={config.seoSettings?.facebookPixel || ''}
                  onChange={(e) => handleSEOUpdate('facebookPixel', e.target.value)}
                  placeholder="123456789012345"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="site" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Site Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={config.siteName || ''}
                  onChange={(e) => handleConfigUpdate('siteName', e.target.value)}
                  placeholder="Your School Name"
                />
              </div>

              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={config.tagline || ''}
                  onChange={(e) => handleConfigUpdate('tagline', e.target.value)}
                  placeholder="Your school's motto or tagline"
                />
              </div>

              <div>
                <Label htmlFor="favicon">Favicon URL</Label>
                <Input
                  id="favicon"
                  value={config.favicon || ''}
                  onChange={(e) => handleConfigUpdate('favicon', e.target.value)}
                  placeholder="https://example.com/favicon.ico"
                />
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      value={config.contactInfo?.email || ''}
                      onChange={(e) => handleContactUpdate('email', e.target.value)}
                      placeholder="info@yourschool.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input
                      id="contactPhone"
                      value={config.contactInfo?.phone || ''}
                      onChange={(e) => handleContactUpdate('phone', e.target.value)}
                      placeholder="+233 XX XXX XXXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactAddress">Address</Label>
                    <Textarea
                      id="contactAddress"
                      value={config.contactInfo?.address || ''}
                      onChange={(e) => handleContactUpdate('address', e.target.value)}
                      placeholder="School address"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Social Media Links
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="facebook" className="flex items-center gap-2">
                      <Facebook className="h-4 w-4" />
                      Facebook
                    </Label>
                    <Input
                      id="facebook"
                      value={config.socialMedia?.facebook || ''}
                      onChange={(e) => handleSocialUpdate('facebook', e.target.value)}
                      placeholder="https://facebook.com/yourschool"
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter" className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" />
                      Twitter
                    </Label>
                    <Input
                      id="twitter"
                      value={config.socialMedia?.twitter || ''}
                      onChange={(e) => handleSocialUpdate('twitter', e.target.value)}
                      placeholder="https://twitter.com/yourschool"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram" className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </Label>
                    <Input
                      id="instagram"
                      value={config.socialMedia?.instagram || ''}
                      onChange={(e) => handleSocialUpdate('instagram', e.target.value)}
                      placeholder="https://instagram.com/yourschool"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin" className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin"
                      value={config.socialMedia?.linkedin || ''}
                      onChange={(e) => handleSocialUpdate('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/company/yourschool"
                    />
                  </div>
                  <div>
                    <Label htmlFor="youtube" className="flex items-center gap-2">
                      <Youtube className="h-4 w-4" />
                      YouTube
                    </Label>
                    <Input
                      id="youtube"
                      value={config.socialMedia?.youtube || ''}
                      onChange={(e) => handleSocialUpdate('youtube', e.target.value)}
                      placeholder="https://youtube.com/channel/yourschool"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <p className="text-sm text-gray-500">Show maintenance page to visitors</p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={config.isMaintenanceMode || false}
                  onCheckedChange={(checked) => handleConfigUpdate('isMaintenanceMode', checked)}
                />
              </div>

              {config.isMaintenanceMode && (
                <div>
                  <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                  <Textarea
                    id="maintenanceMessage"
                    value={config.maintenanceMessage || ''}
                    onChange={(e) => handleConfigUpdate('maintenanceMessage', e.target.value)}
                    placeholder="We're currently performing maintenance on our website. Please check back later."
                    rows={3}
                  />
                </div>
              )}

              <Separator />

              <div>
                <Label htmlFor="customCSS">Custom CSS</Label>
                <Textarea
                  id="customCSS"
                  value={config.customCSS || ''}
                  onChange={(e) => handleConfigUpdate('customCSS', e.target.value)}
                  placeholder="Add custom CSS styles here..."
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add custom CSS to override default styles
                </p>
              </div>

              <div>
                <Label htmlFor="customJS">Custom JavaScript</Label>
                <Textarea
                  id="customJS"
                  value={config.customJS || ''}
                  onChange={(e) => handleConfigUpdate('customJS', e.target.value)}
                  placeholder="Add custom JavaScript code here..."
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add custom JavaScript for advanced functionality
                </p>
              </div>

              <div>
                <Label htmlFor="robotsTxt">Robots.txt Rules</Label>
                <Textarea
                  id="robotsTxt"
                  value={config.robotsTxt || ''}
                  onChange={(e) => handleConfigUpdate('robotsTxt', e.target.value)}
                  placeholder="User-agent: *&#10;Disallow: /admin/"
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Configure search engine crawling rules
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}