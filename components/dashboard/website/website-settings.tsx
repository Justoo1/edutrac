"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Globe, 
  Settings, 
  Palette,
  Code,
  Share2,
  Lock,
  Eye,
  Monitor,
  Smartphone
} from "lucide-react";
import {toast } from "sonner";

interface WebsiteSettingsProps {
  schoolId: string;
  school: any;
  config?: any;
}

export function WebsiteSettings({ schoolId, school, config }: WebsiteSettingsProps) {
  const [settings, setSettings] = useState({
    siteName: config?.siteName || school?.name || "",
    tagline: config?.tagline || "",
    favicon: config?.favicon || "",
    isPublished: config?.isPublished || false,
    isMaintenanceMode: config?.isMaintenanceMode || false,
    maintenanceMessage: config?.maintenanceMessage || "Website is under maintenance. Please check back later.",
    socialMedia: config?.socialMedia || {
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
      youtube: ""
    },
    contactInfo: config?.contactInfo || {
      email: school?.email || "",
      phone: school?.phone || "",
      address: school?.address || "",
      workingHours: "Monday - Friday: 8:00 AM - 4:00 PM"
    },
    seoSettings: config?.seoSettings || {
      metaTitle: "",
      metaDescription: "",
      keywords: "",
      googleAnalytics: "",
      facebookPixel: ""
    },
    headerConfig: config?.headerConfig || {
      showLogo: true,
      showNavigation: true,
      showContactInfo: true,
      sticky: true
    },
    footerConfig: config?.footerConfig || {
      showSocialMedia: true,
      showContactInfo: true,
      showQuickLinks: true,
      copyrightText: `© ${new Date().getFullYear()} ${school?.name || "School"}. All rights reserved.`
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/website/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const result = await response.json();
      console.log('Settings saved successfully:', result);
      // TODO: Add toast notification for success
    } catch (error) {
      console.error('Failed to save settings:', error);
      // TODO: Add toast notification for error
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishToggle = async () => {
    const newPublishState = !settings.isPublished;
    setSettings(prev => ({ ...prev, isPublished: newPublishState }));
    
    try {
      const response = await fetch('/api/website/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...settings, isPublished: newPublishState }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle publish state');
      }

      console.log(newPublishState ? 'Website published' : 'Website unpublished');
    } catch (error) {
      console.error('Failed to toggle publish state:', error);
      // Revert the state
      setSettings(prev => ({ ...prev, isPublished: !newPublishState }));
    }
  };

  const websiteUrl = school?.customDomain 
    ? `https://${school.customDomain}` 
    : `https://${school?.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Website Settings</h2>
          <p className="text-muted-foreground">
            Configure your website appearance, SEO, and functionality
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={settings.isPublished}
              onCheckedChange={handlePublishToggle}
              id="publish-toggle"
            />
            <Label htmlFor="publish-toggle" className="font-medium">
              {settings.isPublished ? 'Published' : 'Draft'}
            </Label>
          </div>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Website Status */}
      <Card className={settings.isPublished ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${
                settings.isPublished ? "bg-green-500 text-white" : "bg-yellow-500 text-white"
              }`}>
                {settings.isPublished ? <Globe className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="font-semibold">
                  Website Status: {settings.isPublished ? 'Live' : 'Draft'}
                </h3>
                <p className="text-sm text-gray-600">
                  {settings.isPublished 
                    ? `Your website is live at ${websiteUrl}`
                    : 'Your website is in draft mode and not visible to the public'
                  }
                </p>
              </div>
            </div>
            {settings.isPublished && (
              <Button variant="outline" asChild>
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-4 w-4 mr-2" />
                  View Live Site
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                    placeholder="Your School Name"
                  />
                </div>
                <div>
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={settings.tagline}
                    onChange={(e) => setSettings(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="Your school's tagline"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="favicon">Favicon URL</Label>
                <Input
                  id="favicon"
                  value={settings.favicon}
                  onChange={(e) => setSettings(prev => ({ ...prev, favicon: e.target.value }))}
                  placeholder="https://example.com/favicon.ico"
                />
              </div>

              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance">Maintenance Mode</Label>
                    <p className="text-sm text-gray-600">Show maintenance page to visitors</p>
                  </div>
                  <Switch
                    id="maintenance"
                    checked={settings.isMaintenanceMode}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, isMaintenanceMode: checked }))
                    }
                  />
                </div>
                
                {settings.isMaintenanceMode && (
                  <div>
                    <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                    <Textarea
                      id="maintenanceMessage"
                      value={settings.maintenanceMessage}
                      onChange={(e) => setSettings(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={settings.seoSettings.metaTitle}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    seoSettings: { ...prev.seoSettings, metaTitle: e.target.value }
                  }))}
                  placeholder="Your School - Quality Education"
                />
              </div>
              
              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={settings.seoSettings.metaDescription}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    seoSettings: { ...prev.seoSettings, metaDescription: e.target.value }
                  }))}
                  placeholder="Describe your school in 150-160 characters"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  value={settings.seoSettings.keywords}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    seoSettings: { ...prev.seoSettings, keywords: e.target.value }
                  }))}
                  placeholder="school, education, ghana, accra"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={settings.socialMedia.facebook}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                    }))}
                    placeholder="https://facebook.com/yourschool"
                  />
                </div>
                <div>
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={settings.socialMedia.twitter}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                    }))}
                    placeholder="https://twitter.com/yourschool"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.contactInfo.email}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, email: e.target.value }
                    }))}
                    placeholder="info@yourschool.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={settings.contactInfo.phone}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, phone: e.target.value }
                    }))}
                    placeholder="+233 XX XXX XXXX"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Appearance customization coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Advanced settings coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
