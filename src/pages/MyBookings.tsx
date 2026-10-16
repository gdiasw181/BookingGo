
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import {
  getMyBookings,
  cancelBooking,
  rescheduleBooking,
} from '../services/bookingService'
import type { Booking } from '../types/booking'

// Format date using local time
function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Cancellation state
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Reschedule state
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  // Booking date limits
  const today = new Date()
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 21)

  const minDateString = formatLocalDate(today)
  const maxDateString = formatLocalDate(maxDate)

  // Load bookings for the signed-in student
  useEffect(() => {
    let active = true

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return

      setBookings([])
      setEditingBookingId(null)
      setError(null)
      setSuccess(null)

      if (!user) {
        setError('Please sign in to view your bookings.')
        setLoading(false)
        return
      }

      setLoading(true)

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

  // Cancel a pending booking
  async function handleCancel(bookingId: string) {
    if (cancellingId !== null || savingId !== null) return

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
    setSuccess(null)

    try {
      await cancelBooking(bookingId)

      if (auth.currentUser?.uid !== uid) return

      setEditingBookingId(null)
      setSuccess('Booking cancelled successfully.')

      try {
        const updatedBookings = await getMyBookings()

        if (auth.currentUser?.uid === uid) {
          setBookings(updatedBookings)
        }
      } catch {
        if (auth.currentUser?.uid === uid) {
          setError(
            'Booking was cancelled, but the list could not refresh. Please reload the page.'
          )
        }
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

  // Open the reschedule form
  function handleOpenReschedule(booking: Booking) {
    if (cancellingId !== null || savingId !== null) return

    if (editingBookingId === booking.id) {
      handleCloseReschedule()
      return
    }

    setEditingBookingId(booking.id)
    setNewDate(booking.date)
    setNewTime(booking.time)
    setError(null)
    setSuccess(null)
  }

  // Close the reschedule form
  function handleCloseReschedule() {
    if (savingId !== null) return

    setEditingBookingId(null)
    setNewDate('')
    setNewTime('')
  }

  // Save the new booking date and time
  async function handleSaveReschedule(booking: Booking) {
    if (savingId !== null || cancellingId !== null) return

    if (editingBookingId !== booking.id) return

    const uid = auth.currentUser?.uid

    if (!uid) {
      setError('Please sign in to reschedule a booking.')
      return
    }

    if (!newDate || !newTime) {
      setError('Please select a new date and time.')
      return
    }

    if (
      booking.date === newDate &&
      booking.time === newTime
    ) {
      setError('Please select a different date or time.')
      return
    }

    setSavingId(booking.id)
    setError(null)
    setSuccess(null)

    try {
      // Save changes using the Firestore transaction
      await rescheduleBooking(
        booking.id,
        newDate,
        newTime
      )

      if (auth.currentUser?.uid !== uid) return

      setEditingBookingId(null)
      setNewDate('')
      setNewTime('')
      setSuccess('Booking rescheduled successfully.')

      // Refresh the booking list
      try {
        const updatedBookings = await getMyBookings()

        if (auth.currentUser?.uid === uid) {
          setBookings(updatedBookings)
        }
      } catch {
        if (auth.currentUser?.uid === uid) {
          setError(
            'Booking was rescheduled, but the list could not refresh. Please reload the page.'
          )
        }
      }
    } catch (err) {
      if (auth.currentUser?.uid === uid) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to reschedule booking.'
        )
      }
    } finally {
      setSavingId(null)
    }
  }

  const inputStyle = {
    width: '100%',
    maxWidth: 350,
    boxSizing: 'border-box' as const,
    padding: '12px 14px',
    border: '1px solid #bbbbbb',
    borderRadius: 6,
    backgroundColor: 'white',
    color: '#111111',
    fontSize: 15,
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

      <p style={{ color: '#555555', marginBottom: 22 }}>
        View and manage your academic meeting requests.
      </p>

      {/* Loading */}
      {loading && (
        <p>Loading bookings...</p>
      )}

      {/* Error message */}
      {error && (
        <div
          role="alert"
          style={{
            color: '#b42318',
            backgroundColor: '#fff1f0',
            padding: 14,
            borderRadius: 6,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div
          role="status"
          style={{
            color: '#176b35',
            backgroundColor: '#eaf7ec',
            padding: 14,
            borderRadius: 6,
            marginBottom: 16,
          }}
        >
          {success}
        </div>
      )}

      {/* No bookings */}
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

      {/* Booking cards */}
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
              marginBottom: 14,
              color: '#111111',
            }}
          >
            {booking.staffName}
          </h2>

          <p style={{ marginBottom: 10 }}>
            <strong>Date:</strong> {booking.date}
          </p>

          <p style={{ marginBottom: 10 }}>
            <strong>Time:</strong> {booking.time}
          </p>

          <p style={{ marginBottom: 10 }}>
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
            <p style={{ marginBottom: 10 }}>
              <strong>Reason:</strong> {booking.reason}
            </p>
          )}

          {/* Pending bookings can be changed */}
          {booking.status === 'pending' && (
            <div style={{ marginTop: 20 }}>

              {/* Action buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleOpenReschedule(booking)}
                  disabled={
                    savingId !== null ||
                    cancellingId !== null
                  }
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#f58220',
                    color: '#111111',
                    border: 'none',
                    borderRadius: 6,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {editingBookingId === booking.id
                    ? 'Close Reschedule'
                    : 'Reschedule'}
                </button>

                <button
                  type="button"
                  onClick={() => handleCancel(booking.id)}
                  disabled={
                    cancellingId !== null ||
                    savingId !== null
                  }
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#ffffff',
                    color: '#b42318',
                    border: '1px solid #b42318',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  {cancellingId === booking.id
                    ? 'Cancelling...'
                    : 'Cancel Booking'}
                </button>
              </div>

              {/* Reschedule form */}
              {editingBookingId === booking.id && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    handleSaveReschedule(booking)
                  }}
                  style={{
                    backgroundColor: '#fff7ed',
                    padding: 24,
                    marginTop: 18,
                    borderRadius: 8,
                    border: '1px solid #f5d3a6',
                  }}
                >
                  <h3
                    style={{
                      color: '#111111',
                      marginTop: 0,
                      marginBottom: 12,
                    }}
                  >
                    Reschedule Meeting
                  </h3>

                  <p
                    style={{
                      fontSize: 14,
                      color: '#555555',
                      marginBottom: 20,
                    }}
                  >
                    Choose a new date and time for your meeting.
                  </p>

                  {/* Date input */}
                  <div style={{ marginBottom: 18 }}>
                    <label
                      htmlFor={`new-date-${booking.id}`}
                      style={{
                        display: 'block',
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      New Meeting Date
                    </label>

                    <input
                      id={`new-date-${booking.id}`}
                      type="date"
                      value={newDate}
                      min={minDateString}
                      max={maxDateString}
                      required
                      disabled={savingId !== null}
                      onChange={(event) => {
                        setNewDate(event.target.value)
                        setError(null)
                      }}
                      style={inputStyle}
                    />
                  </div>

                  {/* Time input */}
                  <div style={{ marginBottom: 18 }}>
                    <label
                      htmlFor={`new-time-${booking.id}`}
                      style={{
                        display: 'block',
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      New Meeting Time
                    </label>

                    <select
                      id={`new-time-${booking.id}`}
                      value={newTime}
                      required
                      disabled={savingId !== null}
                      onChange={(event) => {
                        setNewTime(event.target.value)
                        setError(null)
                      }}
                      style={inputStyle}
                    >
                      <option value="">
                        Select a time
                      </option>

                      <option value="10:00">
                        10:00 AM
                      </option>

                      <option value="11:00">
                        11:00 AM
                      </option>

                      <option value="14:00">
                        2:00 PM
                      </option>
                    </select>
                  </div>

                  <p
                    style={{
                      color: '#666666',
                      fontSize: 13,
                      marginBottom: 20,
                    }}
                  >
                    Bookings must be within the next 3 weeks.
                    Existing staff availability is not connected yet.
                  </p>

                  {/* Form action buttons */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="submit"
                      disabled={
                        savingId !== null ||
                        cancellingId !== null ||
                        !newDate ||
                        !newTime ||
                        (
                          booking.date === newDate &&
                          booking.time === newTime
                        )
                      }
                      style={{
                        padding: '12px 18px',
                        backgroundColor: '#f58220',
                        color: '#111111',
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 700,
                        cursor: savingId !== null
                          ? 'not-allowed'
                          : 'pointer',
                      }}
                    >
                      {savingId === booking.id
                        ? 'Saving...'
                        : 'Save Changes'}
                    </button>

                    <button
                      type="button"
                      onClick={handleCloseReschedule}
                      disabled={savingId !== null}
                      style={{
                        padding: '12px 18px',
                        backgroundColor: 'white',
                        color: '#111111',
                        border: '1px solid #999999',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      Close
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default MyBookings
