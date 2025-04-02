// components/editor/Toolbox.tsx
import React from 'react';
import { Element, useEditor } from '@craftjs/core';
import { 
  TextComponent, 
  ButtonComponent, 
  ImageComponent, 
  HeroContainer, 
  Row, 
  Column 
} from './EditorComponent';

export const Toolbox: React.FC = () => {
  const { connectors } = useEditor();

  return (
    <div className="bg-white rounded border border-gray-200 divide-y">
      <div className="p-2 bg-gray-100 text-xs font-medium text-gray-600">
        Drag components to the editor
      </div>
      
      {/* Text Component */}
      <div 
        className="p-3 flex items-center hover:bg-blue-50 transition-colors cursor-grab active:cursor-grabbing"
        ref={(ref: HTMLDivElement | null) => {
          if (ref) {
            connectors.create(ref, <TextComponent />);
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
        <span>Text</span>
      </div>
      
      {/* Button Component */}
      <div 
        className="p-3 flex items-center hover:bg-blue-50 transition-colors cursor-grab active:cursor-grabbing"
        ref={(ref: HTMLDivElement | null) => {
          if (ref) {
            connectors.create(ref, <ButtonComponent />);
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
        <span>Button</span>
      </div>
      
      {/* Image Component */}
      <div 
        className="p-3 flex items-center hover:bg-blue-50 transition-colors cursor-grab active:cursor-grabbing"
        ref={(ref: HTMLDivElement | null) => {
          if (ref) {
            connectors.create(ref, <ImageComponent />);
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Image</span>
      </div>
      
      {/* Hero Container */}
      <div 
        className="p-3 flex items-center hover:bg-blue-50 transition-colors cursor-grab active:cursor-grabbing"
        ref={(ref: HTMLDivElement | null) => {
          if (ref) {
            connectors.create(ref, <Element is={HeroContainer} canvas />);
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span>Hero Container</span>
      </div>
      
      {/* Row */}
      <div 
        className="p-3 flex items-center hover:bg-blue-50 transition-colors cursor-grab active:cursor-grabbing"
        ref={(ref: HTMLDivElement | null) => {
          if (ref) {
            connectors.create(ref, <Element is={Row} canvas />);
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        <span>Row</span>
      </div>
      
      {/* Column */}
      <div 
        className="p-3 flex items-center hover:bg-blue-50 transition-colors cursor-grab active:cursor-grabbing"
        ref={(ref: HTMLDivElement | null) => {
          if (ref) {
            connectors.create(ref, <Element is={Column} canvas />);
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span>Column</span>
      </div>
    </div>
  );
};