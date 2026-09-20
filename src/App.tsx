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
        backgroundColor: '#f5f3ee',
        paddingBottom: 60,
      }}
    >
      <div style={{ backgroundColor: '#111111', color: 'white', padding: '24px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 800 }}>BookingGo</h1>
          <p style={{ marginTop: 6, marginBottom: 0, color: '#dddddd' }}>Academic Meeting Booking System</p>
        </div>
      </div>

      <div style={{ height: 8, backgroundColor: '#f58220' }} />

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
          <h1 style={{ color: '#111111', fontSize: 40, marginBottom: 6 }}>BookingGo</h1>

          <h2 style={{ color: '#555555', marginTop: 0 }}>Academic Meeting Booking System</h2>

          <p style={{ color: '#555555', maxWidth: 900, lineHeight: 1.6, margin: '0 auto' }}>
            Book and manage academic meetings with lecturers, tutors,
            TAs, and academic mentors.
          </p>

          <button onClick={() => setPage('staff')} style={{ marginTop: 18, backgroundColor: '#f58220', color: 'white', padding: '10px 14px', border: 'none' }}>
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
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '50px 30px' }}>
          <div style={{ backgroundColor: 'white', padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
            <h1 style={{ color: '#111111' }}>Book a Meeting</h1>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Academic Staff</label>
              <select style={{ width: '100%', padding: '13px 14px', border: '1px solid #bbbbbb', fontSize: 15 }}>
                <option>Select academic staff</option>
                <option>Dr Alex Smith</option>
                <option>Maya Chen</option>
                <option>Jordan Lee</option>
                <option>Sam Patel</option>
              </select>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Date</label>
              <input type="date" style={{ width: '100%', padding: '13px 14px', border: '1px solid #bbbbbb', fontSize: 15 }} />
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Time</label>
              <select style={{ width: '100%', padding: '13px 14px', border: '1px solid #bbbbbb', fontSize: 15 }}>
                <option>Select a time</option>
                <option>10:00 AM</option>
                <option>11:00 AM</option>
                <option>2:00 PM</option>
              </select>
            </div>

            <div style={{ marginTop: 18 }}>
              <button onClick={() => setPage('confirmation')} style={{ backgroundColor: '#f58220', color: 'white', padding: '10px 14px', border: 'none' }}>
                Request Meeting
              </button>
            </div>
          </div>
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
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '50px 30px' }}>
          <h1 style={{ color: '#111111' }}>My Bookings</h1>

          <div style={{ backgroundColor: 'white', padding: 20, marginBottom: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
            <h3 style={{ marginTop: 0 }}>Pending Meeting</h3>

            <p>Dr Alex Smith</p>

            <p>Software Development</p>

            <p>2 September 2026 — 10:00 AM</p>

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button style={{ padding: '10px 14px', backgroundColor: '#f58220', color: 'white', border: 'none' }}>Edit</button>
              <button style={{ padding: '10px 14px', border: '1px solid #bbbbbb', background: 'white' }}>Cancel</button>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
            <h3 style={{ marginTop: 0 }}>Upcoming Meeting</h3>

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