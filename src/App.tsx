import Login from './pages/Login'
import StaffProfiles from './pages/StaffProfiles'
import { useState } from 'react'
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
    <main
      style={{
        width: '100%',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <nav
        style={{
          display: 'flex',
          gap: 10,
          padding: '20px 40px',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <button onClick={() => setPage('home')}>Home</button>

        <button onClick={() => setPage('login')}>Login</button>

        <button onClick={() => setPage('staff')}>
          Academic Staff
        </button>

        <button onClick={() => setPage('booking')}>Book</button>

        <button onClick={() => setPage('mybookings')}>
          My Bookings
        </button>
      </nav>

      {page === 'home' && (
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '50px 30px',
          }}
        >
          <h1>BookingGo</h1>

          <h2>Academic Meeting Booking System</h2>

          <p>
            Book and manage academic meetings with lecturers, tutors,
            TAs, and academic mentors.
          </p>

          <button onClick={() => setPage('staff')}>
            Find Academic Staff
          </button>
        </div>
      )}

      {page === 'login' && (
        <Login onLogin={handleLogin} onCancel={handleCancel} />
      )}

      {page === 'staff' && (
        <StaffProfiles />
      )}

      {page === 'booking' && (
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '50px 30px',
          }}
        >
          <h1>Book a Meeting</h1>

          <p>
            <label>Academic Staff</label>
            <br />

            <select>
              <option>Select academic staff</option>
              <option>Dr Alex Smith</option>
              <option>Maya Chen</option>
              <option>Jordan Lee</option>
              <option>Sam Patel</option>
            </select>
          </p>

          <p>
            <label>Date</label>
            <br />

            <input type="date" />
          </p>

          <p>
            <label>Time</label>
            <br />

            <select>
              <option>Select a time</option>
              <option>10:00 AM</option>
              <option>11:00 AM</option>
              <option>2:00 PM</option>
            </select>
          </p>

          <button onClick={() => setPage('confirmation')}>
            Request Meeting
          </button>
        </div>
      )}

      {page === 'confirmation' && (
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '50px 30px',
          }}
        >
          <h1>Meeting Request Submitted</h1>

          <p>
            Your meeting request has been submitted successfully.
          </p>

          <button onClick={() => setPage('mybookings')}>
            View My Bookings
          </button>
        </div>
      )}

      {page === 'mybookings' && (
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '50px 30px',
          }}
        >
          <h1>My Bookings</h1>

          <div
            style={{
              border: '1px solid #ccc',
              padding: 20,
              marginBottom: 20,
            }}
          >
            <h3>Pending Meeting</h3>

            <p>Dr Alex Smith</p>

            <p>Software Development</p>

            <p>2 September 2026 — 10:00 AM</p>

            <button>Edit</button>{' '}

            <button>Cancel</button>
          </div>

          <div
            style={{
              border: '1px solid #ccc',
              padding: 20,
            }}
          >
            <h3>Upcoming Meeting</h3>

            <p>Maya Chen</p>

            <p>Computer Science</p>

            <p>5 September 2026 — 2:00 PM</p>
          </div>
        </div>
      )}
    </main>
  )
}

export default App