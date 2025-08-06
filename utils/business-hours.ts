export interface BusinessHours {
  [key: string]: {
    open: string
    close: string
    isOpen: boolean
  }
}

export const BUSINESS_HOURS: BusinessHours = {
  monday: { open: "14:00", close: "23:00", isOpen: true },
  tuesday: { open: "08:00", close: "23:59", isOpen: true },
  wednesday: { open: "14:00", close: "23:00", isOpen: true },
  thursday: { open: "14:00", close: "23:00", isOpen: true },
  friday: { open: "14:00", close: "23:00", isOpen: true },
  saturday: { open: "14:00", close: "23:00", isOpen: true },
  sunday: { open: "14:00", close: "23:00", isOpen: true },
}

export const DAY_NAMES = {
  monday: "Segunda-feira",
  tuesday: "Terça-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
  saturday: "Sábado",
  sunday: "Domingo",
}

export function getCurrentDayKey(): keyof BusinessHours {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const today = new Date().getDay()
  return days[today] as keyof BusinessHours
}

export function getCurrentTime(): string {
  const now = new Date()
  return now.toTimeString().slice(0, 5) // HH:MM format
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function isRestaurantOpen(): boolean {
  const currentDay = getCurrentDayKey()
  const currentTime = getCurrentTime()
  const todayHours = BUSINESS_HOURS[currentDay]

  if (!todayHours.isOpen) {
    return false
  }

  const currentMinutes = timeToMinutes(currentTime)
  const openMinutes = timeToMinutes(todayHours.open)
  const closeMinutes = timeToMinutes(todayHours.close)

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes
}

export function getNextOpenTime(): { day: string; time: string } | null {
  const currentDay = getCurrentDayKey()
  const currentTime = getCurrentTime()
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const currentDayIndex = days.indexOf(currentDay)

  // Check if we can still open today
  const todayHours = BUSINESS_HOURS[currentDay]
  if (todayHours.isOpen && timeToMinutes(currentTime) < timeToMinutes(todayHours.open)) {
    return {
      day: "hoje",
      time: todayHours.open,
    }
  }

  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7
    const nextDayKey = days[nextDayIndex] as keyof BusinessHours
    const nextDayHours = BUSINESS_HOURS[nextDayKey]

    if (nextDayHours.isOpen) {
      const dayName = i === 1 ? "amanhã" : DAY_NAMES[nextDayKey]
      return {
        day: dayName,
        time: nextDayHours.open,
      }
    }
  }

  return null
}

export function getTodayHours(): { open: string; close: string; isOpen: boolean } {
  const currentDay = getCurrentDayKey()
  return BUSINESS_HOURS[currentDay]
}
