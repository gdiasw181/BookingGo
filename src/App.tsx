import { useState } from 'react'
import Login from './Login'

function App() {
  const [page, setPage] = useState('home')
  const [user, setUser] = useState<{ email?: string } | null>(null)

  function handleLogin(u: { email: string }) {
    setUser(u)
    setPage('booking')
  }

  function handleCancel() {
    setPage('home')
  }

  return (
    <main style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'Arial' }}>
      
      <nav style={{ display: 'flex', gap: 10, marginBottom: 30 }}>
        <button onClick={() => setPage('home')}>Home</button>
        <button onClick={() => setPage('login')}>Login</button>
        <button onClick={() => setPage('booking')}>Book</button>
        <button onClick={() => setPage('mybookings')}>My Bookings</button>
      </nav>

      {page === 'home' && (
        <>
          <h1>BookingGo</h1>
          <h2>Online Booking System</h2>
          <p>Book and manage appointments with teachers and tutors.</p>

          <button onClick={() => setPage('login')}>
            Get Started
          </button>
        </>
      )}

      {page === 'login' && (
        <Login onLogin={handleLogin} onCancel={handleCancel} />
      )}

      {page === 'booking' && (
        <>
          <h1>Book an Appointment</h1>

          <p>
            <label>Teacher / Tutor</label><br />
            <select>
              <option>Select a tutor</option>
              <option>Dr Smith</option>
              <option>Ms Taylor</option>
            </select>
          </p>

          <p>
            <label>Date</label><br />
            <input type="date" />
          </p>

          <p>
            <label>Time</label><br />
            <select>
              <option>10:00 AM</option>
              <option>11:00 AM</option>
              <option>2:00 PM</option>
            </select>
          </p>

          <button onClick={() => setPage('confirmation')}>
            Book Appointment
          </button>
        </>
      )}

      {page === 'confirmation' && (
        <>
          <h1>Booking Confirmed</h1>
          <p>Your appointment has been booked successfully.</p>

          <button onClick={() => setPage('mybookings')}>
            View My Bookings
          </button>
        </>
      )}

      {page === 'mybookings' && (
        <>
          <h1>My Bookings</h1>

          <div style={{ border: '1px solid #ccc', padding: 16 }}>
            <h3>Upcoming Appointment</h3>
            <p>Dr Smith</p>
            <p>25 August 2026 — 10:00 AM</p>

            <button>Edit</button>{' '}
            <button>Cancel</button>
          </div>
        </>
      )}

    </main>
  )
}

export default App