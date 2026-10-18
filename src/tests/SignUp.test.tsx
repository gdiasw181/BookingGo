import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../services/auth', () => ({
  signUp: vi.fn(),
}))

import * as auth from '../services/auth'
import SignUp from '../components/SignUp'

describe('SignUp component (local mocks)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    localStorage.clear()
  })

  it('successful student sign-up calls signUp and stores role', async () => {
    ;(auth.signUp as any).mockResolvedValue({ uid: 'u1' })

    render(<SignUp />)
    // Display name, Email are text inputs; password is role of textbox? use labels instead
    const display = screen.getByLabelText(/Display name/i)
    const email = screen.getByLabelText(/Email/i)
    const password = screen.getByLabelText(/Password/i)

    fireEvent.change(display, { target: { value: 'Alice' } })
    fireEvent.change(email, { target: { value: 'alice@autuni.ac.nz' } })
    fireEvent.change(password, { target: { value: 'StrongPass1!' } })
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }))

    await waitFor(() => expect(auth.signUp).toHaveBeenCalledWith('alice@autuni.ac.nz', 'StrongPass1!', 'Alice', 'student'))
    expect(localStorage.getItem('role')).toBe('student')
  })

  it('successful staff sign-up calls signUp with staff role', async () => {
    ;(auth.signUp as any).mockResolvedValue({ uid: 'u2' })

    render(<SignUp />)
    const display = screen.getByLabelText(/Display name/i)
    const email = screen.getByLabelText(/Email/i)
    const password = screen.getByLabelText(/Password/i)
    const staffRadio = screen.getByLabelText(/Academic staff/i)

    fireEvent.change(display, { target: { value: 'Dr Bob' } })
    fireEvent.change(email, { target: { value: 'bob@autuni.ac.nz' } })
    fireEvent.change(password, { target: { value: 'StrongPass2!' } })
    fireEvent.click(staffRadio)
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }))

    await waitFor(() => expect(auth.signUp).toHaveBeenCalledWith('bob@autuni.ac.nz', 'StrongPass2!', 'Dr Bob', 'staff'))
    expect(localStorage.getItem('role')).toBe('staff')
  })

  it('rejects non-autuni domain sign-up and shows error', async () => {
    ;(auth.signUp as any).mockRejectedValue(new Error('Sign up is restricted to autuni.ac.nz accounts'))

    render(<SignUp />)
    const display = screen.getByLabelText(/Display name/i)
    const email = screen.getByLabelText(/Email/i)
    const password = screen.getByLabelText(/Password/i)

    fireEvent.change(display, { target: { value: 'Eve' } })
    fireEvent.change(email, { target: { value: 'eve@gmail.com' } })
    fireEvent.change(password, { target: { value: 'Pass1234' } })
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }))

    expect(await screen.findByText(/Sign up is restricted/i)).toBeTruthy()
  })

  it('shows error when email already in use', async () => {
    ;(auth.signUp as any).mockRejectedValue(new Error('Firebase: Error (auth/email-already-in-use).'))

    render(<SignUp />)
    const display = screen.getByLabelText(/Display name/i)
    const email = screen.getByLabelText(/Email/i)
    const password = screen.getByLabelText(/Password/i)

    fireEvent.change(display, { target: { value: 'Alice' } })
    fireEvent.change(email, { target: { value: 'alice@autuni.ac.nz' } })
    fireEvent.change(password, { target: { value: 'StrongPass1!' } })
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }))

    expect(await screen.findByText(/email-already-in-use/i)).toBeTruthy()
  })
})
