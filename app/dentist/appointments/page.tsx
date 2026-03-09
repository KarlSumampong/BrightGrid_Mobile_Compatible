'use client'
// app/dentist/appointments/page.tsx
// Dentist view of all appointments with ability to update status

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  users: { name: string; id: string }
}

type StatusFilter = 'all' | 'Pending' | 'Ongoing' | 'Completed'

export default function DentistAppointmentsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<{ id: string; name: string } | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [dateFilter, setDateFilter] = useState('') // filter by date

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

      // Fetch all appointments assigned to this dentist
      const { data } = await supabase
        .from('appointments')
        .select(`
          *,
          services (service_name, price),
          users!appointments_patient_id_fkey (name, id)
        `)
        .eq('dentist_id', user.id)
        .order('appointment_date', { ascending: false })
        .order('queue_number', { ascending: true })

      setAppointments(data || [])
    } finally {
      setLoading(false)
    }
  }

  // Update appointment status
  const updateStatus = async (id: string, newStatus: 'Pending' | 'Ongoing' | 'Completed') => {
    setUpdating(id)
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      // Update local state to avoid refetch
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status: newStatus } : a)
      )
    } catch (err) {
      console.error('Update error:', err)
    } finally {
      setUpdating(null)
    }
  }

  // Apply filters
  const filteredAppointments = appointments.filter(a => {
    const matchesStatus = filter === 'all' || a.status === filter
    const matchesDate = !dateFilter || a.appointment_date === dateFilter
    return matchesStatus && matchesDate
  })

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-blue-600">Loading...</div>
    </div>
  )

  return (
    <PageWrapper role="dentist" userName={profile?.name || ''} title="Appointments">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Status Filter */}
        <div className="flex gap-2">
          {(['all', 'Pending', 'Ongoing', 'Completed'] as StatusFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        {/* Date Filter */}
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Clear date
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-400 mb-4">{filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} found</p>

      {/* Appointments Table */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-400">No appointments found with these filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map(appt => (
            <div
              key={appt.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <div className="flex items-start justify-between">
                {/* Left: Info */}
                <div className="flex items-start gap-4">
                  {/* Queue Badge */}
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                    #{appt.queue_number}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{appt.users?.name}</h3>
                      <StatusBadge status={appt.status} />
                    </div>
                    <p className="text-sm text-gray-500">{appt.services?.service_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(appt.appointment_date).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric'
                      })} · {appt.appointment_time} · ₱{appt.services?.price?.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Right: Status Controls */}
                <div className="flex flex-col gap-1 ml-4">
                  {appt.status !== 'Ongoing' && (
                    <button
                      onClick={() => updateStatus(appt.id, 'Ongoing')}
                      disabled={updating === appt.id}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Mark Ongoing
                    </button>
                  )}
                  {appt.status !== 'Completed' && (
                    <button
                      onClick={() => updateStatus(appt.id, 'Completed')}
                      disabled={updating === appt.id}
                      className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Mark Complete
                    </button>
                  )}
                  {appt.status !== 'Pending' && (
                    <button
                      onClick={() => updateStatus(appt.id, 'Pending')}
                      disabled={updating === appt.id}
                      className="px-3 py-1.5 text-xs font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Reset to Pending
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
