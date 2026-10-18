import React from 'react'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { vi } from 'vitest'

// Mock firebase module export (db) - component passes this into firestore helpers
vi.mock('../firebase', () => ({ db: {} }))

// In-memory mock for firestore functions used by StaffProfiles
vi.mock('firebase/firestore', () => {
  const listeners: Array<(snap: any) => void> = []
  const docs: Array<{ id: string; data: any }> = []

  return {
    collection: (_db: any, _name: string) => ({ name: _name }),
    query: (...args: any[]) => args,
    orderBy: (_field: string, _dir?: string) => ({}),
    serverTimestamp: () => ({ _serverTs: true }),
    onSnapshot: (_q: any, cb: (snap: any) => void) => {
      listeners.push(cb)
      // Initial emit
      cb({ docs: docs.map((d) => ({ id: d.id, data: () => d.data })) })
      return () => {
        const idx = listeners.indexOf(cb)
        if (idx >= 0) listeners.splice(idx, 1)
      }
    },
    addDoc: async (_col: any, data: any) => {
      const id = `doc${docs.length + 1}`
      docs.unshift({ id, data })
      // notify listeners
      listeners.forEach((cb) => cb({ docs: docs.map((d) => ({ id: d.id, data: () => d.data })) }))
      return { id }
    },
  }
})

import StaffProfiles from '../pages/StaffProfiles'

describe('StaffProfiles persistence (mocked Firestore)', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('creates a staff profile and it remains saved after remount', async () => {
    // render as a signed-in staff user
    const user = { email: 'alice@autuni.ac.nz', role: 'staff', uid: 'uid-alice' }
    const { container, unmount } = render(<StaffProfiles user={user} />)

    // find the form inside the rendered component
    const form = container.querySelector('form') as HTMLFormElement
    expect(form).toBeTruthy()

    const inputs = form.querySelectorAll('input')
    // inputs order: Name, Role, Department, Office Hours, Email (disabled)
    const nameInput = inputs[0] as HTMLInputElement
    const roleInput = inputs[1] as HTMLInputElement
    const deptInput = inputs[2] as HTMLInputElement
    const hoursInput = inputs[3] as HTMLInputElement

    // fill form
    fireEvent.change(nameInput, { target: { value: 'Dr Alice' } })
    fireEvent.change(roleInput, { target: { value: 'Lecturer' } })
    fireEvent.change(deptInput, { target: { value: 'Mathematics' } })
    fireEvent.change(hoursInput, { target: { value: 'Fri 9:00 - 11:00' } })

    // submit
    const saveBtn = screen.getByRole('button', { name: /Save profile/i })
    fireEvent.click(saveBtn)

    // wait for success message and for the profile card to appear
    await waitFor(() => expect(screen.getByText(/Profile added|Profile updated/i)).toBeInTheDocument())
    expect(screen.getByText('Dr Alice')).toBeInTheDocument()

    // unmount and remount to simulate page refresh
    unmount()
    const { container: container2 } = render(<StaffProfiles user={user} />)

    // After remount, onSnapshot should have emitted persisted docs and the card should exist
    await waitFor(() => expect(screen.getByText('Dr Alice')).toBeInTheDocument())
  })
})
