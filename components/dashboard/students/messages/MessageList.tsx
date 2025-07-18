'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Message } from "@/types/dashboard"
import Image from "next/image"
import Link from "next/link"

// Sample data for messages
const messages: Message[] = [
  {
    id: '1',
    sender: {
      name: 'Ms. Carter',
      avatar: '/carter-avatar.jpg' 
    },
    content: "Don't forget semester 1 lab report in. Titration is due by 9 AM. Make sure you...",
    time: '4:15 PM',
    date: new Date(),
    isRead: false
  },
  {
    id: '2',
    sender: {
      name: 'Jake',
      avatar: '/jake-avatar.jpg'
    },
    content: "Hey, are we still meeting up after school to study for the math test?",
    time: '12:30 PM',
    date: new Date(),
    isRead: true
  },
  {
    id: '3',
    sender: {
      name: 'Coach Simmons',
      avatar: '/coach-avatar.jpg'
    },
    content: "Practice is moved to 1 PM today because of the assembly. Please inform the rest of...",
    time: '2:00 PM',
    date: new Date(),
    isRead: true
  }
]

export function MessagesList() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Messages</CardTitle>
        <Link href="#" className="text-xs text-blue-500 hover:underline">
          View All
        </Link>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-3 border-b pb-4 last:border-0 last:pb-0">
              <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                {message.sender.avatar ? (
                  <Image 
                    src={message.sender.avatar} 
                    alt={message.sender.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm font-medium">
                    {message.sender.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-medium truncate">
                    {message.sender.name}
                  </h4>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {message.time}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {message.content}
                </p>
              </div>
              {!message.isRead && (
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
