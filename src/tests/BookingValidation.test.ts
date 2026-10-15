
import { describe, it, expect } from 'vitest'
import { validateBookingRequest } from '../utils/bookingValidation'
import type { BookingRequest } from '../types/booking'

describe('Booking Validation Tests', () => {
  // Fixed date so results do not change every day
  const now = new Date(2026, 9, 15, 12, 0)

  const validBooking: BookingRequest = {
    studentId: 'student123',
    staffId: 'staff001',
    staffName: 'Dr Alex Smith',
    date: '2026-10-16',
    time: '10:00',
  }

  it('TC01: accepts a valid future booking', () => {
    const errors = validateBookingRequest(validBooking, now)
    expect(errors).toEqual([])
  })

  it('TC02: rejects a past booking date', () => {
    const errors = validateBookingRequest(
      { ...validBooking, date: '2026-10-14' },
      now
    )

    expect(errors).toContain(
      'You cannot book a past date or time.'
    )
  })

  it('TC03: rejects a past time on the same day', () => {
    const errors = validateBookingRequest(
      { ...validBooking, date: '2026-10-15', time: '11:00' },
      now
    )

    expect(errors).toContain(
      'You cannot book a past date or time.'
    )
  })

  it('TC04: accepts a booking exactly 21 days ahead', () => {
    const errors = validateBookingRequest(
      { ...validBooking, date: '2026-11-05', time: '12:00' },
      now
    )

    expect(errors).toEqual([])
  })

  it('TC05: rejects a booking beyond 3 weeks', () => {
    const errors = validateBookingRequest(
      { ...validBooking, date: '2026-11-06' },
      now
    )

    expect(errors).toContain(
      'Bookings are only allowed within the next 3 weeks.'
    )
  })

  it('TC06: rejects an impossible calendar date', () => {
    const errors = validateBookingRequest(
      { ...validBooking, date: '2026-02-30' },
      now
    )

    expect(errors).toContain(
      'Please enter a valid date and time.'
    )
  })

  it('TC07: rejects an invalid time', () => {
    const errors = validateBookingRequest(
      { ...validBooking, time: '25:00' },
      now
    )

    expect(errors).toContain(
      'Please select a valid time.'
    )
  })

  it('TC08: rejects a missing staff selection', () => {
    const errors = validateBookingRequest(
      { ...validBooking, staffId: '', staffName: '' },
      now
    )

    expect(errors).toContain(
      'Please select academic staff.'
    )
  })

  it('TC09: rejects a missing student ID', () => {
    const errors = validateBookingRequest(
      { ...validBooking, studentId: '' },
      now
    )

    expect(errors).toContain(
      'Please sign in before booking.'
    )
  })
})
