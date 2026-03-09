'use client'
// app/patient/dashboard/page.tsx
// Patient dashboard showing upcoming appointment, queue number, and quick actions

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import PageWrapper from '@/components/PageWrapper'
import StatCard from '@/components/StatCard'
import StatusBadge from '@/components/StatusBadge'

interface UserProfile {
  id: string
  name: string
  role: 'patient' | 'dentist'
}

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: 'Pending' | 'Ongoing' | 'Completed'
  queue_number: number
  services: { service_name: string }
  users: { name: string } // dentist name
}

export default function PatientDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment | null>(null)
  const [totalAppointments, setTotalAppointments] = useState(0)
  const [completedAppointments, setCompletedAppointments] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      // Fetch all appointments for this patient
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          *,
          services (service_name),
          users!appointments_dentist_id_fkey (name)
        `)
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true })

      if (appointments) {
        setTotalAppointments(appointments.length)
        setCompletedAppointments(appointments.filter(a => a.status === 'Completed').length)

        // Find next upcoming (Pending or Ongoing) appointment
        const today = new Date().toISOString().split('T')[0]
        const upcoming = appointments.find(
          a => a.appointment_date >= today && a.status !== 'Completed'
        )
        setUpcomingAppointment(upcoming || null)
      }
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-blue-600 text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <PageWrapper role="patient" userName={profile?.name || 'Patient'} title="Dashboard">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-8">
        <h3 className="text-xl font-semibold">Welcome back, {profile?.name}! 👋</h3>
        <p className="text-blue-100 mt-1 text-sm">
          {upcomingAppointment
            ? `You have an upcoming appointment on ${new Date(upcomingAppointment.appointment_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`
            : 'No upcoming appointments. Book one today!'}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Total Appointments"
          value={totalAppointments}
          icon="📅"
          color="blue"
        />
        <StatCard
          title="Completed Visits"
          value={completedAppointments}
          icon="✅"
          color="green"
        />
        <StatCard
          title="Queue Number"
          value={upcomingAppointment?.queue_number ?? '—'}
          icon="🔢"
          color="purple"
          subtitle={upcomingAppointment ? 'For next appointment' : 'No active queue'}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointment Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h4 className="font-semibold text-gray-800 mb-4">📅 Next Appointment</h4>

          {upcomingAppointment ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Service</span>
                <span className="text-sm font-medium">{upcomingAppointment.services?.service_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Date</span>
                <span className="text-sm font-medium">
                  {new Date(upcomingAppointment.appointment_date).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Time</span>
                <span className="text-sm font-medium">{upcomingAppointment.appointment_time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Dentist</span>
                <span className="text-sm font-medium">{upcomingAppointment.users?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <StatusBadge status={upcomingAppointment.status} />
              </div>
              <div className="pt-2 mt-2 border-t border-gray-100">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-blue-600 font-medium">Queue Number</p>
                  <p className="text-3xl font-bold text-blue-700">#{upcomingAppointment.queue_number}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500 text-sm">No upcoming appointments</p>
              <Link
                href="/patient/book"
                className="mt-3 inline-block bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Book Now
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h4 className="font-semibold text-gray-800 mb-4">⚡ Quick Actions</h4>
          <div className="space-y-3">
            {[
              { href: '/patient/book', icon: '📅', label: 'Book Appointment', desc: 'Schedule a new dental visit' },
              { href: '/patient/appointments', icon: '🗓️', label: 'View Appointments', desc: 'See all your appointments' },
              { href: '/patient/records', icon: '📋', label: 'Dental Records', desc: 'Access your treatment history' },
              { href: '/patient/ai-checker', icon: '🤖', label: 'AI Symptom Checker', desc: 'Check your symptoms now' },
            ].map(action => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group"
              >
                <span className="text-xl">{action.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-blue-700">{action.label}</p>
                  <p className="text-xs text-gray-400">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
