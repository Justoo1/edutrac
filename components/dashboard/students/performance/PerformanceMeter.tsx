'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"

interface PerformanceMeterProps {
  gpa: number
  maxGpa: number
}

export function PerformanceMeter({ gpa, maxGpa }: PerformanceMeterProps) {
  const [selectedSemester, setSelectedSemester] = useState<'1st' | '2nd'>('1st')
  
  // Calculate percentage for the gauge
  const percentage = (gpa / maxGpa) * 100
  
  // Determine the color based on GPA
  const getColor = () => {
    if (percentage >= 80) return '#4CAF50' // Green for high performance
    if (percentage >= 60) return '#FFEB3B' // Yellow for medium performance
    return '#F44336' // Red for low performance
  }
  
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Performance</CardTitle>
        <div className="flex items-center space-x-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8C13.1 8 14 7.1 14 6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6C10 7.1 10.9 8 12 8ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM12 16C10.9 16 10 16.9 10 18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18C14 16.9 13.1 16 12 16Z" fill="#9E9E9E"/>
          </svg>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex flex-col items-center">
          <div className="relative w-full h-48 flex items-center justify-center">
            {/* Semi-circle gauge */}
            <div className="relative w-48 h-24">
              {/* Gauge background */}
              <div
                className="absolute w-full h-full"
                style={{
                  borderRadius: "100%",
                  clipPath: "polygon(0 100%, 50% 0, 100% 100%)",
                  background: "#f0f0f0"
                }}
              ></div>
              
              {/* Gauge filled part - using conic gradient for smooth fill */}
              <div
                className="absolute w-full h-full"
                style={{
                  borderRadius: "100%",
                  clipPath: "polygon(0 100%, 50% 0, 100% 100%)",
                  background: `conic-gradient(${getColor()} 0% ${percentage}%, transparent ${percentage}% 100%)`,
                  transform: "rotate(-90deg)",
                  transformOrigin: "center"
                }}
              ></div>
              
              {/* Needle indicator */}
              <div 
                className="absolute w-1 h-16 bg-gray-600 rounded-full top-24 left-24 origin-bottom transition-transform duration-1000"
                style={{ transform: `translateX(-50%) rotate(${(percentage * 1.8) - 90}deg)` }}
              ></div>
              
              {/* Center circle */}
              <div className="absolute w-4 h-4 rounded-full bg-gray-600 top-24 left-24 transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            
            {/* GPA display */}
            <div className="absolute bottom-2 flex flex-col items-center">
              <span className="text-4xl font-bold">{gpa}</span>
              <span className="text-xs text-gray-500">of {maxGpa} max GPA</span>
            </div>
          </div>
          
          <div className="flex w-full mt-2 border-t pt-2">
            <button 
              onClick={() => setSelectedSemester('1st')}
              className={`flex-1 text-xs py-1 ${
                selectedSemester === '1st' 
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600' 
                  : 'text-gray-500'
              }`}
            >
              1st Semester
            </button>
            <span className="text-gray-300">-</span>
            <button 
              onClick={() => setSelectedSemester('2nd')}
              className={`flex-1 text-xs py-1 ${
                selectedSemester === '2nd' 
                  ? 'text-blue-600 font-semibold border-b-2 border-blue-600' 
                  : 'text-gray-500'
              }`}
            >
              2nd Semester
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
