"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, Globe, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

interface WebsiteConfigSetupProps {
  schoolId: string;
  school: any;
}

export function WebsiteConfigSetup({ schoolId, school }: WebsiteConfigSetupProps) {
    const router = useRouter();
  const [config, setConfig] = useState({
    siteName: school?.name || "",
    tagline: "",
    isPublished: false,
    seoSettings: {
      metaTitle: "",
      metaDescription: "",
      keywords: ""
    },
    contactInfo: {
      email: school?.email || "",
      phone: school?.phone || "",
      address: school?.address || ""
    },
    socialMedia: {
      facebook: "",
      twitter: "",
      instagram: ""
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
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      const result = await response.json();
      router.refresh();
      console.log('Configuration saved successfully');
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Website Configuration Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={config.siteName}
                  onChange={(e) => setConfig(prev => ({ ...prev, siteName: e.target.value }))}
                  placeholder="Your School Name"
                />
              </div>
              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={config.tagline}
                  onChange={(e) => setConfig(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="Your school's motto or tagline"
                />
              </div>
            </div>
          </div>

          {/* SEO Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">SEO Settings</h3>
            <div>
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={config.seoSettings.metaTitle}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  seoSettings: { ...prev.seoSettings, metaTitle: e.target.value }
                }))}
                placeholder="Page title for search engines"
              />
            </div>
            <div>
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={config.seoSettings.metaDescription}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  seoSettings: { ...prev.seoSettings, metaDescription: e.target.value }
                }))}
                placeholder="Brief description for search engines"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                value={config.seoSettings.keywords}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  seoSettings: { ...prev.seoSettings, keywords: e.target.value }
                }))}
                placeholder="school, education, ghana"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={config.contactInfo.email}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    contactInfo: { ...prev.contactInfo, email: e.target.value }
                  }))}
                  placeholder="info@school.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={config.contactInfo.phone}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    contactInfo: { ...prev.contactInfo, phone: e.target.value }
                  }))}
                  placeholder="+233 XX XXX XXXX"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={config.contactInfo.address}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  contactInfo: { ...prev.contactInfo, address: e.target.value }
                }))}
                placeholder="School address"
                rows={2}
              />
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Social Media Links</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={config.socialMedia.facebook}
                  onChange={(e) => setConfig(prev => ({
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
                  value={config.socialMedia.twitter}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                  }))}
                  placeholder="https://twitter.com/yourschool"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={config.socialMedia.instagram}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                }))}
                placeholder="https://instagram.com/yourschool"
              />
            </div>
          </div>

          {/* Publish Setting */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="publish">Publish Website</Label>
              <p className="text-sm text-gray-600">Make your website visible to the public</p>
            </div>
            <Switch
              id="publish"
              checked={config.isPublished}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isPublished: checked }))}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}