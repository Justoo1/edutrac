// components/website-editor/DevicePreview.tsx
"use client";

import React from 'react';

interface DevicePreviewProps {
  device: 'desktop' | 'tablet' | 'mobile';
  isPreviewMode?: boolean;
  children: React.ReactNode;
}

export function DevicePreview({ device, isPreviewMode = false, children }: DevicePreviewProps) {
  const getDeviceStyles = () => {
    switch (device) {
      case 'mobile':
        return {
          width: '375px',
          height: '667px',
          minHeight: '667px',
          maxHeight: isPreviewMode ? '667px' : 'none',
          borderRadius: '25px',
          border: '8px solid #1f2937',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden'
        };
      case 'tablet':
        return {
          width: '768px',
          height: '1024px',
          minHeight: '1024px',
          maxHeight: isPreviewMode ? '1024px' : 'none',
          borderRadius: '20px',
          border: '12px solid #374151',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden'
        };
      default: // desktop
        return {
          width: '100%',
          height: '100%',
          minHeight: isPreviewMode ? '600px' : '100vh',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        };
    }
  };

  const getContainerStyles = () => {
    const baseStyles = {
      display: 'flex',
      justifyContent: 'center',
      alignItems: device === 'desktop' ? 'flex-start' : 'center',
      padding: device === 'desktop' ? '0' : '2rem',
      background: device === 'desktop' ? 'transparent' : '#f3f4f6',
      minHeight: '100%'
    };

    return baseStyles;
  };

  const deviceStyles = getDeviceStyles();
  const containerStyles = getContainerStyles();

  return (
    <div style={containerStyles}>
      <div style={deviceStyles}>
        {/* Device-specific frame elements */}
        {device === 'mobile' && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full z-50" />
        )}
        {device === 'tablet' && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gray-300 rounded-full z-50" />
        )}
        
        {/* Content */}
        <div className={`w-full h-full ${device !== 'desktop' ? 'overflow-y-auto' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}