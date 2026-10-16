

import { auth, db } from '../firebase'
import {
  doc,
  collection,
  runTransaction,
  serverTimestamp,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'

import type { Booking, BookingRequest } from '../types/booking'
import { validateBookingRequest } from '../utils/bookingValidation'


type NewBooking = Omit<BookingRequest, 'studentId'>

export async function createBooking(
  bookingData: NewBooking
): Promise<string> {
  const user = auth.currentUser

  if (!user) {
    throw new Error('Please sign in before booking.')
  }

  const booking: BookingRequest = {
    ...bookingData,
    studentId: user.uid,
  }

  // Check the booking information first
  const errors = validateBookingRequest(booking)

  if (errors.length > 0) {
    throw new Error(errors.join(' '))
  }

  // Each staff member can have only one booking per time slot
    const slotId = `${booking.staffId}_${booking.date}_${booking.time}`

  const slotRef = doc(db, 'bookingSlots', slotId)
  const bookingRef = doc(collection(db, 'bookings'))

  await runTransaction(db, async (transaction) => {
    const existingSlot = await transaction.get(slotRef)

    if (existingSlot.exists()) {
      throw new Error('This time slot is already booked.')
    }

    transaction.set(slotRef, {
      bookingId: bookingRef.id,
      staffId: booking.staffId,
      date: booking.date,
      time: booking.time,
    })

    transaction.set(bookingRef, {
      ...booking,
      status: 'pending',
      createdAt: serverTimestamp(),
    })
  })

  return bookingRef.id

  
}

export async function getMyBookings(): Promise<Booking[]> {
  const user = auth.currentUser

  if (!user) {
    throw new Error('Please sign in to view your bookings.')
  }

  // Only get bookings belonging to the signed-in student
  const bookingsQuery = query(
    collection(db, 'bookings'),
    where('studentId', '==', user.uid)
  )

  const snapshot = await getDocs(bookingsQuery)

  const bookings: Booking[] = snapshot.docs.map((bookingDoc) => {
    const data = bookingDoc.data()

    return {
      id: bookingDoc.id,
      studentId: data.studentId,
      staffId: data.staffId,
      staffName: data.staffName,
      date: data.date,
      time: data.time,
      status: data.status,
      reason: data.reason,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : undefined,
    }
  })

  // Sort bookings by date and time
  return bookings.sort((a, b) => {
    const first = `${a.date}T${a.time}`
    const second = `${b.date}T${b.time}`
    return first.localeCompare(second)
  })
}


export async function cancelBooking(bookingId: string): Promise<void> {
  const user = auth.currentUser

  if (!user) {
    throw new Error('Please sign in to cancel a booking.')
  }

  if (!bookingId.trim()) {
    throw new Error('Invalid booking ID.')
  }

  const bookingRef = doc(db, 'bookings', bookingId)

  await runTransaction(db, async (transaction) => {
    const bookingSnap = await transaction.get(bookingRef)

    if (!bookingSnap.exists()) {
      throw new Error('Booking not found.')
    }

    const booking = bookingSnap.data()

    // Only the owner can cancel the booking
    if (booking.studentId !== user.uid) {
      throw new Error('You cannot cancel another student booking.')
    }

    // Only pending bookings can be cancelled
    if (booking.status !== 'pending') {
      throw new Error('Only pending bookings can be cancelled.')
    }

    const slotId =
      `${booking.staffId}_${booking.date}_${booking.time}`

    const slotRef = doc(db, 'bookingSlots', slotId)
    const slotSnap = await transaction.get(slotRef)

    if (
      !slotSnap.exists() ||
      slotSnap.data().bookingId !== bookingId
    ) {
      throw new Error('Booking slot information does not match.')
    }

    // Change booking status and release the time slot together
    transaction.update(bookingRef, {
      status: 'cancelled',
    })

    transaction.delete(slotRef)
  })
}
