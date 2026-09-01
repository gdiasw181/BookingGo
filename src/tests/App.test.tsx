import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'
import Login from '../pages/Login'
import StaffProfiles from '../pages/StaffProfiles'

describe('BookingGo basic UI tests', () => {
  it('renders home page content by default', () => {
	render(<App />)
	expect(screen.getByText('BookingGo')).toBeInTheDocument()
	expect(screen.getByText('Academic Meeting Booking System')).toBeInTheDocument()
  })

  it('navigates to Login when Login button clicked', () => {
	render(<App />)
	fireEvent.click(screen.getByRole('button', { name: /^Login$/i }))
	expect(screen.getByText(/Sign in|Sign up/)).toBeInTheDocument()
  })

  it('navigates to StaffProfiles when Academic Staff clicked', () => {
	render(<App />)
	fireEvent.click(screen.getByRole('button', { name: /Academic Staff/i }))
	expect(screen.getByText('Academic Staff')).toBeInTheDocument()
	expect(screen.getByText('Find support')).toBeInTheDocument()
  })

  it('shows booking form when Book clicked', () => {
	render(<App />)
	fireEvent.click(screen.getByRole('button', { name: /^Book$/i }))
	expect(screen.getByText('Book a Meeting')).toBeInTheDocument()
	// check for at least one combobox (select)
	expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0)
  })

  it('Login component calls onLogin with entered email and role (login mode)', () => {
	const onLogin = vi.fn()
	const { container } = render(<Login onLogin={onLogin} />)
	const email = container.querySelector('input[type="email"]') as HTMLInputElement
	const password = container.querySelector('input[type="password"]') as HTMLInputElement
	expect(email).toBeTruthy()
	expect(password).toBeTruthy()
	fireEvent.change(email!, { target: { value: 'a@b.com' } })
	fireEvent.change(password!, { target: { value: 'pass' } })
	fireEvent.click(screen.getByRole('button', { name: /Sign in/i }))
	expect(onLogin).toHaveBeenCalledWith(expect.objectContaining({ email: 'a@b.com' }))
  })

  it('Login component toggles to signup and validates password confirm', () => {
	const onLogin = vi.fn()
	const { container } = render(<Login onLogin={onLogin} />)
	fireEvent.click(screen.getByRole('button', { name: /Create an account/i }))
	const email = container.querySelector('input[type="email"]') as HTMLInputElement
	const pwd = container.querySelector('input[type="password"]') as HTMLInputElement
	const confirm = container.querySelectorAll('input[type="password"]')[1] as HTMLInputElement
	fireEvent.change(email!, { target: { value: 'x@y.com' } })
	fireEvent.change(pwd!, { target: { value: '1' } })
	fireEvent.change(confirm!, { target: { value: '2' } })
	fireEvent.click(screen.getByRole('button', { name: /Create account/i }))
	expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
	expect(onLogin).not.toHaveBeenCalled()
  })

  it('StaffProfiles search filters results by name and department', () => {
	render(<StaffProfiles />)
	// initial: staff list shows several names
	expect(screen.getByText('Dr Alex Smith')).toBeInTheDocument()
	const input = screen.getByPlaceholderText('Search by name or department')
	fireEvent.change(input, { target: { value: 'Maya' } })
	expect(screen.queryByText('Dr Alex Smith')).not.toBeInTheDocument()
	expect(screen.getByText('Maya Chen')).toBeInTheDocument()
  })

  it('StaffProfiles role and department selectors filter results', () => {
	render(<StaffProfiles />)
	const roleSelect = screen.getByDisplayValue('All roles')
	const deptSelect = screen.getByDisplayValue('All departments')
	fireEvent.change(roleSelect, { target: { value: 'Tutor' } })
	expect(screen.getByText('Maya Chen')).toBeInTheDocument()
	fireEvent.change(deptSelect, { target: { value: 'Programming' } })
	const countText = screen.getByText(/staff member/)
	expect(countText).toBeInTheDocument()
  })
})
