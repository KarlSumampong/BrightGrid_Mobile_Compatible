'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import PageWrapper from '@/components/PageWrapper'
import StatusBadge from '@/components/StatusBadge'

interface Apt { id:string; appointment_date:string; appointment_time:string; status:'Pending'|'Ongoing'|'Completed'; queue_number:number; services:{service_name:string;price:number}; users:{name:string;id:string} }

export default function DentistAppointmentsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<{id:string;name:string}|null>(null)
  const [appointments, setAppointments] = useState<Apt[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string|null>(null)
  const [filter, setFilter] = useState<'all'|'Pending'|'Ongoing'|'Completed'>('all')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('users').select('id,name').eq('id', user.id).single()
      setProfile(p)
      const { data } = await supabase.from('appointments')
        .select('*, services(service_name,price), users!appointments_patient_id_fkey(name,id)')
        .eq('dentist_id', user.id).order('appointment_date',{ascending:false}).order('queue_number',{ascending:true})
      setAppointments(data||[])
      setLoading(false)
    })()
  }, [])

  const updateStatus = async (id:string, status:'Pending'|'Ongoing'|'Completed') => {
    setUpdating(id)
    const supabase = createClient()
    await supabase.from('appointments').update({status}).eq('id',id)
    setAppointments(p => p.map(a => a.id===id ? {...a,status} : a))
    setUpdating(null)
  }

  const filtered = appointments.filter(a => (filter==='all'||a.status===filter) && (!dateFilter||a.appointment_date===dateFilter))
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-blue-600">Loading...</div></div>

  return (
    <PageWrapper role="dentist" userName={profile?.name||''} title="Appointments">
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {(['all','Pending','Ongoing','Completed'] as const).map(f => (
            <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter===f?'bg-blue-600 text-white':'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}>{f==='all'?'All':f}</button>
          ))}
        </div>
        <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {dateFilter && <button onClick={()=>setDateFilter('')} className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">Clear date</button>}
      </div>
      <p className="text-sm text-gray-400 mb-4">{filtered.length} appointment{filtered.length!==1?'s':''}</p>
      {filtered.length===0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center"><div className="text-5xl mb-4">📭</div><p className="text-gray-400">No appointments found.</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">#{a.queue_number}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1"><h3 className="font-semibold text-gray-800">{a.users?.name}</h3><StatusBadge status={a.status} /></div>
                    <p className="text-sm text-gray-500">{a.services?.service_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(a.appointment_date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})} · {a.appointment_time} · ₱{a.services?.price?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 ml-4">
                  {a.status!=='Ongoing' && <button onClick={()=>updateStatus(a.id,'Ongoing')} disabled={updating===a.id} className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg disabled:opacity-50">Mark Ongoing</button>}
                  {a.status!=='Completed' && <button onClick={()=>updateStatus(a.id,'Completed')} disabled={updating===a.id} className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 rounded-lg disabled:opacity-50">Mark Complete</button>}
                  {a.status!=='Pending' && <button onClick={()=>updateStatus(a.id,'Pending')} disabled={updating===a.id} className="px-3 py-1.5 text-xs font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg disabled:opacity-50">Reset</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
