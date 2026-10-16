
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

// Create a new booking
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

  const errors = validateBookingRequest(booking)

  if (errors.length > 0) {
    throw new Error(errors.join(' '))
  }

  const slotId =
    `${booking.staffId}_${booking.date}_${booking.time}`

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

// Get bookings for the signed-in student
export async function getMyBookings(): Promise<Booking[]> {
  const user = auth.currentUser

  if (!user) {
    throw new Error('Please sign in to view your bookings.')
  }

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

  return bookings.sort((a, b) => {
    const first = `${a.date}T${a.time}`
    const second = `${b.date}T${b.time}`
    return first.localeCompare(second)
  })
}

// Cancel an existing pending booking
export async function cancelBooking(
  bookingId: string
): Promise<void> {
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

    if (booking.studentId !== user.uid) {
      throw new Error(
        'You cannot cancel another student booking.'
      )
    }

    if (booking.status !== 'pending') {
      throw new Error(
        'Only pending bookings can be cancelled.'
      )
    }

    const slotId =
      `${booking.staffId}_${booking.date}_${booking.time}`

    const slotRef = doc(db, 'bookingSlots', slotId)
    const slotSnap = await transaction.get(slotRef)

    if (
      !slotSnap.exists() ||
      slotSnap.data().bookingId !== bookingId
    ) {
      throw new Error(
        'Booking slot information does not match.'
      )
    }

    transaction.update(bookingRef, {
      status: 'cancelled',
    })

    transaction.delete(slotRef)
  })
}

// Reschedule an existing pending booking
export async function rescheduleBooking(
  bookingId: string,
  newDate: string,
  newTime: string
): Promise<void> {
  const user = auth.currentUser

  if (!user) {
    throw new Error('Please sign in to reschedule a booking.')
  }

  if (!bookingId.trim()) {
    throw new Error('Invalid booking ID.')
  }

  const bookingRef = doc(db, 'bookings', bookingId)

  await runTransaction(db, async (transaction) => {
    // Read the existing booking
    const bookingSnap = await transaction.get(bookingRef)

    if (!bookingSnap.exists()) {
      throw new Error('Booking not found.')
    }

    const booking = bookingSnap.data()

    // Students can only change their own bookings
    if (booking.studentId !== user.uid) {
      throw new Error(
        'You cannot reschedule another student booking.'
      )
    }

    // Only pending bookings can be changed
    if (booking.status !== 'pending') {
      throw new Error(
        'Only pending bookings can be rescheduled.'
      )
    }

    // Reject unchanged dates and times
    if (
      booking.date === newDate &&
      booking.time === newTime
    ) {
      throw new Error(
        'Please select a different date or time.'
      )
    }

    // Reuse the existing booking validation
    const errors = validateBookingRequest({
      studentId: user.uid,
      staffId: booking.staffId,
      staffName: booking.staffName,
      date: newDate,
      time: newTime,
      reason: booking.reason,
    })

    if (errors.length > 0) {
      throw new Error(errors.join(' '))
    }

    // Existing reserved slot
    const oldSlotId =
      `${booking.staffId}_${booking.date}_${booking.time}`

    // Requested new slot
    const newSlotId =
      `${booking.staffId}_${newDate}_${newTime}`

    const oldSlotRef = doc(
      db,
      'bookingSlots',
      oldSlotId
    )

    const newSlotRef = doc(
      db,
      'bookingSlots',
      newSlotId
    )

    // Read both slots before writing
    const oldSlotSnap = await transaction.get(oldSlotRef)
    const newSlotSnap = await transaction.get(newSlotRef)

    // Verify that the old slot belongs to this booking
    if (
      !oldSlotSnap.exists() ||
      oldSlotSnap.data().bookingId !== bookingId ||
      oldSlotSnap.data().staffId !== booking.staffId ||
      oldSlotSnap.data().date !== booking.date ||
      oldSlotSnap.data().time !== booking.time
    ) {
      throw new Error(
        'Existing booking slot information does not match.'
      )
    }

    // Prevent double bookings
    if (newSlotSnap.exists()) {
      throw new Error(
        'The selected time slot is already booked.'
      )
    }

    // All changes are in one Firestore transaction.
    // If the transaction fails, the old booking stays unchanged.

    // Release the previous time slot
    transaction.delete(oldSlotRef)

    // Reserve the new time slot
    transaction.set(newSlotRef, {
      bookingId,
      staffId: booking.staffId,
      date: newDate,
      time: newTime,
    })

    // Update the original booking
    transaction.update(bookingRef, {
      date: newDate,
      time: newTime,
    })
  })
}
