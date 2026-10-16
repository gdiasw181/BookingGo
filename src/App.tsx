
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
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)

  function openBooking(staffId: string | null = null) {
    setSelectedStaffId(staffId)
    setPage('booking')
  }
  
  
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

        <button onClick={() => openBooking()}>
          Book
        </button>

        <button onClick={() => setPage('mybookings')}>
          My Bookings
        </button>
      </nav>

      {/* Home Page */}
      {page === 'home' && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '34px 30px 60px', textAlign: 'left' }}>
          <div style={{
            backgroundColor: 'white',
            borderTop: '6px solid #f58220',
            borderRadius: 8,
            padding: '38px 36px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          }}>
            <p style={{
              fontWeight: 700, color: '#d5670b', textTransform: 'uppercase',
              letterSpacing: '1.5px', fontSize: 13, marginBottom: 12,
            }}>
              Academic support made simpler
            </p>
            <h1 style={{ color: '#111111', fontSize: 38, lineHeight: 1.2, margin: '0 0 10px' }}>
              Book your next academic meeting
            </h1>
            <p style={{ color: '#555555', lineHeight: 1.6, fontSize: 16, maxWidth: 740 }}>
              Find lecturers, tutors, teaching assistants and academic mentors.
              Request a meeting and manage your appointments in one place.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setPage('staff')}
                style={{
                  backgroundColor: '#f58220', color: '#111111', border: 0, borderRadius: 5,
                  padding: '12px 18px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Find Academic Staff
              </button>
              <button
                type="button"
                onClick={() => openBooking()}
                style={{
                  backgroundColor: 'white', color: '#111111', border: '1px solid #111111',
                  borderRadius: 5, padding: '12px 18px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Request a Meeting
              </button>
            </div>
          </div>

          <h2 style={{ margin: '34px 0 16px', color: '#111111', fontSize: 23 }}>Quick links</h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))', gap: 16,
          }}>
            {[
              { title: 'Academic Staff', description: 'Search staff by name, role or department.', go: () => setPage('staff') },
              { title: 'Book a Meeting', description: 'Choose staff, a date and a meeting time.', go: () => openBooking() },
              { title: 'My Bookings', description: 'View requests and cancel pending bookings.', go: () => setPage('mybookings') },
            ].map((item) => (
              <button
                type="button"
                key={item.title}
                onClick={item.go}
                style={{
                  display: 'block', textAlign: 'left', padding: 22, cursor: 'pointer',
                  border: '1px solid #ddd8d0', borderRadius: 8,
                  backgroundColor: 'white', color: '#111111',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <strong style={{ display: 'block', fontSize: 18, marginBottom: 9 }}>{item.title} →</strong>
                <span style={{ display: 'block', fontSize: 14, color: '#555555', lineHeight: 1.5 }}>{item.description}</span>
              </button>
            ))}
          </div>

          <div style={{
            backgroundColor: '#fff7ed', borderLeft: '4px solid #f58220',
            borderRadius: 5, padding: '20px 24px', marginTop: 28,
          }}>
            <h2 style={{ color: '#111111', margin: '0 0 10px', fontSize: 21 }}>How it works</h2>
            <p style={{ color: '#555555', lineHeight: 1.7 }}>
              1. Find an academic staff member. &nbsp; 2. Select a meeting date and time. &nbsp;
              3. View or cancel your request in My Bookings.
            </p>
            <p style={{ color: '#777777', marginTop: 10, fontSize: 13 }}>
              BookingGo is a student project prototype using sample staff information.
              Live AUT schedules are not connected.
            </p>
          </div>
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
        <StaffProfiles onBookStaff={(staffId) => openBooking(staffId)} />
      )}

      {/* Real Booking Form */}
      {page === 'booking' && (
        <Booking key={selectedStaffId ?? 'manual'} initialStaffId={selectedStaffId ?? ''} onBooked={handleBookingSuccess} />
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
