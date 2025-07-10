// components/website-editor/WebsiteStylesPanel.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Palette, 
  Type, 
  Layout, 
  Spacing,
  Moon,
  Sun,
  Droplets,
  Zap,
  Heart,
  Star,
  TreePine,
  Waves
} from 'lucide-react';

interface WebsiteStylesPanelProps {
  config: any;
  onConfigChange: (updates: any) => void;
}

const COLOR_PRESETS = [
  { 
    name: 'Ocean Blue', 
    icon: Waves,
    colors: { 
      primary: '#3b82f6', 
      secondary: '#1e40af', 
      accent: '#06b6d4',
      background: '#f8fafc',
      text: '#1f2937'
    }
  },
  { 
    name: 'Forest Green', 
    icon: TreePine,
    colors: { 
      primary: '#10b981', 
      secondary: '#059669', 
      accent: '#34d399',
      background: '#f9fafb',
      text: '#1f2937'
    }
  },
  { 
    name: 'Sunset Orange', 
    icon: Sun,
    colors: { 
      primary: '#f59e0b', 
      secondary: '#d97706', 
      accent: '#fbbf24',
      background: '#fffbeb',
      text: '#1f2937'
    }
  },
  { 
    name: 'Royal Purple', 
    icon: Star,
    colors: { 
      primary: '#8b5cf6', 
      secondary: '#7c3aed', 
      accent: '#a78bfa',
      background: '#faf8ff',
      text: '#1f2937'
    }
  },
  { 
    name: 'Rose Pink', 
    icon: Heart,
    colors: { 
      primary: '#ec4899', 
      secondary: '#db2777', 
      accent: '#f472b6',
      background: '#fdf2f8',
      text: '#1f2937'
    }
  },
  { 
    name: 'Electric Blue', 
    icon: Zap,
    colors: { 
      primary: '#06b6d4', 
      secondary: '#0891b2', 
      accent: '#22d3ee',
      background: '#f0fdff',
      text: '#1f2937'
    }
  },
  { 
    name: 'Midnight Dark', 
    icon: Moon,
    colors: { 
      primary: '#6366f1', 
      secondary: '#4f46e5', 
      accent: '#818cf8',
      background: '#1f2937',
      text: '#f9fafb'
    }
  }
];

const FONT_FAMILIES = [
  { name: 'Inter', value: 'Inter, sans-serif', category: 'Modern' },
  { name: 'Roboto', value: 'Roboto, sans-serif', category: 'Modern' },
  { name: 'Open Sans', value: 'Open Sans, sans-serif', category: 'Modern' },
  { name: 'Poppins', value: 'Poppins, sans-serif', category: 'Modern' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif', category: 'Modern' },
  { name: 'Nunito', value: 'Nunito, sans-serif', category: 'Friendly' },
  { name: 'Lato', value: 'Lato, sans-serif', category: 'Professional' },
  { name: 'Source Sans Pro', value: 'Source Sans Pro, sans-serif', category: 'Professional' },
  { name: 'Merriweather', value: 'Merriweather, serif', category: 'Traditional' },
  { name: 'Playfair Display', value: 'Playfair Display, serif', category: 'Elegant' },
  { name: 'Crimson Text', value: 'Crimson Text, serif', category: 'Traditional' },
  { name: 'Libre Baskerville', value: 'Libre Baskerville, serif', category: 'Traditional' }
];

const SPACING_PRESETS = [
  { name: 'Compact', value: 'compact', description: 'Tight spacing for content-heavy pages' },
  { name: 'Comfortable', value: 'comfortable', description: 'Balanced spacing for most content' },
  { name: 'Relaxed', value: 'relaxed', description: 'Generous spacing for minimal designs' },
  { name: 'Spacious', value: 'spacious', description: 'Maximum spacing for luxury feel' }
];

const BORDER_RADIUS_PRESETS = [
  { name: 'Sharp', value: '0px', description: 'No rounded corners' },
  { name: 'Subtle', value: '4px', description: 'Slightly rounded corners' },
  { name: 'Rounded', value: '8px', description: 'Moderately rounded corners' },
  { name: 'Smooth', value: '12px', description: 'Very rounded corners' },
  { name: 'Pill', value: '24px', description: 'Pill-shaped elements' }
];

const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (color: string) => void }) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value || '#3b82f6'}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
          />
        </div>
        <Input
          value={value || '#3b82f6'}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#3b82f6"
          className="flex-1 font-mono text-sm"
        />
      </div>
    </div>
  );
};

export function WebsiteStylesPanel({ config, onConfigChange }: WebsiteStylesPanelProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handleColorChange = (colorType: string, value: string) => {
    onConfigChange({
      colors: {
        ...config.colors,
        [colorType]: value
      }
    });
  };

  const handleFontChange = (value: string) => {
    onConfigChange({
      typography: {
        ...config.typography,
        fontFamily: value
      }
    });
  };

  const handleSpacingChange = (value: string) => {
    onConfigChange({
      spacing: {
        ...config.spacing,
        preset: value
      }
    });
  };

  const handleBorderRadiusChange = (value: string) => {
    onConfigChange({
      borderRadius: value
    });
  };

  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setActivePreset(preset.name);
    onConfigChange({
      colors: preset.colors
    });
  };

  const currentColors = config.colors || {};
  const currentTypography = config.typography || {};
  const currentSpacing = config.spacing || {};

  return (
    <div className="space-y-6">
      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="effects">Effects</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Color Presets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {COLOR_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isActive = activePreset === preset.name;
                  
                  return (
                    <Button
                      key={preset.name}
                      variant={isActive ? "default" : "outline"}
                      className={`justify-start h-auto p-3 ${isActive ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => applyColorPreset(preset)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Icon className="h-4 w-4" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{preset.name}</div>
                        </div>
                        <div className="flex gap-1">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: preset.colors.secondary }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: preset.colors.accent }}
                          />
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ColorPicker
                label="Primary Color"
                value={currentColors.primary}
                onChange={(value) => handleColorChange('primary', value)}
              />
              <ColorPicker
                label="Secondary Color"
                value={currentColors.secondary}
                onChange={(value) => handleColorChange('secondary', value)}
              />
              <ColorPicker
                label="Accent Color"
                value={currentColors.accent}
                onChange={(value) => handleColorChange('accent', value)}
              />
              <ColorPicker
                label="Background Color"
                value={currentColors.background}
                onChange={(value) => handleColorChange('background', value)}
              />
              <ColorPicker
                label="Text Color"
                value={currentColors.text}
                onChange={(value) => handleColorChange('text', value)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Typography
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Font Family</Label>
                <Select
                  value={currentTypography.fontFamily}
                  onValueChange={handleFontChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select font family" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem key={font.name} value={font.value}>
                        <div className="flex items-center justify-between w-full">
                          <span style={{ fontFamily: font.value }}>{font.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {font.category}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Base Font Size</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[currentTypography.baseFontSize || 16]}
                    onValueChange={(value) => 
                      onConfigChange({
                        typography: { ...currentTypography, baseFontSize: value[0] }
                      })
                    }
                    min={14}
                    max={20}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12">
                    {currentTypography.baseFontSize || 16}px
                  </span>
                </div>
              </div>

              <div>
                <Label>Line Height</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[currentTypography.lineHeight || 1.5]}
                    onValueChange={(value) => 
                      onConfigChange({
                        typography: { ...currentTypography, lineHeight: value[0] }
                      })
                    }
                    min={1.2}
                    max={2.0}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12">
                    {currentTypography.lineHeight || 1.5}
                  </span>
                </div>
              </div>

              <div>
                <Label>Letter Spacing</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[currentTypography.letterSpacing || 0]}
                    onValueChange={(value) => 
                      onConfigChange({
                        typography: { ...currentTypography, letterSpacing: value[0] }
                      })
                    }
                    min={-0.05}
                    max={0.1}
                    step={0.01}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-16">
                    {currentTypography.letterSpacing || 0}em
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <Label>Heading Font Weight</Label>
                <Select
                  value={currentTypography.headingWeight?.toString() || '600'}
                  onValueChange={(value) => 
                    onConfigChange({
                      typography: { ...currentTypography, headingWeight: parseInt(value) }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="400">Normal (400)</SelectItem>
                    <SelectItem value="500">Medium (500)</SelectItem>
                    <SelectItem value="600">Semi Bold (600)</SelectItem>
                    <SelectItem value="700">Bold (700)</SelectItem>
                    <SelectItem value="800">Extra Bold (800)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Body Font Weight</Label>
                <Select
                  value={currentTypography.bodyWeight?.toString() || '400'}
                  onValueChange={(value) => 
                    onConfigChange({
                      typography: { ...currentTypography, bodyWeight: parseInt(value) }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">Light (300)</SelectItem>
                    <SelectItem value="400">Normal (400)</SelectItem>
                    <SelectItem value="500">Medium (500)</SelectItem>
                    <SelectItem value="600">Semi Bold (600)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Layout & Spacing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Spacing Preset</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {SPACING_PRESETS.map((preset) => (
                    <Button
                      key={preset.value}
                      variant={currentSpacing.preset === preset.value ? "default" : "outline"}
                      className="justify-start h-auto p-3"
                      onClick={() => handleSpacingChange(preset.value)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-sm text-gray-500">{preset.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label>Container Max Width</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[currentSpacing.containerMaxWidth || 1200]}
                    onValueChange={(value) => 
                      onConfigChange({
                        spacing: { ...currentSpacing, containerMaxWidth: value[0] }
                      })
                    }
                    min={960}
                    max={1600}
                    step={40}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-16">
                    {currentSpacing.containerMaxWidth || 1200}px
                  </span>
                </div>
              </div>

              <div>
                <Label>Section Vertical Padding</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[currentSpacing.sectionPadding || 80]}
                    onValueChange={(value) => 
                      onConfigChange({
                        spacing: { ...currentSpacing, sectionPadding: value[0] }
                      })
                    }
                    min={40}
                    max={160}
                    step={10}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-16">
                    {currentSpacing.sectionPadding || 80}px
                  </span>
                </div>
              </div>

              <div>
                <Label>Element Spacing</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[currentSpacing.elementSpacing || 24]}
                    onValueChange={(value) => 
                      onConfigChange({
                        spacing: { ...currentSpacing, elementSpacing: value[0] }
                      })
                    }
                    min={16}
                    max={48}
                    step={4}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-16">
                    {currentSpacing.elementSpacing || 24}px
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <Label>Border Radius</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {BORDER_RADIUS_PRESETS.map((preset) => (
                    <Button
                      key={preset.value}
                      variant={config.borderRadius === preset.value ? "default" : "outline"}
                      className="justify-start h-auto p-3"
                      onClick={() => handleBorderRadiusChange(preset.value)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div 
                          className="w-6 h-6 bg-blue-500 border"
                          style={{ borderRadius: preset.value }}
                        />
                        <div className="text-left">
                          <div className="font-medium">{preset.name}</div>
                          <div className="text-sm text-gray-500">{preset.description}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="effects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Visual Effects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Shadow Intensity</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[config.shadowIntensity || 0.1]}
                    onValueChange={(value) => 
                      onConfigChange({ shadowIntensity: value[0] })
                    }
                    min={0}
                    max={0.3}
                    step={0.05}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12">
                    {Math.round((config.shadowIntensity || 0.1) * 100)}%
                  </span>
                </div>
              </div>

              <div>
                <Label>Animation Speed</Label>
                <Select
                  value={config.animationSpeed || 'normal'}
                  onValueChange={(value) => onConfigChange({ animationSpeed: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Slow (0.5s)</SelectItem>
                    <SelectItem value="normal">Normal (0.3s)</SelectItem>
                    <SelectItem value="fast">Fast (0.15s)</SelectItem>
                    <SelectItem value="none">No Animation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Hover Effects</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Button Hover Effects</span>
                    <input
                      type="checkbox"
                      checked={config.hoverEffects?.buttons !== false}
                      onChange={(e) => 
                        onConfigChange({
                          hoverEffects: {
                            ...config.hoverEffects,
                            buttons: e.target.checked
                          }
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Image Hover Effects</span>
                    <input
                      type="checkbox"
                      checked={config.hoverEffects?.images !== false}
                      onChange={(e) => 
                        onConfigChange({
                          hoverEffects: {
                            ...config.hoverEffects,
                            images: e.target.checked
                          }
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Card Hover Effects</span>
                    <input
                      type="checkbox"
                      checked={config.hoverEffects?.cards !== false}
                      onChange={(e) => 
                        onConfigChange({
                          hoverEffects: {
                            ...config.hoverEffects,
                            cards: e.target.checked
                          }
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label>Background Pattern</Label>
                <Select
                  value={config.backgroundPattern || 'none'}
                  onValueChange={(value) => onConfigChange({ backgroundPattern: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="subtle-dots">Subtle Dots</SelectItem>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="diagonal-lines">Diagonal Lines</SelectItem>
                    <SelectItem value="topography">Topography</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Pattern Opacity</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[config.patternOpacity || 0.05]}
                    onValueChange={(value) => 
                      onConfigChange({ patternOpacity: value[0] })
                    }
                    min={0}
                    max={0.2}
                    step={0.01}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12">
                    {Math.round((config.patternOpacity || 0.05) * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}