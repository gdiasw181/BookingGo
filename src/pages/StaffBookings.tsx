import { useEffect, useState } from 'react'
import type { Booking } from '../types/booking'
import {
  getStaffBookings,
  decideStaffBooking,
} from '../services/staffBookingService'

function StaffBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadBookings() {
    setLoading(true)
    setError('')
    try {
      setBookings(await getStaffBookings())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBookings()
  }, [])

  async function handleDecision(
    bookingId: string,
    decision: 'accepted' | 'rejected',
  ) {
    setBusyId(bookingId)
    setError('')
    setMessage('')

    try {
      await decideStaffBooking(bookingId, decision)
      setMessage(`Booking ${decision} successfully.`)
      await loadBookings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section style={{ maxWidth: 900, margin: '0 auto', padding: 30 }}>
      <h1>Staff Bookings</h1>
      <p>View and manage meeting requests from students.</p>

      <button
        onClick={() => void loadBookings()}
        disabled={loading || busyId !== null}
      >
        Refresh Bookings
      </button>

      {error && <p role="alert" style={{ color: '#b42318' }}>{error}</p>}
      {message && <p role="status" style={{ color: '#137333' }}>{message}</p>}
      {loading && <p>Loading bookings...</p>}

      {!loading && bookings.length === 0 && !error && (
        <p>No bookings found for your staff profile.</p>
      )}

      {!loading && bookings.map((booking) => (
        <div
          key={booking.id}
          style={{
            background: 'white',
            padding: 24,
            borderRadius: 8,
            marginTop: 18,
            borderTop: '5px solid #f58220',
          }}
        >
          <h2>Meeting Request</h2>
          <p><strong>Student ID:</strong> {booking.studentId}</p>
          <p><strong>Date:</strong> {booking.date}</p>
          <p><strong>Time:</strong> {booking.time}</p>
          <p><strong>Reason:</strong> {booking.reason || 'Not provided'}</p>
          <p><strong>Status:</strong> {booking.status.toUpperCase()}</p>

          {booking.status === 'pending' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                disabled={busyId !== null}
                onClick={() => void handleDecision(booking.id, 'accepted')}
              >
                Accept
              </button>
              <button
                disabled={busyId !== null}
                onClick={() => void handleDecision(booking.id, 'rejected')}
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </section>
  )
}

export default StaffBookings