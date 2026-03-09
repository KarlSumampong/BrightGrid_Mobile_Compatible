'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import PageWrapper from '@/components/PageWrapper'

interface Rec { id:string; diagnosis:string; treatment:string; prescription:string; notes:string; created_at:string; users:{name:string} }

export default function PatientRecordsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<{name:string}|null>(null)
  const [records, setRecords] = useState<Rec[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string|null>(null)

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('users').select('name').eq('id', user.id).single()
      setProfile(p)
      const { data } = await supabase.from('dental_records')
        .select('*, users!dental_records_dentist_id_fkey(name)')
        .eq('patient_id', user.id).order('created_at',{ascending:false})
      setRecords(data||[])
      setLoading(false)
    })()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-blue-600">Loading...</div></div>

  return (
    <PageWrapper role="patient" userName={profile?.name||''} title="Dental Records">
      {records.length===0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-700">No dental records yet</h3>
          <p className="text-gray-400 text-sm mt-1">Your records will appear here after your first consultation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button onClick={() => setExpanded(expanded===r.id ? null : r.id)} className="w-full flex items-center justify-between p-6 hover:bg-gray-50 text-left">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">🦷</div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{r.diagnosis}</h3>
                    <p className="text-sm text-gray-400">Dr. {r.users?.name} · {new Date(r.created_at).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</p>
                  </div>
                </div>
                <span className="text-gray-400">{expanded===r.id?'▲':'▼'}</span>
              </button>
              {expanded===r.id && (
                <div className="px-6 pb-6 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-gray-50 rounded-xl p-4"><h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Diagnosis</h4><p className="text-sm text-gray-700">{r.diagnosis}</p></div>
                    <div className="bg-gray-50 rounded-xl p-4"><h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Treatment</h4><p className="text-sm text-gray-700">{r.treatment}</p></div>
                    {r.prescription && <div className="bg-blue-50 rounded-xl p-4"><h4 className="text-xs font-semibold text-blue-400 uppercase mb-2">💊 Prescription</h4><p className="text-sm text-blue-700">{r.prescription}</p></div>}
                    {r.notes && <div className="bg-yellow-50 rounded-xl p-4"><h4 className="text-xs font-semibold text-yellow-500 uppercase mb-2">📝 Notes</h4><p className="text-sm text-yellow-700">{r.notes}</p></div>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
