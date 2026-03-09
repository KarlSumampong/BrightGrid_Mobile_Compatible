'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import PageWrapper from '@/components/PageWrapper'

interface Patient { id:string; name:string; email:string; created_at:string; count:number; lastVisit:string|null }

export default function DentistPatientsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<{name:string}|null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('users').select('name').eq('id', user.id).single()
      setProfile(p)
      const { data: apts } = await supabase.from('appointments').select('patient_id,appointment_date').eq('dentist_id', user.id).order('appointment_date',{ascending:false})
      if (!apts || apts.length===0) { setLoading(false); return }
      const map = new Map<string,{count:number;last:string|null}>()
      apts.forEach(a => {
        if (!map.has(a.patient_id)) map.set(a.patient_id,{count:1,last:a.appointment_date})
        else map.set(a.patient_id,{count:map.get(a.patient_id)!.count+1,last:map.get(a.patient_id)!.last})
      })
      const ids = Array.from(map.keys())
      const { data: users } = await supabase.from('users').select('id,name,email,created_at').in('id',ids).order('name')
      setPatients((users||[]).map(u => ({...u, count: map.get(u.id)?.count||0, lastVisit: map.get(u.id)?.last||null})))
      setLoading(false)
    })()
  }, [])

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()))
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-blue-600">Loading...</div></div>

  return (
    <PageWrapper role="dentist" userName={profile?.name||''} title="Patients">
      <div className="mb-6"><input type="text" placeholder="Search patients..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div>
      <p className="text-sm text-gray-400 mb-4">{filtered.length} patient{filtered.length!==1?'s':''}</p>
      {filtered.length===0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center"><div className="text-5xl mb-4">👥</div><p className="text-gray-400">{search?'No patients match your search.':"No patients yet."}</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">{p.name.charAt(0).toUpperCase()}</div>
                <div className="overflow-hidden"><h3 className="font-semibold text-gray-800 truncate">{p.name}</h3><p className="text-xs text-gray-400 truncate">{p.email}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-blue-700">{p.count}</p><p className="text-xs text-blue-500">Appointments</p></div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs font-medium text-gray-600 mt-1">{p.lastVisit ? new Date(p.lastVisit).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : 'N/A'}</p>
                  <p className="text-xs text-gray-400">Last Visit</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
