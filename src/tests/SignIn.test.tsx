import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

// Mock auth service locally for this test file
vi.mock('../services/auth', () => ({
  signIn: vi.fn(),
}))

import * as auth from '../services/auth'
import SignIn from '../components/SignIn'

describe('SignIn component (local mocks)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    localStorage.clear()
  })

  it('successful sign-in with matching role calls onLogin', async () => {
    ;(auth.signIn as any).mockResolvedValue({ user: { email: 'staff@autuni.ac.nz' }, profile: { role: 'staff' } })
    const onLogin = vi.fn()

    render(<SignIn onLogin={onLogin} />)
    const email = screen.getByLabelText(/Email/i)
    const password = screen.getByLabelText(/Password/i)
    const staffRadio = screen.getByLabelText(/Academic staff/i)

    fireEvent.change(email, { target: { value: 'staff@autuni.ac.nz' } })
    fireEvent.change(password, { target: { value: 'StaffPass1!' } })
    fireEvent.click(staffRadio)
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))

    await waitFor(() => expect(auth.signIn).toHaveBeenCalledWith('staff@autuni.ac.nz', 'StaffPass1!', 'staff'))
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith(expect.objectContaining({ email: 'staff@autuni.ac.nz', role: 'staff' })))
  })

  it('role mismatch shows error', async () => {
    ;(auth.signIn as any).mockRejectedValue(new Error("Account role mismatch: account is registered as 'student'"))
    const onLogin = vi.fn()

    render(<SignIn onLogin={onLogin} />)
    const email = screen.getByLabelText(/Email/i)
    const password = screen.getByLabelText(/Password/i)
    const staffRadio = screen.getByLabelText(/Academic staff/i)

    fireEvent.change(email, { target: { value: 'sue@autuni.ac.nz' } })
    fireEvent.change(password, { target: { value: 'pass' } })
    fireEvent.click(staffRadio)
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))

    expect(await screen.findByText(/Account role mismatch/i)).toBeTruthy()
    expect(onLogin).not.toHaveBeenCalled()
  })

  it('missing profile role shows error', async () => {
    ;(auth.signIn as any).mockRejectedValue(new Error('No role assigned to this account. Contact administrator.'))
    const onLogin = vi.fn()

    render(<SignIn onLogin={onLogin} />)
    const email = screen.getByLabelText(/Email/i)
    const password = screen.getByLabelText(/Password/i)

    fireEvent.change(email, { target: { value: 'nobody@autuni.ac.nz' } })
    fireEvent.change(password, { target: { value: 'pass' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))

    expect(await screen.findByText(/No role assigned/i)).toBeTruthy()
    expect(onLogin).not.toHaveBeenCalled()
  })

  it('invalid credentials show firebase error', async () => {
    ;(auth.signIn as any).mockRejectedValue(new Error('Firebase: Error (auth/wrong-password).'))
    const onLogin = vi.fn()

    render(<SignIn onLogin={onLogin} />)
    const email = screen.getByLabelText(/Email/i)
    const password = screen.getByLabelText(/Password/i)

    fireEvent.change(email, { target: { value: 'user@autuni.ac.nz' } })
    fireEvent.change(password, { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))

    expect(await screen.findByText(/wrong-password|auth\/wrong-password|wrong-password/i)).toBeTruthy()
    expect(onLogin).not.toHaveBeenCalled()
  })
})
