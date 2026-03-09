'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import PageWrapper from '@/components/PageWrapper'
import StatCard from '@/components/StatCard'
import StatusBadge from '@/components/StatusBadge'

interface Apt { id:string; appointment_date:string; appointment_time:string; status:'Pending'|'Ongoing'|'Completed'; queue_number:number; services:{service_name:string}; users:{name:string} }

export default function DentistDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<{id:string;name:string}|null>(null)
  const [todayApts, setTodayApts] = useState<Apt[]>([])
  const [totalPatients, setTotalPatients] = useState(0)
  const [ongoing, setOngoing] = useState(0)
  const [completedToday, setCompletedToday] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('users').select('id,name').eq('id', user.id).single()
      setProfile(p)
      const today = new Date().toISOString().split('T')[0]
      const { data: ta } = await supabase.from('appointments')
        .select('*, services(service_name), users!appointments_patient_id_fkey(name)')
        .eq('dentist_id', user.id).eq('appointment_date', today).order('queue_number',{ascending:true})
      const list = ta||[]
      setTodayApts(list)
      setOngoing(list.filter(a=>a.status==='Ongoing').length)
      setCompletedToday(list.filter(a=>a.status==='Completed').length)
      const { data: all } = await supabase.from('appointments').select('patient_id').eq('dentist_id', user.id)
      setTotalPatients(new Set((all||[]).map(a=>a.patient_id)).size)
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-blue-600">Loading...</div></div>
  const today = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})

  return (
    <PageWrapper role="dentist" userName={profile?.name||'Dentist'} title="Dashboard">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-8">
        <h3 className="text-xl font-semibold">Good day, Dr. {profile?.name}! 👋</h3>
        <p className="text-blue-100 mt-1 text-sm">{today} · {todayApts.length} appointment{todayApts.length!==1?'s':''} today</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Patients" value={totalPatients} icon="👥" color="blue" />
        <StatCard title="Today" value={todayApts.length} icon="📅" color="purple" />
        <StatCard title="Ongoing" value={ongoing} icon="⏳" color="yellow" />
        <StatCard title="Done Today" value={completedToday} icon="✅" color="green" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h4 className="font-semibold text-gray-800">🔢 Today&apos;s Queue</h4>
          <Link href="/dentist/appointments" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>
        {todayApts.length===0 ? (
          <div className="text-center py-8"><div className="text-4xl mb-3">📭</div><p className="text-gray-400 text-sm">No appointments today</p></div>
        ) : (
          <div className="space-y-3">
            {todayApts.map(a => (
              <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">#{a.queue_number}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm">{a.users?.name}</p>
                  <p className="text-xs text-gray-400">{a.services?.service_name} · {a.appointment_time}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {href:'/dentist/appointments',icon:'🗓️',label:'Manage Appointments',desc:'Update appointment statuses'},
          {href:'/dentist/patients',icon:'👥',label:'View Patients',desc:'Browse all your patients'},
          {href:'/dentist/add-record',icon:'📝',label:'Add Dental Record',desc:'Record a new treatment'},
        ].map(a => (
          <Link key={a.href} href={a.href} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition-all group">
            <div className="text-3xl mb-3">{a.icon}</div>
            <h4 className="font-semibold text-gray-800 group-hover:text-blue-700 text-sm">{a.label}</h4>
            <p className="text-xs text-gray-400 mt-1">{a.desc}</p>
          </Link>
        ))}
      </div>
    </PageWrapper>
  )
}
