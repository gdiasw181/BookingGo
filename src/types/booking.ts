
export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'

export type BookingRequest = {
  studentId: string
  staffId: string
  staffName: string
  date: string       // YYYY-MM-DD
  time: string       // HH:mm
  reason?: string
}

export type Booking = BookingRequest & {
  id: string
  status: BookingStatus
  createdAt?: Date
}
