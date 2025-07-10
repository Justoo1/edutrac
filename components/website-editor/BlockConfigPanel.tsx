// components/website-editor/BlockConfigPanel.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Palette, 
  Type, 
  Trash2,
  Copy,
  Eye,
  EyeOff,
  GraduationCap,
  BookOpen,
  Calendar,
  MapPin,
  Mail,
  Users
} from 'lucide-react';
import { Block } from './blocks';

interface BlockConfigPanelProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onToggleVisibility?: () => void;
}

const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (color: string) => void }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium">{label}</Label>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
      />
      <Input
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        className="flex-1 font-mono text-sm"
      />
    </div>
  </div>
);

export function BlockConfigPanel({ 
  block, 
  onUpdate, 
  onDelete, 
  onDuplicate, 
  onToggleVisibility 
}: BlockConfigPanelProps) {
  const updateContent = (updates: any) => {
    onUpdate({
      content: { ...block.content, ...updates }
    });
  };

  const updateStyles = (updates: any) => {
    onUpdate({
      styles: { ...block.styles, ...updates }
    });
  };

  const getBlockIcon = (type?: string) => {
    if (type?.includes('hero')) return GraduationCap;
    if (type?.includes('info') || type?.includes('school') || type?.includes('quick-facts') || type?.includes('mission')) return MapPin;
    if (type?.includes('program') || type?.includes('subject') || type?.includes('achievement')) return BookOpen;
    if (type?.includes('staff') || type?.includes('testimonial')) return Users;
    if (type?.includes('event') || type?.includes('news') || type?.includes('calendar')) return Calendar;
    if (type?.includes('contact') || type?.includes('newsletter') || type?.includes('chat') || type?.includes('feedback')) return Mail;
    return Settings;
  };

  const BlockIcon = getBlockIcon(block.type);

  const renderSchoolBlockContent = () => {
    switch (block.type) {
      case 'hero-welcome':
      case 'hero-about':
      case 'hero-admissions':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={block.content?.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Enter hero title"
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Textarea
                value={block.content?.subtitle || ''}
                onChange={(e) => updateContent({ subtitle: e.target.value })}
                placeholder="Enter hero subtitle"
                rows={3}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={block.content?.description || ''}
                onChange={(e) => updateContent({ description: e.target.value })}
                placeholder="Enter description"
                rows={3}
              />
            </div>
            <div>
              <Label>Button Text</Label>
              <Input
                value={block.content?.buttonText || ''}
                onChange={(e) => updateContent({ buttonText: e.target.value })}
                placeholder="Learn More"
              />
            </div>
            <div>
              <Label>Button Link</Label>
              <Input
                value={block.content?.buttonLink || ''}
                onChange={(e) => updateContent({ buttonLink: e.target.value })}
                placeholder="/about"
              />
            </div>
          </div>
        );

      case 'school-info':
        return (
          <div className="space-y-4">
            <div>
              <Label>School Name</Label>
              <Input
                value={block.content?.schoolName || ''}
                onChange={(e) => updateContent({ schoolName: e.target.value })}
                placeholder="Our School Name"
              />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea
                value={block.content?.address || ''}
                onChange={(e) => updateContent({ address: e.target.value })}
                placeholder="123 School Street, Education City"
                rows={2}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={block.content?.phone || ''}
                onChange={(e) => updateContent({ phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={block.content?.email || ''}
                onChange={(e) => updateContent({ email: e.target.value })}
                placeholder="info@school.edu"
              />
            </div>
            <div>
              <Label>Hours</Label>
              <Input
                value={block.content?.hours || ''}
                onChange={(e) => updateContent({ hours: e.target.value })}
                placeholder="Monday - Friday: 8:00 AM - 4:00 PM"
              />
            </div>
          </div>
        );

      case 'quick-facts':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={block.content?.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Quick Facts"
              />
            </div>
            <div>
              <Label>Facts (JSON format)</Label>
              <Textarea
                value={JSON.stringify(block.content?.facts || [], null, 2)}
                onChange={(e) => {
                  try {
                    const facts = JSON.parse(e.target.value);
                    updateContent({ facts });
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder={`[
  {"label": "Students Enrolled", "value": "1,200+"},
  {"label": "Teaching Staff", "value": "85"},
  {"label": "Years of Excellence", "value": "30+"}
]`}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </div>
        );

      case 'mission-vision':
        return (
          <div className="space-y-4">
            <div>
              <Label>Mission Statement</Label>
              <Textarea
                value={block.content?.mission || ''}
                onChange={(e) => updateContent({ mission: e.target.value })}
                placeholder="To provide quality education that develops critical thinking, creativity, and character in every student."
                rows={3}
              />
            </div>
            <div>
              <Label>Vision Statement</Label>
              <Textarea
                value={block.content?.vision || ''}
                onChange={(e) => updateContent({ vision: e.target.value })}
                placeholder="To be a leading educational institution that empowers students to become responsible global citizens."
                rows={3}
              />
            </div>
            <div>
              <Label>Values (comma-separated)</Label>
              <Input
                value={block.content?.values?.join(', ') || ''}
                onChange={(e) => updateContent({ values: e.target.value.split(',').map(v => v.trim()).filter(v => v) })}
                placeholder="Excellence, Integrity, Innovation, Inclusivity, Community"
              />
            </div>
          </div>
        );

      case 'programs-grid':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={block.content?.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Our Academic Programs"
              />
            </div>
            <div>
              <Label>Programs (JSON format)</Label>
              <Textarea
                value={JSON.stringify(block.content?.programs || [], null, 2)}
                onChange={(e) => {
                  try {
                    const programs = JSON.parse(e.target.value);
                    updateContent({ programs });
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder={`[
  {
    "name": "Primary Education",
    "description": "Foundation years focusing on core subjects",
    "grades": "K-5",
    "icon": "👶"
  }
]`}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </div>
        );

      case 'subjects-list':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={block.content?.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Subjects We Offer"
              />
            </div>
            <div>
              <Label>Subjects (JSON format)</Label>
              <Textarea
                value={JSON.stringify(block.content?.subjects || [], null, 2)}
                onChange={(e) => {
                  try {
                    const subjects = JSON.parse(e.target.value);
                    updateContent({ subjects });
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder={`[
  {
    "name": "Mathematics",
    "description": "Algebra, Geometry, Calculus",
    "icon": "🔢",
    "level": "All Levels"
  }
]`}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </div>
        );

      case 'achievements':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={block.content?.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Our Achievements"
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input
                value={block.content?.subtitle || ''}
                onChange={(e) => updateContent({ subtitle: e.target.value })}
                placeholder="We're proud of our students' and school's accomplishments"
              />
            </div>
            <div>
              <Label>Achievements (JSON format)</Label>
              <Textarea
                value={JSON.stringify(block.content?.achievements || [], null, 2)}
                onChange={(e) => {
                  try {
                    const achievements = JSON.parse(e.target.value);
                    updateContent({ achievements });
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder={`[
  {
    "title": "National Science Fair Winner",
    "description": "Our students won first place in the national science competition",
    "year": "2023"
  }
]`}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </div>
        );

      case 'staff-grid':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={block.content?.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Meet Our Staff"
              />
            </div>
            <div>
              <Label>Staff Members (JSON format)</Label>
              <Textarea
                value={JSON.stringify(block.content?.staff || [], null, 2)}
                onChange={(e) => {
                  try {
                    const staff = JSON.parse(e.target.value);
                    updateContent({ staff });
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder={`[
  {
    "name": "Dr. Sarah Johnson",
    "position": "Principal",
    "experience": "20 years in education",
    "email": "s.johnson@school.edu",
    "bio": "Passionate educator committed to student success",
    "image": ""
  }
]`}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </div>
        );

      case 'student-testimonials':
      case 'parent-testimonials':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={block.content?.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder={block.type === 'student-testimonials' ? "What Our Students Say" : "What Parents Say"}
              />
            </div>
            <div>
              <Label>Testimonials (JSON format)</Label>
              <Textarea
                value={JSON.stringify(block.content?.testimonials || [], null, 2)}
                onChange={(e) => {
                  try {
                    const testimonials = JSON.parse(e.target.value);
                    updateContent({ testimonials });
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder={`[
  {
    "text": "This school has given me the confidence and skills I need to succeed.",
    "author": "Alex Johnson",
    "${block.type === 'student-testimonials' ? 'grade' : 'relation'}": "${block.type === 'student-testimonials' ? 'Grade 12' : 'Parent of Grade 9 Student'}",
    "image": ""
  }
]`}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </div>
        );

      case 'event-calendar':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={block.content?.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Upcoming Events"
              />
            </div>
            <div>
              <Label>Events (JSON format)</Label>
              <Textarea
                value={JSON.stringify(block.content?.events || [], null, 2)}
                onChange={(e) => {
                  try {
                    const events = JSON.parse(e.target.value);
                    updateContent({ events });
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder={`[
  {
    "title": "Science Fair",
    "date": "March 15, 2024",
    "time": "9:00 AM - 3:00 PM",
    "location": "Main Hall",
    "description": "Annual science exhibition showcasing student projects"
  }
]`}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </div>
        );

      case 'news-announcements':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={block.content?.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Latest News & Announcements"
              />
            </div>
            <div>
              <Label>News Items (JSON format)</Label>
              <Textarea
                value={JSON.stringify(block.content?.news || [], null, 2)}
                onChange={(e) => {
                  try {
                    const news = JSON.parse(e.target.value);
                    updateContent({ news });
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder={`[
  {
    "title": "New Library Wing Opens",
    "excerpt": "We are excited to announce the opening of our new library wing",
    "date": "March 10, 2024"
  }
]`}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </div>
        );

      case 'contact-form':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={block.content?.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Contact Us"
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input
                value={block.content?.subtitle || ''}
                onChange={(e) => updateContent({ subtitle: e.target.value })}
                placeholder="Get in touch with us"
              />
            </div>
          </div>
        );

      case 'newsletter-signup':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={block.content?.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Stay Updated"
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input
                value={block.content?.subtitle || ''}
                onChange={(e) => updateContent({ subtitle: e.target.value })}
                placeholder="Subscribe to our newsletter for latest updates"
              />
            </div>
          </div>
        );

      case 'feedback-form':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={block.content?.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                placeholder="Share Your Feedback"
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input
                value={block.content?.subtitle || ''}
                onChange={(e) => updateContent({ subtitle: e.target.value })}
                placeholder="Help us improve our services"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No content settings available for this block type</p>
            <p className="text-sm mt-2">This block uses default content</p>
          </div>
        );
    }
  };

  const renderStyleControls = () => {
    return (
      <div className="space-y-4">
        <ColorPicker
          label="Background Color"
          value={block.styles?.backgroundColor}
          onChange={(color) => updateStyles({ backgroundColor: color })}
        />
        <ColorPicker
          label="Text Color"
          value={block.styles?.textColor}
          onChange={(color) => updateStyles({ textColor: color })}
        />
        <div>
          <Label>Padding</Label>
          <Select
            value={block.styles?.padding || 'medium'}
            onValueChange={(value) => updateStyles({ padding: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
              <SelectItem value="extra-large">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Text Alignment</Label>
          <Select
            value={block.styles?.textAlign || 'left'}
            onValueChange={(value) => updateStyles({ textAlign: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
              <SelectItem value="justify">Justify</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BlockIcon className="h-4 w-4" />
            <CardTitle className="text-base">
              {block.type?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Block
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {onToggleVisibility && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleVisibility}
                className="h-8 w-8 p-0"
              >
                {block.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
            )}
            {onDuplicate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDuplicate}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Type className="h-3 w-3" />
              Content
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center gap-2">
              <Palette className="h-3 w-3" />
              Style
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4">
            {renderSchoolBlockContent()}
          </TabsContent>
          
          <TabsContent value="style" className="space-y-4">
            {renderStyleControls()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
