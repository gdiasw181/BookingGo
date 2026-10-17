
import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore'

type Staff = {
  id: string | number
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

function StaffProfiles({ user }: { user?: { email?: string; role?: string } }) {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('All')
  const [department, setDepartment] = useState('All')

  // Keep an internal list so newly added staff appear immediately
  const [staffList, setStaffList] = useState<Staff[]>(() => staffData.slice())

  const filteredStaff = staffList.filter((staff) => {
    const query = search.trim().toLowerCase()

    const matchesSearch =
      staff.name.toLowerCase().includes(query) ||
      staff.department.toLowerCase().includes(query) ||
      staff.role.toLowerCase().includes(query)

    const matchesRole = role === 'All' || staff.role === role
    const matchesDepartment =
      department === 'All' || staff.department === department

    return matchesSearch && matchesRole && matchesDepartment
  })

  // Form state for adding a new staff profile (only visible to signed-in staff)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('Lecturer')
  const [newDept, setNewDept] = useState('Software Development')
  const [newHours, setNewHours] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  async function handleAddStaff(e: any) {
    e.preventDefault()
    setMessage(null)
    const email = user?.email ?? ''
    if (!email) {
      setMessage('No email available from account')
      return
    }
    // Prevent duplicates by email
    if (staffList.some((s) => s.email.toLowerCase() === email.toLowerCase())) {
      setMessage('A profile for this account already exists')
      return
    }

    const added: Omit<Staff, 'id'> = {
      name: newName || email.split('@')[0],
      role: newRole,
      department: newDept,
      officeHours: newHours || 'TBA',
      email,
    }

    // Persist to Firestore
    try {
      setMessage('Saving...')
      const col = collection(db, 'staffProfiles')
      const docRef = await addDoc(col, { ...added, createdAt: serverTimestamp() })
      setMessage('Profile added')
      // reset form
      setNewName('')
      setNewRole('Lecturer')
      setNewDept('Software Development')
      setNewHours('')
    } catch (err: any) {
      console.error('Failed to add profile', err)
      setMessage('Failed to save profile')
    }
  }

  useEffect(() => {
    // Listen to staffProfiles collection and merge with static staffData
    try {
      const col = collection(db, 'staffProfiles')
      const q = query(col, orderBy('createdAt', 'desc'))
      const unsub = onSnapshot(q, (snap) => {
        const persisted: Staff[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        // Combine persisted with static defaults, avoiding duplicates by email
        const combined = [
          ...persisted,
          ...staffData.filter((s) => !persisted.some((p) => p.email.toLowerCase() === s.email.toLowerCase())),
        ]
        setStaffList(combined)
      })
      return () => unsub()
    } catch (e) {
      // If Firestore not configured, silently keep static data
      console.warn('Firestore unavailable, using local data')
      setStaffList(staffData.slice())
    }
  }, [])

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '45px 30px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: 35 }}>
        <p style={{
          color: '#f58220',
          fontWeight: 700,
          marginBottom: 8,
          textTransform: 'uppercase',
          fontSize: 14,
          letterSpacing: 1,
        }}>
          Find support
        </p>

        <h2 style={{
          fontSize: 40,
          marginTop: 0,
          marginBottom: 12,
          color: '#111111',
        }}>
          Academic Staff
        </h2>

        <p style={{
          fontSize: 17,
          color: '#555555',
          maxWidth: 700,
          lineHeight: 1.6,
        }}>
          Search for lecturers, tutors, teaching assistants and academic
          mentors, then choose the right person for your meeting.
        </p>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: 24,
        marginBottom: 30,
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 18 }}>
          Search Academic Staff
        </h3>

        <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap' }}>
          <input
            type="text"
            aria-label="Search academic staff"
            placeholder="Search by name, department or role"
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
            aria-label="Filter by role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              flex: '1 1 180px',
              padding: '13px 14px',
              border: '1px solid #bbbbbb',
              fontSize: 15,
              color: '#111111',
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
            aria-label="Filter by department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            style={{
              flex: '1 1 220px',
              padding: '13px 14px',
              border: '1px solid #bbbbbb',
              fontSize: 15,
              color: '#111111',
              backgroundColor: 'white',
            }}
          >
            <option value="All">All departments</option>
            <option value="Software Development">Software Development</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Programming">Programming</option>
            <option value="Information Technology">Information Technology</option>
          </select>
        </div>
      </div>

      {/* If signed in as staff, show a form to add or update your profile */}
      {user?.role === 'staff' && (
        <div style={{ backgroundColor: 'white', padding: 24, marginBottom: 30, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <h3 style={{ marginTop: 0 }}>Add / Update Your Profile</h3>
          {message && <div style={{ marginBottom: 12, color: message === 'Profile added' ? 'green' : 'red' }}>{message}</div>}
          <form onSubmit={handleAddStaff}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block' }}>Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} style={{ width: '100%', padding: 8 }} />
              </div>
              <div>
                <label style={{ display: 'block' }}>Role</label>
                <input value={newRole} onChange={(e) => setNewRole(e.target.value)} style={{ width: '100%', padding: 8 }} />
              </div>
              <div>
                <label style={{ display: 'block' }}>Department</label>
                <input value={newDept} onChange={(e) => setNewDept(e.target.value)} style={{ width: '100%', padding: 8 }} />
              </div>
              <div>
                <label style={{ display: 'block' }}>Office Hours</label>
                <input value={newHours} onChange={(e) => setNewHours(e.target.value)} style={{ width: '100%', padding: 8 }} placeholder="e.g. Monday 10:00 - 12:00" />
              </div>
              <div>
                <label style={{ display: 'block' }}>Email (from account)</label>
                <input value={user?.email ?? ''} disabled style={{ width: '100%', padding: 8, background: '#f3f3f3' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" style={{ backgroundColor: '#f58220', color: 'white', padding: '10px 14px', border: 'none' }}>Save profile</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <p style={{ fontWeight: 700, marginBottom: 18 }}>
        {filteredStaff.length} staff member
        {filteredStaff.length !== 1 ? 's' : ''} found
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 22,
      }}>
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
            <div style={{
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
            }}>
              {staff.name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)}
            </div>

            <h2 style={{
              marginTop: 0,
              marginBottom: 8,
              fontSize: 24,
              color: '#111111',
            }}>
              {staff.name}
            </h2>

            <p style={{
              color: '#f58220',
              fontWeight: 700,
              marginTop: 0,
              marginBottom: 18,
            }}>
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

            <div style={{
              display: 'flex',
              gap: 10,
              marginTop: 22,
              flexWrap: 'wrap',
            }}>
              <button style={{
                padding: '12px 18px',
                backgroundColor: 'white',
                color: '#111111',
                border: '2px solid #111111',
                fontWeight: 700,
                cursor: 'pointer',
              }}>
                VIEW PROFILE
              </button>

              <button style={{
                padding: '12px 18px',
                backgroundColor: '#f58220',
                color: '#111111',
                border: '2px solid #f58220',
                fontWeight: 700,
                cursor: 'pointer',
              }}>
                BOOK MEETING
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: 30,
          textAlign: 'center',
          marginTop: 20,
        }}>
          <h3>No academic staff found</h3>
          <p>Try changing your search or filter options.</p>
        </div>
      )}
    </main>
  )
}

export default StaffProfiles
