
import { useState } from 'react'
import StaffProfiles from './pages/StaffProfiles'
import SignUp from './components/SignUp'
import SignIn from './components/SignIn'
import Booking from './pages/Booking'
import MyBookings from './pages/MyBookings'

type Page =
  | 'home'
  | 'login'
  | 'staff'
  | 'booking'
  | 'confirmation'
  | 'mybookings'

function App() {
  const [page, setPage] = useState<Page>('home')
  const [lastBookingId, setLastBookingId] = useState<string | null>(null)
  
  
 function handleLogin(
  user: { email?: string; role?: string } | null
  ) {
  if (user?.role === 'staff') {
    setPage('staff')
    } else {
    setPage('booking')
    }
  }


  function handleBookingSuccess(bookingId: string) {
    setLastBookingId(bookingId)
    setPage('confirmation')
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
      {/* Header */}
      <header
        style={{
          backgroundColor: '#111111',
          color: 'white',
          padding: '24px 40px',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1
            style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            BookingGo
          </h1>

          <p
            style={{
              marginTop: 6,
              marginBottom: 0,
              color: '#dddddd',
            }}
          >
            Academic Meeting Booking System
          </p>
        </div>
      </header>

      <div
        style={{
          height: 8,
          backgroundColor: '#f58220',
        }}
      />

      {/* Navigation */}
      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          padding: '20px 40px',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        <button onClick={() => setPage('home')}>
          Home
        </button>

        <button onClick={() => setPage('login')}>
          Login
        </button>

        <button onClick={() => setPage('staff')}>
          Academic Staff
        </button>

        <button onClick={() => setPage('booking')}>
          Book
        </button>

        <button onClick={() => setPage('mybookings')}>
          My Bookings
        </button>
      </nav>

      {/* Home Page */}
      {page === 'home' && (
        <section
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '50px 30px',
          }}
        >
          <h1
            style={{
              color: '#111111',
              fontSize: 40,
              marginBottom: 6,
            }}
          >
            BookingGo
          </h1>

          <h2
            style={{
              color: '#555555',
              marginTop: 0,
            }}
          >
            Academic Meeting Booking System
          </h2>

          <p
            style={{
              color: '#555555',
              maxWidth: 900,
              lineHeight: 1.6,
              margin: '0 auto',
            }}
          >
            Book and manage academic meetings with lecturers,
            tutors, TAs, and academic mentors.
          </p>

          <button
            onClick={() => setPage('staff')}
            style={{
              marginTop: 18,
              backgroundColor: '#f58220',
              color: 'white',
              padding: '10px 14px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Find Academic Staff
          </button>
        </section>
      )}

      {/* Login and Sign Up */}
      {page === 'login' && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 24,
            maxWidth: 900,
            margin: '0 auto',
            padding: '30px 20px',
          }}
        >
          <SignIn onLogin={handleLogin} />
          <SignUp />
        </div>
      )}

      {/* Academic Staff */}
      {page === 'staff' && (
        <StaffProfiles />
      )}

      {/* Real Booking Form */}
      {page === 'booking' && (
        <Booking onBooked={handleBookingSuccess} />
      )}

      {/* Booking Confirmation */}
      {page === 'confirmation' && (
        <section
          style={{
            maxWidth: 850,
            margin: '0 auto',
            padding: '50px 30px',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: 30,
              borderTop: '5px solid #f58220',
              borderRadius: 8,
            }}
          >
            <h1 style={{ color: '#111111' }}>
              Meeting Request Submitted
            </h1>

            <p>
              Your meeting request has been saved successfully.
            </p>

            <p>
              The booking is currently pending.
            </p>

            {lastBookingId && (
              <p style={{ color: '#555555' }}>
                <strong>Booking ID:</strong> {lastBookingId}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                marginTop: 24,
              }}
            >
              <button
                onClick={() => setPage('mybookings')}
                style={{
                  backgroundColor: '#f58220',
                  color: '#111111',
                  padding: '12px 18px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                View My Bookings
              </button>

              <button
                onClick={() => setPage('booking')}
                style={{
                  padding: '12px 18px',
                  border: '1px solid #bbbbbb',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                Book Another Meeting
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Real Booking History */}
      {page === 'mybookings' && (
        <MyBookings />
      )}
    </main>
  )
}

export default App
