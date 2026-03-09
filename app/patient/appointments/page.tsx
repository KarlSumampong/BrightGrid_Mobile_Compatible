'use client'
// app/patient/appointments/page.tsx
// Lists all appointments for the logged-in patient

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import PageWrapper from '@/components/PageWrapper'
import StatusBadge from '@/components/StatusBadge'

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: 'Pending' | 'Ongoing' | 'Completed'
  queue_number: number
  services: { service_name: string; price: number }
  users: { name: string }
}

export default function PatientAppointmentsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<{ id: string; name: string } | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'Pending' | 'Ongoing' | 'Completed'>('all')

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profileData } = await supabase
        .from('users').select('id, name').eq('id', user.id).single()
      setProfile(profileData)

      // Fetch appointments with related service and dentist info
      const { data } = await supabase
        .from('appointments')
        .select(`
          *,
          services (service_name, price),
          users!appointments_dentist_id_fkey (name)
        `)
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: false })

      setAppointments(data || [])
    } finally {
      setLoading(false)
    }
  }

  // Filter appointments based on status
  const filteredAppointments = filter === 'all'
    ? appointments
    : appointments.filter(a => a.status === filter)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-blue-600">Loading...</div>
    </div>
  )

  return (
    <PageWrapper role="patient" userName={profile?.name || ''} title="My Appointments">
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'Pending', 'Ongoing', 'Completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
            }`}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-gray-700">No appointments found</h3>
          <p className="text-gray-400 text-sm mt-1">
            {filter === 'all' ? "You haven't booked any appointments yet." : `No ${filter} appointments.`}
          </p>
          <Link
            href="/patient/book"
            className="mt-4 inline-block bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            Book an Appointment
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map(appointment => (
            <div
              key={appointment.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-gray-800">
                      {appointment.services?.service_name}
                    </h3>
                    <StatusBadge status={appointment.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Date: </span>
                      <span className="text-gray-700 font-medium">
                        {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Time: </span>
                      <span className="text-gray-700 font-medium">{appointment.appointment_time}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Dentist: </span>
                      <span className="text-gray-700 font-medium">Dr. {appointment.users?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Price: </span>
                      <span className="text-gray-700 font-medium">
                        ₱{appointment.services?.price?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Queue Number Badge */}
                <div className="ml-6 text-center bg-blue-50 rounded-xl px-4 py-3 min-w-[70px]">
                  <p className="text-xs text-blue-500 font-medium">Queue</p>
                  <p className="text-2xl font-bold text-blue-700">#{appointment.queue_number}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
