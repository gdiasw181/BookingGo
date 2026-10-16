
/**
 * @vitest-environment node
 */

import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  it,
  expect,
} from 'vitest'

import { readFileSync } from 'node:fs'

import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing'

import type {
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing'

import {
  doc,
  collection,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'

import type { Firestore } from 'firebase/firestore'

// Firebase Emulator test environment
let testEnv: RulesTestEnvironment

// Use port 8080 normally and 8081 for isolated QA testing
const firestorePort = Number(
  process.env.BOOKINGGO_TEST_FIRESTORE_PORT || '8080'
)

// Test booking information
const staffId = 'staff001'
const date = '2026-10-20'
const time = '10:00'

const slotId = `${staffId}_${date}_${time}`

// Create booking data for testing
function bookingData(
  studentId: string,
  bookingDate: string = date,
  bookingTime: string = time
) {
  return {
    studentId,
    staffId,
    staffName: 'Dr Alex Smith',
    date: bookingDate,
    time: bookingTime,
    status: 'pending',
    createdAt: serverTimestamp(),
  }
}

// Create booking slot data
function slotData(
  bookingId: string,
  bookingDate: string = date,
  bookingTime: string = time
) {
  return {
    bookingId,
    staffId,
    date: bookingDate,
    time: bookingTime,
  }
}

// Create an authenticated test user
function studentDb(uid: string): Firestore {
  return testEnv.authenticatedContext(uid, {
    email: `${uid}@autuni.ac.nz`,
  }).firestore() as unknown as Firestore
}

// Create a booking using a Firestore transaction
async function createTestBooking(
  db: Firestore,
  studentId: string,
  bookingId: string,
  bookingDate: string = date,
  bookingTime: string = time
) {
  const bookingRef = doc(db, 'bookings', bookingId)

  const bookingSlotId =
    `${staffId}_${bookingDate}_${bookingTime}`

  const slotRef = doc(
    db,
    'bookingSlots',
    bookingSlotId
  )

  await runTransaction(db, async (tx) => {
    const existingSlot = await tx.get(slotRef)

    if (existingSlot.exists()) {
      throw new Error('This time slot is already booked.')
    }

    tx.set(
      slotRef,
      slotData(bookingId, bookingDate, bookingTime)
    )

    tx.set(
      bookingRef,
      bookingData(studentId, bookingDate, bookingTime)
    )
  })
}

// Cancel a booking using a Firestore transaction
async function cancelTestBooking(
  db: Firestore,
  bookingId: string
) {
  const bookingRef = doc(db, 'bookings', bookingId)

  await runTransaction(db, async (tx) => {
    const bookingSnap = await tx.get(bookingRef)

    if (!bookingSnap.exists()) {
      throw new Error('Booking not found.')
    }

    const booking = bookingSnap.data()

    if (booking.status !== 'pending') {
      throw new Error(
        'Only pending bookings can be cancelled.'
      )
    }

    const bookingSlotId =
      `${booking.staffId}_${booking.date}_${booking.time}`

    const slotRef = doc(
      db,
      'bookingSlots',
      bookingSlotId
    )

    const slotSnap = await tx.get(slotRef)

    if (
      !slotSnap.exists() ||
      slotSnap.data().bookingId !== bookingId
    ) {
      throw new Error(
        'Booking slot information does not match.'
      )
    }

    // Update booking and release slot together
    tx.update(bookingRef, {
      status: 'cancelled',
    })

    tx.delete(slotRef)
  })
}

// NEW: Reschedule a booking using a transaction
async function rescheduleTestBooking(
  db: Firestore,
  studentId: string,
  bookingId: string,
  newDate: string,
  newTime: string
) {
  const bookingRef = doc(db, 'bookings', bookingId)

  await runTransaction(db, async (tx) => {
    const bookingSnap = await tx.get(bookingRef)

    if (!bookingSnap.exists()) {
      throw new Error('Booking not found.')
    }

    const booking = bookingSnap.data()

    if (booking.studentId !== studentId) {
      throw new Error(
        'You cannot reschedule another student booking.'
      )
    }

    if (booking.status !== 'pending') {
      throw new Error(
        'Only pending bookings can be rescheduled.'
      )
    }

    const oldSlotId =
      `${booking.staffId}_${booking.date}_${booking.time}`

    const newSlotId =
      `${booking.staffId}_${newDate}_${newTime}`

    if (oldSlotId === newSlotId) {
      throw new Error(
        'Please select a different date or time.'
      )
    }

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

    // Read documents before making any changes
    const oldSlotSnap = await tx.get(oldSlotRef)
    const newSlotSnap = await tx.get(newSlotRef)

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

    if (newSlotSnap.exists()) {
      throw new Error(
        'The selected time slot is already booked.'
      )
    }

    // All writes must succeed together
    tx.delete(oldSlotRef)

    tx.set(newSlotRef, {
      bookingId,
      staffId: booking.staffId,
      date: newDate,
      time: newTime,
    })

    tx.update(bookingRef, {
      date: newDate,
      time: newTime,
    })
  })
}

// Start Firebase test environment
beforeAll(async () => {
  const rules = readFileSync(
    new URL('../../firestore.rules', import.meta.url),
    'utf8'
  )

  testEnv = await initializeTestEnvironment({
    projectId: 'demo-bookinggo',
    firestore: {
      host: '127.0.0.1',
      port: firestorePort,
      rules,
    },
  })
})

// Clear only the configured TEST emulator
beforeEach(async () => {
  await testEnv.clearFirestore()
})

// Clean up after testing
afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup()
  }
})

describe('Booking Firestore Security Tests', () => {

  // TC10: Valid booking
  it('TC10: saves a valid booking', async () => {
    const db = studentDb('student1')

    await assertSucceeds(
      createTestBooking(db, 'student1', 'booking1')
    )

    const result = await getDoc(
      doc(db, 'bookings', 'booking1')
    )

    expect(result.exists()).toBe(true)
    expect(result.data()?.status).toBe('pending')
  })

  // TC11: Duplicate booking
  it('TC11: prevents duplicate time slots', async () => {
    const db = studentDb('student1')

    await createTestBooking(db, 'student1', 'booking1')

    const batch = writeBatch(db)

    batch.set(
      doc(db, 'bookings', 'booking2'),
      bookingData('student1')
    )

    batch.set(
      doc(db, 'bookingSlots', slotId),
      slotData('booking2')
    )

    await assertFails(batch.commit())
  })

  // TC12: Unauthenticated booking
  it('TC12: rejects unauthenticated bookings', async () => {
    const db = testEnv.unauthenticatedContext().firestore()

    const batch = writeBatch(db)

    batch.set(
      doc(db, 'bookings', 'booking3'),
      bookingData('student1')
    )

    batch.set(
      doc(db, 'bookingSlots', slotId),
      slotData('booking3')
    )

    await assertFails(batch.commit())
  })

  // TC13: Student privacy
  it('TC13: prevents reading another student booking', async () => {
    const db1 = studentDb('student1')
    const db2 = studentDb('student2')

    await createTestBooking(
      db1,
      'student1',
      'booking4'
    )

    await assertFails(
      getDoc(doc(db2, 'bookings', 'booking4'))
    )
  })

  // TC14: Mismatched booking information
  it('TC14: rejects mismatched booking information', async () => {
    const db = studentDb('student1')

    const batch = writeBatch(db)

    batch.set(
      doc(db, 'bookings', 'booking5'),
      {
        ...bookingData('student1'),
        staffId: 'staff002',
      }
    )

    batch.set(
      doc(db, 'bookingSlots', slotId),
      slotData('booking5')
    )

    await assertFails(batch.commit())
  })

  // TC15: Student can view own bookings
  it('TC15: student can view their own bookings', async () => {
    const db = studentDb('student1')

    await createTestBooking(
      db,
      'student1',
      'booking6'
    )

    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('studentId', '==', 'student1')
    )

    const result = await assertSucceeds(
      getDocs(bookingsQuery)
    )

    expect(result.size).toBe(1)
    expect(
      result.docs[0].data().studentId
    ).toBe('student1')
  })

  // TC16: Student cannot view another student's bookings
  it('TC16: student cannot query another student bookings', async () => {
    const db1 = studentDb('student1')
    const db2 = studentDb('student2')

    await createTestBooking(
      db1,
      'student1',
      'booking7'
    )

    const bookingsQuery = query(
      collection(db2, 'bookings'),
      where('studentId', '==', 'student1')
    )

    await assertFails(
      getDocs(bookingsQuery)
    )
  })

  // TC17: Valid booking cancellation
  it('TC17: student can cancel their own pending booking', async () => {
    const db = studentDb('student1')

    await createTestBooking(
      db,
      'student1',
      'booking8'
    )

    await assertSucceeds(
      cancelTestBooking(db, 'booking8')
    )

    const bookingSnap = await getDoc(
      doc(db, 'bookings', 'booking8')
    )

    const slotSnap = await getDoc(
      doc(db, 'bookingSlots', slotId)
    )

    expect(
      bookingSnap.data()?.status
    ).toBe('cancelled')

    expect(slotSnap.exists()).toBe(false)
  })

  // TC18: Student cannot cancel another student's booking
  it('TC18: student cannot cancel another student booking', async () => {
    const db1 = studentDb('student1')
    const db2 = studentDb('student2')

    await createTestBooking(
      db1,
      'student1',
      'booking9'
    )

    const batch = writeBatch(db2)

    batch.update(
      doc(db2, 'bookings', 'booking9'),
      { status: 'cancelled' }
    )

    batch.delete(
      doc(db2, 'bookingSlots', slotId)
    )

    await assertFails(batch.commit())
  })

  // TC19: Cancelled booking cannot be cancelled again
  it('TC19: cancelled booking cannot be cancelled again', async () => {
    const db = studentDb('student1')

    await createTestBooking(
      db,
      'student1',
      'booking10'
    )

    await cancelTestBooking(db, 'booking10')

    await expect(
      cancelTestBooking(db, 'booking10')
    ).rejects.toThrow(
      'Only pending bookings can be cancelled.'
    )
  })

  // TC20: Cannot cancel without releasing slot
  it('TC20: booking cannot be cancelled without releasing slot', async () => {
    const db = studentDb('student1')

    await createTestBooking(
      db,
      'student1',
      'booking11'
    )

    const batch = writeBatch(db)

    batch.update(
      doc(db, 'bookings', 'booking11'),
      { status: 'cancelled' }
    )

    await assertFails(batch.commit())
  })

  // TC21: Released slot can be booked again
  it('TC21: cancelled time slot can be booked again', async () => {
    const db1 = studentDb('student1')
    const db2 = studentDb('student2')

    await createTestBooking(
      db1,
      'student1',
      'booking12'
    )

    await assertSucceeds(
      cancelTestBooking(db1, 'booking12')
    )

    await assertSucceeds(
      createTestBooking(
        db2,
        'student2',
        'booking13'
      )
    )

    const newBooking = await getDoc(
      doc(db2, 'bookings', 'booking13')
    )

    expect(newBooking.exists()).toBe(true)

    expect(
      newBooking.data()?.studentId
    ).toBe('student2')
  })

  // TC22: Successful rescheduling
  it('TC22: student can reschedule own pending booking', async () => {
    const db = studentDb('student1')

    await createTestBooking(
      db,
      'student1',
      'booking14'
    )

    await assertSucceeds(
      rescheduleTestBooking(
        db,
        'student1',
        'booking14',
        date,
        '11:00'
      )
    )

    const updatedBooking = await getDoc(
      doc(db, 'bookings', 'booking14')
    )

    const oldSlot = await getDoc(
      doc(db, 'bookingSlots', slotId)
    )

    const newSlot = await getDoc(
      doc(
        db,
        'bookingSlots',
        `${staffId}_${date}_11:00`
      )
    )

    // Booking keeps its identity and pending status
    expect(updatedBooking.data()?.date).toBe(date)
    expect(updatedBooking.data()?.time).toBe('11:00')
    expect(updatedBooking.data()?.status).toBe('pending')

    // Old slot released, new slot reserved
    expect(oldSlot.exists()).toBe(false)
    expect(newSlot.exists()).toBe(true)
    expect(
      newSlot.data()?.bookingId
    ).toBe('booking14')
  })

  // TC23: Reject an occupied target slot
  it('TC23: reschedule rejects an already booked time', async () => {
    const db1 = studentDb('student1')
    const db2 = studentDb('student2')

    // Student1 books 10:00
    await createTestBooking(
      db1,
      'student1',
      'booking15'
    )

    // Student2 books 11:00
    await createTestBooking(
      db2,
      'student2',
      'booking16',
      date,
      '11:00'
    )

    // Student1 cannot move from 10:00 to occupied 11:00
    await expect(
      rescheduleTestBooking(
        db1,
        'student1',
        'booking15',
        date,
        '11:00'
      )
    ).rejects.toThrow(
      'The selected time slot is already booked.'
    )

    // Verify the original booking was not modified
    const originalBooking = await getDoc(
      doc(db1, 'bookings', 'booking15')
    )

    const originalSlot = await getDoc(
      doc(db1, 'bookingSlots', slotId)
    )

    const occupiedSlot = await getDoc(
      doc(
        db1,
        'bookingSlots',
        `${staffId}_${date}_11:00`
      )
    )

    expect(originalBooking.data()?.time).toBe('10:00')
    expect(originalBooking.data()?.status).toBe('pending')

    expect(originalSlot.exists()).toBe(true)
    expect(
      originalSlot.data()?.bookingId
    ).toBe('booking15')

    expect(occupiedSlot.exists()).toBe(true)
    expect(
      occupiedSlot.data()?.bookingId
    ).toBe('booking16')
  })

  // TC24: Another student must not reschedule
  it('TC24: another student cannot reschedule a booking', async () => {
    const db1 = studentDb('student1')
    const db2 = studentDb('student2')

    await createTestBooking(
      db1,
      'student1',
      'booking17'
    )

    const newSlotId = `${staffId}_${date}_14:00`

    // Student2 attempts a direct Firestore batch.
    // This deliberately bypasses UI and service checks
    // so the Firestore security rules are tested.

    const batch = writeBatch(db2)

    batch.update(
      doc(db2, 'bookings', 'booking17'),
      {
        date,
        time: '14:00',
      }
    )

    batch.delete(
      doc(db2, 'bookingSlots', slotId)
    )

    batch.set(
      doc(db2, 'bookingSlots', newSlotId),
      slotData('booking17', date, '14:00')
    )

    // Security rules must reject the attempt
    await assertFails(batch.commit())

    // Verify the original owner's booking is unchanged
    const originalBooking = await getDoc(
      doc(db1, 'bookings', 'booking17')
    )

    const originalSlot = await getDoc(
      doc(db1, 'bookingSlots', slotId)
    )

    const attemptedNewSlot = await getDoc(
      doc(db1, 'bookingSlots', newSlotId)
    )

    expect(originalBooking.data()?.date).toBe(date)
    expect(originalBooking.data()?.time).toBe('10:00')
    expect(originalBooking.data()?.status).toBe('pending')

    expect(originalSlot.exists()).toBe(true)
    expect(attemptedNewSlot.exists()).toBe(false)
  })
})
