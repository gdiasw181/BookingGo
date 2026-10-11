
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StaffProfiles from '../pages/StaffProfiles'

describe('Academic Staff Search Tests', () => {
  it('searches staff by role', () => {
    render(<StaffProfiles />)

    const search = screen.getByRole('textbox', {
      name: 'Search academic staff',
    })

    fireEvent.change(search, {
      target: { value: 'Lecturer' },
    })

    expect(screen.getByText('Dr Alex Smith')).toBeInTheDocument()
    expect(screen.queryByText('Maya Chen')).not.toBeInTheDocument()
  })

  it('searches without case sensitivity', () => {
    render(<StaffProfiles />)

    const search = screen.getByRole('textbox', {
      name: 'Search academic staff',
    })

    fireEvent.change(search, {
      target: { value: 'tutor' },
    })

    expect(screen.getByText('Maya Chen')).toBeInTheDocument()
    expect(screen.queryByText('Dr Alex Smith')).not.toBeInTheDocument()
  })

  it('shows a message when no staff match', () => {
    render(<StaffProfiles />)

    const search = screen.getByRole('textbox', {
      name: 'Search academic staff',
    })

    fireEvent.change(search, {
      target: { value: 'xyz123' },
    })

    expect(screen.getByText('No academic staff found')).toBeInTheDocument()
  })
})
