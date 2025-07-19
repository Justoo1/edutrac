'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

// Sample data for subjects
const data = [
  { subject: 'Biology', score: 80 },
  { subject: 'Chemistry', score: 65 },
  { subject: 'Geography', score: 75 },
  { subject: 'History', score: 85 },
  { subject: 'Literature', score: 90 },
  { subject: 'Art', score: 95 }
]

export function GradeBySubjectChart() {
  const [gradeLevel, setGradeLevel] = useState<string>('Grade 3')
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'yearly'>('weekly')

  // Custom subject colors
  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      'Biology': '#7986CB',
      'Chemistry': '#64B5F6',
      'Geography': '#4FC3F7',
      'History': '#4DD0E1',
      'Literature': '#4DB6AC',
      'Art': '#81C784'
    }
    return colors[subject] || '#9E9E9E'
  }
  
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-md font-medium">Grade by Subject</CardTitle>
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            className="text-xs bg-gray-100 rounded px-2 py-1 border-none focus:ring-0"
          >
            <option>Grade 1</option>
            <option>Grade 2</option>
            <option>Grade 3</option>
            <option>Grade 4</option>
          </select>
        </div>
        <div className="flex items-center">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="text-xs bg-transparent border-none text-gray-500 focus:outline-none"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
            >
              <CartesianGrid horizontal stroke="#f5f5f5" />
              <XAxis 
                type="number" 
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9e9e9e' }}
              />
              <YAxis 
                dataKey="subject" 
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
                width={80}
              />
              {data.map((entry) => (
                <Bar 
                  key={entry.subject}
                  dataKey="score" 
                  fill={getSubjectColor(entry.subject)}
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                  background={{ fill: '#f5f5f5', radius: 4 }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
