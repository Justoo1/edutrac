// components/home/VideoDemo.tsx
"use client";

import { Button } from "@tremor/react";
import Link from "next/link";
import { useState } from "react";

export default function VideoDemo() {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
    // In a real implementation, you'd use a ref to the video element
    // and call the play() method on it
  };

  return (
    <div className="w-full py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            See EduTrac in Action
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Watch how EduTrac transforms school management with its intuitive interface and powerful features.
          </p>
        </div>
        
        <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl bg-gray-200 max-w-4xl mx-auto">
          {!isPlaying ? (
            // Video thumbnail with play button
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20"></div>
              <Button 
                onClick={handlePlay}
                className="relative z-10 h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Button>
              <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-between px-6 pb-4">
                <h3 className="text-xl font-bold text-white">EduTrac Overview Demo</h3>
                <p className="text-white text-sm">3:45</p>
              </div>
            </div>
          ) : (
            // Actual video - in a real implementation, replace with an actual video player
            <video
              className="w-full h-full"
              controls
              autoPlay
              src="/videos/demo.mp4"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
        
        <div className="mt-12 flex justify-center">
          <Link
            href="/demo"
            className="inline-flex items-center px-6 py-3 border border-blue-600 text-blue-600 rounded-md font-medium hover:bg-blue-50 transition-colors"
          >
            <span>View More Tutorials</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}