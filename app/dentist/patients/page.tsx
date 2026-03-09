'use client'
// app/dentist/patients/page.tsx
// Dentist view of all patients they've treated

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import PageWrapper from '@/components/PageWrapper'

interface Patient {
  id: string
  name: string
  email: string
  created_at: string
  appointmentCount: number
  lastVisit: string | null
}

export default function DentistPatientsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<{ id: string; name: string } | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profileData } = await supabase
        .from('users').select('id, name').eq('id', user.id).single()
      setProfile(profileData)

      // Get all appointments for this dentist to find unique patients
      const { data: appointments } = await supabase
        .from('appointments')
        .select('patient_id, appointment_date')
        .eq('dentist_id', user.id)
        .order('appointment_date', { ascending: false })

      if (!appointments) { setLoading(false); return }

      // Get unique patient IDs and their appointment counts
      const patientMap = new Map<string, { count: number; lastVisit: string | null }>()
      appointments.forEach(appt => {
        if (!patientMap.has(appt.patient_id)) {
          patientMap.set(appt.patient_id, { count: 1, lastVisit: appt.appointment_date })
        } else {
          const existing = patientMap.get(appt.patient_id)!
          patientMap.set(appt.patient_id, {
            count: existing.count + 1,
            lastVisit: existing.lastVisit, // already ordered desc so first is latest
          })
        }
      })

      // Fetch patient details for each unique patient
      const patientIds = Array.from(patientMap.keys())
      if (patientIds.length === 0) { setLoading(false); return }

      const { data: users } = await supabase
        .from('users')
        .select('id, name, email, created_at')
        .in('id', patientIds)
        .order('name')

      const patientsWithStats: Patient[] = (users || []).map(u => ({
        ...u,
        appointmentCount: patientMap.get(u.id)?.count || 0,
        lastVisit: patientMap.get(u.id)?.lastVisit || null,
      }))

      setPatients(patientsWithStats)
    } finally {
      setLoading(false)
    }
  }

  // Filter by search
  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-blue-600">Loading...</div>
    </div>
  )

  return (
    <PageWrapper role="dentist" userName={profile?.name || ''} title="Patients">
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search patients by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <p className="text-sm text-gray-400 mb-4">{filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}</p>

      {/* Patient Grid */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-gray-400">
            {search ? 'No patients found matching your search.' : "You haven't treated any patients yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map(patient => (
            <div
              key={patient.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-blue-200 transition-colors"
            >
              {/* Avatar */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                  {patient.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-semibold text-gray-800 truncate">{patient.name}</h3>
                  <p className="text-xs text-gray-400 truncate">{patient.email}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{patient.appointmentCount}</p>
                  <p className="text-xs text-blue-500">Appointments</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs font-medium text-gray-600 mt-1">
                    {patient.lastVisit
                      ? new Date(patient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-400">Last Visit</p>
                </div>
              </div>

              {/* Member since */}
              <p className="text-xs text-gray-300 mt-3">
                Member since {new Date(patient.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
