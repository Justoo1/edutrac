'use client'

import { Card, CardContent } from "@/components/ui/card"

interface RewardPointsWidgetProps {
  points: number
}

export function RewardPointsWidget({ points }: RewardPointsWidgetProps) {
  return (
    <Card className="bg-pink-50 border-none">
      <CardContent className="p-4">
        <div className="flex flex-col">
          <div className="flex items-center justify-center mb-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-pink-500">
              <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM15.22 8H17.91C18.84 9.19 19.42 10.65 19.44 12.24H15.99C15.94 10.8 15.68 9.45 15.22 8ZM12 4.04C13.14 4.04 14.19 4.39 15.09 5.03C15.72 6.22 16.13 7.86 16.26 9.71H7.74C7.87 7.86 8.28 6.22 8.91 5.03C9.81 4.39 10.86 4.04 12 4.04ZM4.09 8H6.78C6.32 9.45 6.06 10.8 6.01 12.24H2.56C2.58 10.65 3.16 9.19 4.09 8ZM2.56 13.76H6.01C6.06 15.2 6.32 16.55 6.78 18H4.09C3.16 16.81 2.58 15.35 2.56 13.76ZM12 19.96C10.86 19.96 9.81 19.61 8.91 18.97C8.28 17.78 7.87 16.14 7.74 14.29H16.26C16.13 16.14 15.72 17.78 15.09 18.97C14.19 19.61 13.14 19.96 12 19.96ZM15.99 13.76H19.44C19.42 15.35 18.84 16.81 17.91 18H15.22C15.68 16.55 15.94 15.2 15.99 13.76Z" fill="currentColor"/>
            </svg>
          </div>
          <span className="text-2xl font-bold text-center">{points}</span>
          <span className="text-xs text-gray-500 text-center">Reward Points</span>
        </div>
      </CardContent>
    </Card>
  )
}