
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import {
  getMyBookings,
  cancelBooking,
} from '../services/bookingService'
import type { Booking } from '../types/booking'

function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return

      if (!user) {
        setBookings([])
        setError('Please sign in to view your bookings.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const result = await getMyBookings()

        if (active && auth.currentUser?.uid === user.uid) {
          setBookings(result)
        }
      } catch (err) {
        if (active && auth.currentUser?.uid === user.uid) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load bookings.'
          )
        }
      } finally {
        if (active && auth.currentUser?.uid === user.uid) {
          setLoading(false)
        }
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  async function handleCancel(bookingId: string) {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this booking?'
    )

    if (!confirmed) return

    const uid = auth.currentUser?.uid

    if (!uid) {
      setError('Please sign in to cancel a booking.')
      return
    }

    setCancellingId(bookingId)
    setError(null)

    try {
      await cancelBooking(bookingId)

      // Refresh bookings after cancellation
      const updatedBookings = await getMyBookings()

      if (auth.currentUser?.uid === uid) {
        setBookings(updatedBookings)
      }
    } catch (err) {
      if (auth.currentUser?.uid === uid) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to cancel booking.'
        )
      }
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: '40px 24px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1 style={{ color: '#111111' }}>
        My Bookings
      </h1>

      <p style={{ color: '#555555' }}>
        View and manage your academic meeting requests.
      </p>

      {loading && (
        <p>Loading bookings...</p>
      )}

      {error && (
        <p
          role="alert"
          style={{
            color: '#b42318',
            backgroundColor: '#fff1f0',
            padding: 12,
            borderRadius: 6,
          }}
        >
          {error}
        </p>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div
          style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 8,
          }}
        >
          <p>You do not have any bookings yet.</p>
        </div>
      )}

      {!loading && bookings.map((booking) => (
        <div
          key={booking.id}
          style={{
            backgroundColor: 'white',
            padding: 24,
            marginTop: 16,
            borderRadius: 8,
            borderLeft: '5px solid #f58220',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: '#111111',
            }}
          >
            {booking.staffName}
          </h2>

          <p>
            <strong>Date:</strong> {booking.date}
          </p>

          <p>
            <strong>Time:</strong> {booking.time}
          </p>

          <p>
            <strong>Status:</strong>{' '}
            <span
              style={{
                color:
                  booking.status === 'cancelled'
                    ? '#b42318'
                    : booking.status === 'accepted'
                      ? '#137333'
                      : '#a65d00',
                fontWeight: 700,
              }}
            >
              {booking.status.toUpperCase()}
            </span>
          </p>

          {booking.reason && (
            <p>
              <strong>Reason:</strong> {booking.reason}
            </p>
          )}

          {booking.status === 'pending' && (
            <button
              type="button"
              onClick={() => handleCancel(booking.id)}
              disabled={cancellingId !== null}
              style={{
                marginTop: 12,
                padding: '10px 16px',
                backgroundColor: '#ffffff',
                color: '#b42318',
                border: '1px solid #b42318',
                borderRadius: 6,
                cursor:
                  cancellingId !== null
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {cancellingId === booking.id
                ? 'Cancelling...'
                : 'Cancel Booking'}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export default MyBookings
