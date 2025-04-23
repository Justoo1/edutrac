'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Sample data
const data = [
  { date: 'Apr 10', score: 45 },
  { date: 'Apr 11', score: 65 },
  { date: 'Apr 12', score: 35 },
  { date: 'Apr 13', score: 75 },
  { date: 'Apr 14', score: 55 },
  { date: 'Apr 15', score: 90 },
  { date: 'Apr 16', score: 65 }
]

interface ScoreTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

// Custom tooltip component
const ScoreTooltip = ({ active, payload, label }: ScoreTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow-sm">
        <p className="text-xs text-gray-600">{`${label}`}</p>
        <p className="text-sm font-semibold">{`${payload[0].value}%`}</p>
      </div>
    )
  }
  return null
}

export function ScoreActivityChart() {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Score Activity</CardTitle>
        <div className="flex items-center">
          <select
            aria-label="Timeframe"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="text-xs bg-transparent border-none text-gray-500 focus:outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFD700" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f5f5f5" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9e9e9e' }}
              />
              <YAxis 
                domain={[0, 100]} 
                ticks={[0, 25, 50, 75, 100]} 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9e9e9e' }}
              />
              <Tooltip content={<ScoreTooltip />} />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#FFD700" 
                strokeWidth={2}
                dot={{ stroke: '#FFD700', strokeWidth: 2, r: 4, fill: '#fff' }}
                activeDot={{ r: 6, stroke: '#FFD700', strokeWidth: 2, fill: '#fff' }}
                isAnimationActive={true}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Current score indicator */}
        <div className="flex items-center justify-center mt-4">
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <span className="mr-1">70</span>
            <span>%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
