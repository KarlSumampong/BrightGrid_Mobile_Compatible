'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import PageWrapper from '@/components/PageWrapper'

export default function AddRecordPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<{id:string;name:string}|null>(null)
  const [patients, setPatients] = useState<{id:string;name:string;email:string}[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [patient, setPatient] = useState(''); const [diagnosis, setDiagnosis] = useState(''); const [treatment, setTreatment] = useState(''); const [prescription, setPrescription] = useState(''); const [notes, setNotes] = useState('')

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('users').select('id,name').eq('id', user.id).single()
      setProfile(p)
      const { data: apts } = await supabase.from('appointments').select('patient_id').eq('dentist_id', user.id)
      if (apts && apts.length>0) {
        const ids = Array.from(new Set(apts.map(a => a.patient_id)))
        const { data: u } = await supabase.from('users').select('id,name,email').in('id',ids).order('name')
        setPatients(u||[])
      }
      setLoading(false)
    })()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSubmitting(true)
    try {
      const supabase = createClient()
      const { error: e2 } = await supabase.from('dental_records').insert({ patient_id: patient, dentist_id: profile!.id, diagnosis, treatment, prescription, notes })
      if (e2) throw e2
      setSuccess(true); setPatient(''); setDiagnosis(''); setTreatment(''); setPrescription(''); setNotes('')
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to save') }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-blue-600">Loading...</div></div>

  return (
    <PageWrapper role="dentist" userName={profile?.name||''} title="Add Dental Record">
      <div className="max-w-2xl mx-auto">
        {success && (
          <div className="mb-6 p-5 bg-green-50 border border-green-200 rounded-2xl text-green-700">
            <div className="text-xl mb-1">✅ Record Saved!</div>
            <button onClick={()=>setSuccess(false)} className="mt-3 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700">Add Another</button>
          </div>
        )}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">New Dental Record</h3>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
          {patients.length===0 ? (
            <div className="text-center py-8"><div className="text-4xl mb-3">👥</div><p className="text-gray-500">No patients with appointments yet.</p></div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient *</label>
                <select value={patient} onChange={e=>setPatient(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                  <option value="">-- Select patient --</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis *</label>
                <input type="text" value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} required placeholder="e.g., Dental Caries on tooth #14" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Treatment *</label>
                <textarea value={treatment} onChange={e=>setTreatment(e.target.value)} required rows={3} placeholder="e.g., Composite filling applied after cleaning the cavity." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prescription <span className="text-gray-400">(optional)</span></label>
                <textarea value={prescription} onChange={e=>setPrescription(e.target.value)} rows={2} placeholder="e.g., Amoxicillin 500mg 3x daily for 5 days" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes <span className="text-gray-400">(optional)</span></label>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="e.g., Follow-up in 2 weeks." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors">
                {submitting ? 'Saving...' : '📝 Save Dental Record'}
              </button>
            </form>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
