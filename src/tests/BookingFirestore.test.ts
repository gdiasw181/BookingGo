
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

// Test booking information
const staffId = 'staff001'
const date = '2026-10-20'
const time = '10:00'

const slotId = `${staffId}_${date}_${time}`

// Create booking data for testing
function bookingData(studentId: string) {
  return {
    studentId,
    staffId,
    staffName: 'Dr Alex Smith',
    date,
    time,
    status: 'pending',
    createdAt: serverTimestamp(),
  }
}

// Create booking slot data
function slotData(bookingId: string) {
  return {
    bookingId,
    staffId,
    date,
    time,
  }
}

// Create an authenticated test user
function studentDb(uid: string): Firestore {
  return testEnv.authenticatedContext(uid, {
    email: `${uid}@autuni.ac.nz`,
  }).firestore() as unknown as Firestore
}

// Create a booking using Firestore transaction
async function createTestBooking(
  db: Firestore,
  studentId: string,
  bookingId: string
) {
  const bookingRef = doc(db, 'bookings', bookingId)
  const slotRef = doc(db, 'bookingSlots', slotId)

  await runTransaction(db, async (tx) => {
    const existingSlot = await tx.get(slotRef)

    if (existingSlot.exists()) {
      throw new Error('This time slot is already booked.')
    }

    tx.set(slotRef, slotData(bookingId))
    tx.set(bookingRef, bookingData(studentId))
  })
}

// Cancel a booking using Firestore transaction
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
      throw new Error('Only pending bookings can be cancelled.')
    }

    const bookingSlotId =
      `${booking.staffId}_${booking.date}_${booking.time}`

    const slotRef = doc(db, 'bookingSlots', bookingSlotId)
    const slotSnap = await tx.get(slotRef)

    if (
      !slotSnap.exists() ||
      slotSnap.data().bookingId !== bookingId
    ) {
      throw new Error('Booking slot information does not match.')
    }

    // Update booking and release the time slot together
    tx.update(bookingRef, {
      status: 'cancelled',
    })

    tx.delete(slotRef)
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
      port: 8080,
      rules,
    },
  })
})

// Clear test data before each test
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

    await createTestBooking(db1, 'student1', 'booking4')

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

  // TC15: Student can view their own bookings
  it('TC15: student can view their own bookings', async () => {
    const db = studentDb('student1')

    await createTestBooking(db, 'student1', 'booking6')

    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('studentId', '==', 'student1')
    )

    const result = await assertSucceeds(
      getDocs(bookingsQuery)
    )

    expect(result.size).toBe(1)
    expect(result.docs[0].data().studentId).toBe('student1')
  })

  // TC16: Student cannot view another student's bookings
  it('TC16: student cannot query another student bookings', async () => {
    const db1 = studentDb('student1')
    const db2 = studentDb('student2')

    await createTestBooking(db1, 'student1', 'booking7')

    const bookingsQuery = query(
      collection(db2, 'bookings'),
      where('studentId', '==', 'student1')
    )

    await assertFails(getDocs(bookingsQuery))
  })

  // TC17: Valid booking cancellation
  it('TC17: student can cancel their own pending booking', async () => {
    const db = studentDb('student1')

    await createTestBooking(db, 'student1', 'booking8')

    await assertSucceeds(
      cancelTestBooking(db, 'booking8')
    )

    const bookingSnap = await getDoc(
      doc(db, 'bookings', 'booking8')
    )

    const slotSnap = await getDoc(
      doc(db, 'bookingSlots', slotId)
    )

    expect(bookingSnap.data()?.status).toBe('cancelled')
    expect(slotSnap.exists()).toBe(false)
  })

  // TC18: Student cannot cancel another student's booking
  it('TC18: student cannot cancel another student booking', async () => {
    const db1 = studentDb('student1')
    const db2 = studentDb('student2')

    await createTestBooking(db1, 'student1', 'booking9')

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

    await createTestBooking(db, 'student1', 'booking10')
    await cancelTestBooking(db, 'booking10')

    await expect(
      cancelTestBooking(db, 'booking10')
    ).rejects.toThrow(
      'Only pending bookings can be cancelled.'
    )
  })

  // TC20: Booking cannot be cancelled without releasing the slot
  it('TC20: booking cannot be cancelled without releasing slot', async () => {
    const db = studentDb('student1')

    await createTestBooking(db, 'student1', 'booking11')

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

    await createTestBooking(db1, 'student1', 'booking12')

    await assertSucceeds(
      cancelTestBooking(db1, 'booking12')
    )

    await assertSucceeds(
      createTestBooking(db2, 'student2', 'booking13')
    )

    const newBooking = await getDoc(
      doc(db2, 'bookings', 'booking13')
    )

    expect(newBooking.exists()).toBe(true)
    expect(newBooking.data()?.studentId).toBe('student2')
  })
})
