'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import PageWrapper from '@/components/PageWrapper'
import StatCard from '@/components/StatCard'
import StatusBadge from '@/components/StatusBadge'

interface Appointment {
  id: string; appointment_date: string; appointment_time: string
  status: 'Pending'|'Ongoing'|'Completed'; queue_number: number
  services: { service_name: string }; users: { name: string }
}

export default function PatientDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<{name:string}|null>(null)
  const [upcoming, setUpcoming] = useState<Appointment|null>(null)
  const [total, setTotal] = useState(0)
  const [completed, setCompleted] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('users').select('name').eq('id', user.id).single()
      setProfile(p)
      const { data: appts } = await supabase.from('appointments')
        .select('*, services(service_name), users!appointments_dentist_id_fkey(name)')
        .eq('patient_id', user.id).order('appointment_date', { ascending: true })
      if (appts) {
        setTotal(appts.length)
        setCompleted(appts.filter(a => a.status === 'Completed').length)
        const today = new Date().toISOString().split('T')[0]
        setUpcoming(appts.find(a => a.appointment_date >= today && a.status !== 'Completed') || null)
      }
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-blue-600">Loading...</div></div>

  return (
    <PageWrapper role="patient" userName={profile?.name||'Patient'} title="Dashboard">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-8">
        <h3 className="text-xl font-semibold">Welcome back, {profile?.name}! 👋</h3>
        <p className="text-blue-100 mt-1 text-sm">
          {upcoming ? `Upcoming appointment on ${new Date(upcoming.appointment_date).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}` : 'No upcoming appointments. Book one today!'}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Appointments" value={total} icon="📅" color="blue" />
        <StatCard title="Completed Visits" value={completed} icon="✅" color="green" />
        <StatCard title="Queue Number" value={upcoming?.queue_number ?? '—'} icon="🔢" color="purple" subtitle={upcoming ? 'Next appointment' : 'No active queue'} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h4 className="font-semibold text-gray-800 mb-4">📅 Next Appointment</h4>
          {upcoming ? (
            <div className="space-y-3">
              {[['Service', upcoming.services?.service_name],['Date', new Date(upcoming.appointment_date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})],['Time', upcoming.appointment_time],['Dentist', upcoming.users?.name]].map(([l,v]) => (
                <div key={l} className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{l}</span>
                  <span className="text-sm font-medium">{v}</span>
                </div>
              ))}
              <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Status</span><StatusBadge status={upcoming.status} /></div>
              <div className="pt-2 mt-2 border-t border-gray-100">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-blue-600 font-medium">Queue Number</p>
                  <p className="text-3xl font-bold text-blue-700">#{upcoming.queue_number}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500 text-sm">No upcoming appointments</p>
              <Link href="/patient/book" className="mt-3 inline-block bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">Book Now</Link>
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h4 className="font-semibold text-gray-800 mb-4">⚡ Quick Actions</h4>
          <div className="space-y-3">
            {[
              {href:'/patient/book',icon:'📅',label:'Book Appointment',desc:'Schedule a new dental visit'},
              {href:'/patient/appointments',icon:'🗓️',label:'View Appointments',desc:'See all your appointments'},
              {href:'/patient/records',icon:'📋',label:'Dental Records',desc:'Access your treatment history'},
              {href:'/patient/ai-checker',icon:'🤖',label:'AI Symptom Checker',desc:'Check your symptoms now'},
            ].map(a => (
              <Link key={a.href} href={a.href} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group">
                <span className="text-xl">{a.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-blue-700">{a.label}</p>
                  <p className="text-xs text-gray-400">{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
