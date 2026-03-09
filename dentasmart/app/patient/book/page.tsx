'use client'
// app/patient/book/page.tsx
// Appointment booking page - patients select service, dentist, date, and time

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import PageWrapper from '@/components/PageWrapper'

interface Service {
  id: string
  service_name: string
  price: number
  duration_minutes: number
}

interface Dentist {
  id: string
  name: string
}

// Available time slots
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30',
]

export default function BookAppointmentPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<{ id: string; name: string } | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [selectedService, setSelectedService] = useState('')
  const [selectedDentist, setSelectedDentist] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')

  useEffect(() => {
    loadFormData()
  }, [])

  const loadFormData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Get profile
      const { data: profileData } = await supabase
        .from('users').select('id, name').eq('id', user.id).single()
      setProfile(profileData)

      // Load all available services
      const { data: servicesData } = await supabase
        .from('services').select('*').order('service_name')
      setServices(servicesData || [])

      // Load all dentists
      const { data: dentistsData } = await supabase
        .from('users').select('id, name').eq('role', 'dentist').order('name')
      setDentists(dentistsData || [])
    } finally {
      setLoading(false)
    }
  }

  // Get the next available queue number for today
  const getQueueNumber = async (date: string): Promise<number> => {
    const { data } = await supabase
      .from('appointments')
      .select('queue_number')
      .eq('appointment_date', date)
      .order('queue_number', { ascending: false })
      .limit(1)

    // Increment from the highest existing queue number for that day
    return data && data.length > 0 ? data[0].queue_number + 1 : 1
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (!profile) throw new Error('Not authenticated')

      // Generate queue number based on the selected date
      const queueNumber = await getQueueNumber(selectedDate)

      // Insert new appointment
      const { error: insertError } = await supabase.from('appointments').insert({
        patient_id: profile.id,
        dentist_id: selectedDentist,
        service_id: selectedService,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        status: 'Pending',
        queue_number: queueNumber,
      })

      if (insertError) throw insertError

      setSuccess(true)
      // Clear form after success
      setSelectedService('')
      setSelectedDentist('')
      setSelectedDate('')
      setSelectedTime('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Booking failed'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  // Get tomorrow's date as minimum date for booking
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  const selectedServiceData = services.find(s => s.id === selectedService)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-blue-600">Loading...</div>
      </div>
    )
  }

  return (
    <PageWrapper role="patient" userName={profile?.name || ''} title="Book Appointment">
      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-5 bg-green-50 border border-green-200 rounded-2xl text-green-700">
            <div className="text-xl mb-1">✅ Appointment Booked!</div>
            <p className="text-sm">Your appointment has been successfully scheduled. Check your appointments page for your queue number.</p>
            <button
              onClick={() => router.push('/patient/appointments')}
              className="mt-3 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700"
            >
              View Appointments
            </button>
          </div>
        )}

        {/* Booking Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Schedule Your Visit</h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Service
              </label>
              <select
                value={selectedService}
                onChange={e => setSelectedService(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="">-- Choose a service --</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.service_name} — ₱{service.price.toLocaleString()} ({service.duration_minutes} min)
                  </option>
                ))}
              </select>

              {/* Service details preview */}
              {selectedServiceData && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                  <strong>{selectedServiceData.service_name}</strong> · Duration: {selectedServiceData.duration_minutes} minutes · Price: ₱{selectedServiceData.price.toLocaleString()}
                </div>
              )}
            </div>

            {/* Dentist Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Dentist
              </label>
              <select
                value={selectedDentist}
                onChange={e => setSelectedDentist(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="">-- Choose a dentist --</option>
                {dentists.map(dentist => (
                  <option key={dentist.id} value={dentist.id}>
                    Dr. {dentist.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                min={minDateStr}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map(time => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${
                      selectedTime === time
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
              {!selectedTime && (
                <p className="text-xs text-gray-400 mt-1">Please select a time slot</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedTime}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors mt-4"
            >
              {submitting ? 'Booking...' : '📅 Confirm Appointment'}
            </button>
          </form>
        </div>
      </div>
    </PageWrapper>
  )
}
