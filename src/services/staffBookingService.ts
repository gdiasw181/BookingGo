import { auth, db } from '../firebase'
import {
  collection, doc, getDoc, getDocs,
  query, where, runTransaction,
} from 'firebase/firestore'
import type { Booking } from '../types/booking'

async function requireStaff() {
  const user = auth.currentUser
  if (!user?.email) throw new Error('Please sign in as academic staff.')

  const account = await getDoc(doc(db, 'users', user.uid))
  if (!account.exists() || account.data().role !== 'staff') {
    throw new Error('Academic staff access is required.')
  }
  return user
}

export async function getStaffBookings(): Promise<Booking[]> {
  const user = await requireStaff()

  const profiles = await getDocs(query(
    collection(db, 'staffProfiles'),
    where('email', '==', user.email),
  ))

  const results = await Promise.all(profiles.docs.map(async (profile) => {
    const snapshot = await getDocs(query(
      collection(db, 'bookings'),
      where('staffId', '==', profile.id),
    ))

    return snapshot.docs.map((item): Booking => {
      const data = item.data()
      return {
        id: item.id,
        studentId: data.studentId,
        staffId: data.staffId,
        staffName: data.staffName,
        date: data.date,
        time: data.time,
        reason: data.reason,
        status: data.status as Booking['status'],
        createdAt: data.createdAt?.toDate?.(),
      }
    })
  }))

  return results.flat().sort((a, b) =>
    `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
  )
}

export async function decideStaffBooking(
  bookingId: string,
  decision: 'accepted' | 'rejected',
): Promise<void> {
  const user = await requireStaff()

  await runTransaction(db, async (tx) => {
    const bookingRef = doc(db, 'bookings', bookingId)
    const snapshot = await tx.get(bookingRef)

    if (!snapshot.exists()) throw new Error('Booking not found.')

    const booking = snapshot.data()
    if (booking.status !== 'pending') {
      throw new Error('Only pending bookings can be reviewed.')
    }

    const profile = await tx.get(
      doc(db, 'staffProfiles', booking.staffId)
    )
    if (!profile.exists() || profile.data().email !== user.email) {
      throw new Error('This booking is not assigned to you.')
    }

    if (decision === 'rejected') {
      const slotId =
        `${booking.staffId}_${booking.date}_${booking.time}`
      const slotRef = doc(db, 'bookingSlots', slotId)
      const slot = await tx.get(slotRef)

      if (!slot.exists() || slot.data().bookingId !== bookingId) {
        throw new Error('Booking slot does not match.')
      }

      tx.delete(slotRef)
    }

    tx.update(bookingRef, { status: decision })
  })
}