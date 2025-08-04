"use client"

import { useState, useEffect } from "react"
import { Clock, CheckCircle, XCircle } from "lucide-react"
import { isRestaurantOpen, getNextOpenTime, getTodayHours } from "@/utils/business-hours"

export function RestaurantStatus() {
  const [isOpen, setIsOpen] = useState(false)
  const [nextOpen, setNextOpen] = useState<{ day: string; time: string } | null>(null)
  const [todayHours, setTodayHours] = useState({ open: "", close: "", isOpen: false })
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    const updateStatus = () => {
      setIsOpen(isRestaurantOpen())
      setNextOpen(getNextOpenTime())
      setTodayHours(getTodayHours())
      setCurrentTime(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      )
    }

    updateStatus()
    const interval = setInterval(updateStatus, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-md p-3 mb-4 border-l-4 border-l-gray-600">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-800 text-sm">Status</span>
        </div>
        <div className="text-xs text-gray-500">{currentTime}</div>
      </div>

      <div className="flex items-center justify-between">
        {isOpen ? (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="font-bold text-sm">ABERTO</span>
            <span className="text-xs text-gray-600">até {todayHours.close}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-red-600">
            <XCircle className="w-4 h-4" />
            <span className="font-bold text-sm">FECHADO</span>
            {nextOpen && (
              <span className="text-xs text-gray-600">
                {nextOpen.day} às {nextOpen.time}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
