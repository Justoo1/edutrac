"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AttendanceChart({ schoolId }: { schoolId: string }) {
  // This would typically fetch from an API, but for now we'll use static data
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with timeout
    const timer = setTimeout(() => {
      // Sample data - in a real application, this would come from an API
      const sampleData = [
        {
          name: "Monday",
          Present: 95,
          Absent: 5,
          Late: 2,
        },
        {
          name: "Tuesday",
          Present: 96,
          Absent: 4,
          Late: 3,
        },
        {
          name: "Wednesday",
          Present: 94,
          Absent: 6,
          Late: 4,
        },
        {
          name: "Thursday",
          Present: 97,
          Absent: 3,
          Late: 1,
        },
        {
          name: "Friday",
          Present: 93,
          Absent: 7,
          Late: 5,
        },
      ];
      
      setData(sampleData);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [schoolId]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 0,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: 'none',
          }}
        />
        <Legend />
        <Bar dataKey="Present" fill="#4ade80" />
        <Bar dataKey="Absent" fill="#f87171" />
        <Bar dataKey="Late" fill="#facc15" />
      </BarChart>
    </ResponsiveContainer>
  );
}