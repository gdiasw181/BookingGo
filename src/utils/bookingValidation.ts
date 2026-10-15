
import type { BookingRequest } from '../types/booking'

export function validateBookingRequest(
  booking: BookingRequest,
  now: Date = new Date()
): string[] {
  const errors: string[] = []

  // Check required information
  if (!booking.studentId.trim()) {
    errors.push('Please sign in before booking.')
  }

  if (!booking.staffId.trim() || !booking.staffName.trim()) {
    errors.push('Please select academic staff.')
  }

  // Check date format: YYYY-MM-DD
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(booking.date)

  if (!dateMatch) {
    errors.push('Please enter a valid date.')
  }

  // Check time format: HH:mm (24-hour)
  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(booking.time)

  if (!timeMatch) {
    errors.push('Please select a valid time.')
  }

  if (!dateMatch || !timeMatch) {
    return errors
  }

  const year = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const day = Number(dateMatch[3])
  const hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2])

  const bookingDate = new Date(year, month - 1, day, hour, minute)

  // Reject impossible dates and times
  if (
    bookingDate.getFullYear() !== year ||
    bookingDate.getMonth() !== month - 1 ||
    bookingDate.getDate() !== day ||
    bookingDate.getHours() !== hour ||
    bookingDate.getMinutes() !== minute
  ) {
    errors.push('Please enter a valid date and time.')
    return errors
  }

  // Do not allow past dates or times
  if (bookingDate.getTime() <= now.getTime()) {
    errors.push('You cannot book a past date or time.')
  }

  // Booking must be within the next 3 weeks
  const maxDate = new Date(now)
  maxDate.setDate(maxDate.getDate() + 21)

  if (bookingDate.getTime() > maxDate.getTime()) {
    errors.push('Bookings are only allowed within the next 3 weeks.')
  }

  return errors
}
