'use client'
// app/patient/records/page.tsx
// Displays dental records/history for the logged-in patient

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import PageWrapper from '@/components/PageWrapper'

interface DentalRecord {
  id: string
  diagnosis: string
  treatment: string
  prescription: string
  notes: string
  created_at: string
  users: { name: string } // dentist
}

export default function PatientRecordsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<{ id: string; name: string } | null>(null)
  const [records, setRecords] = useState<DentalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profileData } = await supabase
        .from('users').select('id, name').eq('id', user.id).single()
      setProfile(profileData)

      // Fetch dental records for this patient, including dentist name
      const { data } = await supabase
        .from('dental_records')
        .select(`
          *,
          users!dental_records_dentist_id_fkey (name)
        `)
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false })

      setRecords(data || [])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-blue-600">Loading...</div>
    </div>
  )

  return (
    <PageWrapper role="patient" userName={profile?.name || ''} title="Dental Records">
      {records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-700">No dental records yet</h3>
          <p className="text-gray-400 text-sm mt-1">
            Your dental records will appear here after your first consultation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map(record => (
            <div
              key={record.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Record Header */}
              <button
                onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    🦷
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{record.diagnosis}</h3>
                    <p className="text-sm text-gray-400">
                      Dr. {record.users?.name} · {new Date(record.created_at).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-gray-400 text-lg">
                  {expandedId === record.id ? '▲' : '▼'}
                </span>
              </button>

              {/* Record Details (expandable) */}
              {expandedId === record.id && (
                <div className="px-6 pb-6 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Diagnosis</h4>
                      <p className="text-sm text-gray-700">{record.diagnosis}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Treatment</h4>
                      <p className="text-sm text-gray-700">{record.treatment}</p>
                    </div>
                    {record.prescription && (
                      <div className="bg-blue-50 rounded-xl p-4">
                        <h4 className="text-xs font-semibold text-blue-400 uppercase mb-2">💊 Prescription</h4>
                        <p className="text-sm text-blue-700">{record.prescription}</p>
                      </div>
                    )}
                    {record.notes && (
                      <div className="bg-yellow-50 rounded-xl p-4">
                        <h4 className="text-xs font-semibold text-yellow-500 uppercase mb-2">📝 Notes</h4>
                        <p className="text-sm text-yellow-700">{record.notes}</p>
                      </div>
                    )}
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
