'use client'
// app/dentist/dashboard/page.tsx
// Dentist dashboard with analytics, today's appointments, and queue overview

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import PageWrapper from '@/components/PageWrapper'
import StatCard from '@/components/StatCard'
import StatusBadge from '@/components/StatusBadge'

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: 'Pending' | 'Ongoing' | 'Completed'
  queue_number: number
  services: { service_name: string }
  users: { name: string } // patient name
}

export default function DentistDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<{ id: string; name: string } | null>(null)
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [totalPatients, setTotalPatients] = useState(0)
  const [ongoingCount, setOngoingCount] = useState(0)
  const [completedToday, setCompletedToday] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profileData } = await supabase
        .from('users').select('id, name').eq('id', user.id).single()
      setProfile(profileData)

      const today = new Date().toISOString().split('T')[0]

      // Fetch today's appointments for this dentist
      const { data: todayData } = await supabase
        .from('appointments')
        .select(`
          *,
          services (service_name),
          users!appointments_patient_id_fkey (name)
        `)
        .eq('dentist_id', user.id)
        .eq('appointment_date', today)
        .order('queue_number', { ascending: true })

      const todayAppts = todayData || []
      setTodayAppointments(todayAppts)
      setOngoingCount(todayAppts.filter(a => a.status === 'Ongoing').length)
      setCompletedToday(todayAppts.filter(a => a.status === 'Completed').length)

      // Count unique patients for this dentist
      const { data: allAppts } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('dentist_id', user.id)

      const uniquePatients = new Set(allAppts?.map(a => a.patient_id) || [])
      setTotalPatients(uniquePatients.size)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-blue-600">Loading...</div>
    </div>
  )

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <PageWrapper role="dentist" userName={profile?.name || 'Dentist'} title="Dashboard">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-8">
        <h3 className="text-xl font-semibold">Good day, Dr. {profile?.name}! 👋</h3>
        <p className="text-blue-100 mt-1 text-sm">
          Today is {today} · You have {todayAppointments.length} appointment{todayAppointments.length !== 1 ? 's' : ''} scheduled
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Patients"
          value={totalPatients}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Appointments Today"
          value={todayAppointments.length}
          icon="📅"
          color="purple"
        />
        <StatCard
          title="Ongoing"
          value={ongoingCount}
          icon="⏳"
          color="yellow"
        />
        <StatCard
          title="Completed Today"
          value={completedToday}
          icon="✅"
          color="green"
        />
      </div>

      {/* Today's Queue */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h4 className="font-semibold text-gray-800">🔢 Today&apos;s Queue</h4>
          <Link
            href="/dentist/appointments"
            className="text-sm text-blue-600 hover:underline"
          >
            View all →
          </Link>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-400 text-sm">No appointments scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map(appt => (
              <div
                key={appt.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
              >
                {/* Queue Number */}
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  #{appt.queue_number}
                </div>

                {/* Patient & Service Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm">
                    {appt.users?.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {appt.services?.service_name} · {appt.appointment_time}
                  </p>
                </div>

                <StatusBadge status={appt.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/dentist/appointments', icon: '🗓️', label: 'Manage Appointments', desc: 'Update appointment statuses' },
          { href: '/dentist/patients', icon: '👥', label: 'View Patients', desc: 'Browse all your patients' },
          { href: '/dentist/add-record', icon: '📝', label: 'Add Dental Record', desc: 'Record a new treatment' },
        ].map(action => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition-all group"
          >
            <div className="text-3xl mb-3">{action.icon}</div>
            <h4 className="font-semibold text-gray-800 group-hover:text-blue-700 text-sm">{action.label}</h4>
            <p className="text-xs text-gray-400 mt-1">{action.desc}</p>
          </Link>
        ))}
      </div>
    </PageWrapper>
  )
}
