export type AvailabilityStatus = 'available' | 'download_only' | 'expired'

export function getMessageAvailability(deliveredAt: string): {
  status: AvailabilityStatus
  daysRemaining: number
} {
  const delivered = new Date(deliveredAt)
  const now = new Date()
  const diffTime = now.getTime() - delivered.getTime()
  const daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (daysSince <= 15) {
    return { status: 'available', daysRemaining: 15 - daysSince }
  } else if (daysSince <= 30) {
    return { status: 'download_only', daysRemaining: 30 - daysSince }
  } else {
    return { status: 'expired', daysRemaining: 0 }
  }
}
