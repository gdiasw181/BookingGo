
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { auth, db } from '../firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { createBooking } from '../services/bookingService'
import { validateBookingRequest } from '../utils/bookingValidation'

type BookingProps = {
  onBooked?: (bookingId: string) => void
}

// Temporary staff data for the prototype.
// Replace with actual staff profiles later.
const sampleStaffOptions = [
  { id: 'staff001', name: 'Dr Alex Smith' },
  { id: 'staff002', name: 'Maya Chen' },
  { id: 'staff003', name: 'Jordan Lee' },
  { id: 'staff004', name: 'Sam Patel' },
]

const timeOptions = [
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '14:00', label: '2:00 PM' },
]

function formatLocalDate(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function Booking({ onBooked }: BookingProps) {
  const [staffId, setStaffId] = useState('')
  const [staffOptions, setStaffOptions] = useState(sampleStaffOptions)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'staffProfiles'),
      (snapshot) => {
        const profiles = snapshot.docs.map((profileDoc) => ({
          id: profileDoc.id,
          name: String(profileDoc.data().name || 'Academic Staff'),
        }))

        setStaffOptions(
          profiles.length > 0 ? profiles : sampleStaffOptions
        )
      },
      (error) => {
        console.error('Failed to load staff profiles', error)
        setStaffOptions(sampleStaffOptions)
      }
    )

    return () => unsubscribe()
  }, [])
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const today = new Date()
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 21)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (saving) return

    setError(null)
    setSuccess(null)

    const staff = staffOptions.find((item) => item.id === staffId)

    if (!staff) {
      setError('Please select academic staff.')
      return
    }

    const trimmedReason = reason.trim()

    const bookingData = {
      staffId: staff.id,
      staffName: staff.name,
      date,
      time,
      ...(trimmedReason ? { reason: trimmedReason } : {}),
    }

    const errors = validateBookingRequest({
      ...bookingData,
      studentId: auth.currentUser?.uid ?? '',
    })

    if (errors.length > 0) {
      setError(errors.join(' '))
      return
    }

    if (trimmedReason.length > 500) {
      setError('Reason must be 500 characters or less.')
      return
    }

    setSaving(true)

    try {
      const bookingId = await createBooking(bookingData)

      setSuccess(
        `Your meeting request was saved successfully. Booking ID: ${bookingId}`
      )

      setStaffId('')
      setDate('')
      setTime('')
      setReason('')

      onBooked?.(bookingId)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create the booking.'
      )
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #bbbbbb',
    borderRadius: 6,
    fontSize: 15,
    color: '#111111',
    backgroundColor: 'white',
    boxSizing: 'border-box' as const,
  }

  return (
    <section
      style={{
        maxWidth: 850,
        margin: '0 auto',
        padding: '40px 24px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1 style={{ color: '#111111' }}>
        Book a Meeting
      </h1>

      <p style={{ color: '#555555', lineHeight: 1.6 }}>
        Select academic staff, choose a date and time,
        and submit your meeting request.
      </p>

      <div
        style={{
          padding: 14,
          backgroundColor: '#fff5e8',
          borderLeft: '4px solid #f58220',
          marginBottom: 24,
          fontSize: 14,
        }}
      >
        This prototype uses sample academic staff.
        Actual staff availability is not connected yet.
      </div>

      {error && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fff1f0',
            color: '#b42318',
            padding: 14,
            borderRadius: 6,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            backgroundColor: '#eaf7ec',
            color: '#176b35',
            padding: 14,
            borderRadius: 6,
            marginBottom: 20,
          }}
        >
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'white',
          padding: 28,
          borderRadius: 8,
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          display: 'grid',
          gap: 20,
        }}
      >
        <div>
          <label
            htmlFor="booking-staff"
            style={{ display: 'block', marginBottom: 8 }}
          >
            <strong>Academic Staff</strong>
          </label>

          <select
            id="booking-staff"
            value={staffId}
            onChange={(event) => setStaffId(event.target.value)}
            required
            disabled={saving}
            style={inputStyle}
          >
            <option value="">Select academic staff</option>
            {staffOptions.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="booking-date"
            style={{ display: 'block', marginBottom: 8 }}
          >
            <strong>Meeting Date</strong>
          </label>

          <input
            id="booking-date"
            type="date"
            value={date}
            min={formatLocalDate(today)}
            max={formatLocalDate(maxDate)}
            onChange={(event) => setDate(event.target.value)}
            required
            disabled={saving}
            style={inputStyle}
          />

          <p style={{ color: '#666666', fontSize: 13 }}>
            Bookings must be within the next 3 weeks.
          </p>
        </div>

        <div>
          <label
            htmlFor="booking-time"
            style={{ display: 'block', marginBottom: 8 }}
          >
            <strong>Meeting Time</strong>
          </label>

          <select
            id="booking-time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            required
            disabled={saving}
            style={inputStyle}
          >
            <option value="">Select a time</option>
            {timeOptions.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="booking-reason"
            style={{ display: 'block', marginBottom: 8 }}
          >
            <strong>Reason for Meeting (Optional)</strong>
          </label>

          <textarea
            id="booking-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            rows={4}
            disabled={saving}
            placeholder="Briefly describe your meeting request"
            style={{
              ...inputStyle,
              resize: 'vertical',
            }}
          />

          <p style={{ fontSize: 13, color: '#666666' }}>
            {reason.length}/500 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            backgroundColor: '#f58220',
            color: '#111111',
            border: 'none',
            borderRadius: 6,
            padding: '14px 20px',
            fontSize: 16,
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Submitting...' : 'Request Meeting'}
        </button>
      </form>
    </section>
  )
}

export default Booking
