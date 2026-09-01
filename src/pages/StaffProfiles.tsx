import { useState } from 'react'

type Staff = {
  id: number
  name: string
  role: string
  department: string
  officeHours: string
  email: string
}

const staffData: Staff[] = [
  {
    id: 1,
    name: 'Dr Alex Smith',
    role: 'Lecturer',
    department: 'Software Development',
    officeHours: 'Monday 10:00 AM - 12:00 PM',
    email: 'alex.smith@example.com',
  },
  {
    id: 2,
    name: 'Maya Chen',
    role: 'Tutor',
    department: 'Computer Science',
    officeHours: 'Tuesday 1:00 PM - 3:00 PM',
    email: 'maya.chen@example.com',
  },
  {
    id: 3,
    name: 'Jordan Lee',
    role: 'TA',
    department: 'Programming',
    officeHours: 'Wednesday 11:00 AM - 1:00 PM',
    email: 'jordan.lee@example.com',
  },
  {
    id: 4,
    name: 'Sam Patel',
    role: 'Academic Mentor',
    department: 'Information Technology',
    officeHours: 'Thursday 2:00 PM - 4:00 PM',
    email: 'sam.patel@example.com',
  },
]

function StaffProfiles() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('All')
  const [department, setDepartment] = useState('All')

  const filteredStaff = staffData.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(search.toLowerCase()) ||
      staff.department.toLowerCase().includes(search.toLowerCase())

    const matchesRole =
      role === 'All' || staff.role === role

    const matchesDepartment =
      department === 'All' || staff.department === department

    return matchesSearch && matchesRole && matchesDepartment
  })

  return (
    <div
      style={{
        backgroundColor: '#f5f3ee',
        minHeight: '100vh',
        paddingBottom: 60,
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#111111',
          color: 'white',
          padding: '24px 40px',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
          }}
        >
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
      </div>

      {/* Orange bar */}
      <div
        style={{
          height: 8,
          backgroundColor: '#f58220',
        }}
      />

      {/* Main content */}
      <main
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '45px 30px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            marginBottom: 35,
          }}
        >
          <p
            style={{
              color: '#f58220',
              fontWeight: 700,
              marginBottom: 8,
              textTransform: 'uppercase',
              fontSize: 14,
              letterSpacing: 1,
            }}
          >
            Find support
          </p>

          <h2
            style={{
              fontSize: 40,
              marginTop: 0,
              marginBottom: 12,
              color: '#111111',
            }}
          >
            Academic Staff
          </h2>

          <p
            style={{
              fontSize: 17,
              color: '#555555',
              maxWidth: 700,
              lineHeight: 1.6,
            }}
          >
            Search for lecturers, tutors, teaching assistants and academic
            mentors, then choose the right person for your meeting.
          </p>
        </div>

        {/* Search and filters */}
        <div
          style={{
            backgroundColor: 'white',
            padding: 24,
            marginBottom: 30,
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 18,
            }}
          >
            Search Academic Staff
          </h3>

          <div
            style={{
              display: 'flex',
              gap: 15,
              flexWrap: 'wrap',
            }}
          >
            <input
              type="text"
              placeholder="Search by name or department"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: '2 1 260px',
                padding: '13px 14px',
                border: '1px solid #bbbbbb',
                fontSize: 15,
              }}
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                flex: '1 1 180px',
                padding: '13px 14px',
                border: '1px solid #bbbbbb',
                fontSize: 15,
                backgroundColor: 'white',
              }}
            >
              <option value="All">All roles</option>
              <option value="Lecturer">Lecturer</option>
              <option value="Tutor">Tutor</option>
              <option value="TA">TA</option>
              <option value="Academic Mentor">Academic Mentor</option>
            </select>

            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              style={{
                flex: '1 1 220px',
                padding: '13px 14px',
                border: '1px solid #bbbbbb',
                fontSize: 15,
                backgroundColor: 'white',
              }}
            >
              <option value="All">All departments</option>
              <option value="Software Development">
                Software Development
              </option>
              <option value="Computer Science">
                Computer Science
              </option>
              <option value="Programming">
                Programming
              </option>
              <option value="Information Technology">
                Information Technology
              </option>
            </select>
          </div>
        </div>

        {/* Result count */}
        <p
          style={{
            fontWeight: 700,
            marginBottom: 18,
          }}
        >
          {filteredStaff.length} staff member
          {filteredStaff.length !== 1 ? 's' : ''} found
        </p>

        {/* Staff cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 22,
          }}
        >
          {filteredStaff.map((staff) => (
            <div
              key={staff.id}
              style={{
                backgroundColor: 'white',
                borderTop: '6px solid #f58220',
                padding: 25,
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  backgroundColor: '#111111',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: 22,
                  fontWeight: 700,
                  marginBottom: 18,
                }}
              >
                {staff.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)}
              </div>

              <h2
                style={{
                  marginTop: 0,
                  marginBottom: 8,
                  fontSize: 24,
                  color: '#111111',
                }}
              >
                {staff.name}
              </h2>

              <p
                style={{
                  color: '#f58220',
                  fontWeight: 700,
                  marginTop: 0,
                  marginBottom: 18,
                }}
              >
                {staff.role}
              </p>

              <p>
                <strong>Department</strong>
                <br />
                {staff.department}
              </p>

              <p>
                <strong>Office Hours</strong>
                <br />
                {staff.officeHours}
              </p>

              <p>
                <strong>Email</strong>
                <br />
                {staff.email}
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 22,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  style={{
                    padding: '12px 18px',
                    backgroundColor: 'white',
                    color: '#111111',
                    border: '2px solid #111111',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  VIEW PROFILE
                </button>

                <button
                  style={{
                    padding: '12px 18px',
                    backgroundColor: '#f58220',
                    color: '#111111',
                    border: '2px solid #f58220',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  BOOK MEETING
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div
            style={{
              backgroundColor: 'white',
              padding: 30,
              textAlign: 'center',
              marginTop: 20,
            }}
          >
            <h3>No academic staff found</h3>
            <p>
              Try changing your search or filter options.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default StaffProfiles