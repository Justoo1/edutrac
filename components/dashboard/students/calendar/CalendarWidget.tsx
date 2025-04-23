'use client'

import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function CalendarWidget() {
  const [currentDate] = useState(new Date(2030, 2, 19)) // March 19, 2030 as shown in the mockup

  const getMonthDays = (year: number, month: number) => {
    // Get the number of days in the month
    return new Date(year, month + 1, 0).getDate()
  }

  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // Days in current month
    const daysInMonth = getMonthDays(year, month)
    
    // Day of the week for the first day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    
    // Days from previous month to show
    const prevMonthDays = firstDayOfMonth
    const prevMonth = month === 0 ? 11 : month - 1
    const prevMonthYear = month === 0 ? year - 1 : year
    const daysInPrevMonth = getMonthDays(prevMonthYear, prevMonth)
    
    // Calculate days from next month to show
    const totalDaysToShow = 42 // 6 rows of 7 days
    const nextMonthDays = totalDaysToShow - daysInMonth - prevMonthDays
    
    const days = []
    
    // Add days from previous month
    for (let i = daysInPrevMonth - prevMonthDays + 1; i <= daysInPrevMonth; i++) {
      days.push({
        day: i,
        month,
        year,
        isCurrentMonth: false
      })
    }
    
    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month,
        year,
        isCurrentMonth: true,
        isToday: i === currentDate.getDate()
      })
    }
    
    // Add days from next month
    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({
        day: i,
        month: month === 11 ? 0 : month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false
      })
    }
    
    return days
  }

  const days = getCalendarDays()
  
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <h3 className="text-lg font-medium">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
          </div>
          <div className="flex space-x-1">
            <button className="p-1 rounded-full hover:bg-gray-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" fill="#9E9E9E"/>
              </svg>
            </button>
            <button className="p-1 rounded-full hover:bg-gray-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6L8.59 7.41L13.17 12L8.59 16.59L10 18L16 12L10 6Z" fill="#9E9E9E"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {/* Day names */}
          {DAYS.map((day, index) => (
            <div key={index} className="text-center text-xs text-gray-500 py-1">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map((day, index) => (
            <div 
              key={index} 
              className={`text-center p-1 text-xs rounded-full cursor-pointer ${
                day.isToday
                  ? 'bg-blue-500 text-white'
                  : day.isCurrentMonth
                    ? 'hover:bg-gray-100'
                    : 'text-gray-400 hover:bg-gray-100'
              } ${
                // Highlight day 19 as it appears highlighted in the mockup
                day.isCurrentMonth && day.day === 19 ? 'bg-blue-100 text-blue-500' : ''
              }`}
            >
              {day.day}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
