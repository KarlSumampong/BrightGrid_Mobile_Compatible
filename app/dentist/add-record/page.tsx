'use client'
// app/dentist/add-record/page.tsx
// Allows dentists to add dental records for patients after treatment

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import PageWrapper from '@/components/PageWrapper'

interface Patient {
  id: string
  name: string
  email: string
}

export default function AddRecordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<{ id: string; name: string } | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [selectedPatient, setSelectedPatient] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [treatment, setTreatment] = useState('')
  const [prescription, setPrescription] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profileData } = await supabase
        .from('users').select('id, name').eq('id', user.id).single()
      setProfile(profileData)

      // Get the list of patients this dentist has appointments with
      const { data: appointments } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('dentist_id', user.id)

      if (appointments && appointments.length > 0) {
        const patientIds = Array.from(new Set(appointments.map(a => a.patient_id)))

        const { data: patientData } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', patientIds)
          .order('name')

        setPatients(patientData || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (!profile) throw new Error('Not authenticated')

      // Insert the dental record
      const { error: insertError } = await supabase.from('dental_records').insert({
        patient_id: selectedPatient,
        dentist_id: profile.id,
        diagnosis,
        treatment,
        prescription,
        notes,
      })

      if (insertError) throw insertError

      setSuccess(true)
      // Clear form
      setSelectedPatient('')
      setDiagnosis('')
      setTreatment('')
      setPrescription('')
      setNotes('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add record'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-blue-600">Loading...</div>
    </div>
  )

  return (
    <PageWrapper role="dentist" userName={profile?.name || ''} title="Add Dental Record">
      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-5 bg-green-50 border border-green-200 rounded-2xl text-green-700">
            <div className="text-xl mb-1">✅ Record Added Successfully!</div>
            <p className="text-sm">The dental record has been saved to the patient&apos;s file.</p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-3 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Add Another Record
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">New Dental Record</h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {patients.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-gray-500">No patients found.</p>
              <p className="text-gray-400 text-sm mt-1">
                You can only add records for patients you have appointments with.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient *
                </label>
                <select
                  value={selectedPatient}
                  onChange={e => setSelectedPatient(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="">-- Select patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis *
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  required
                  placeholder="e.g., Dental Caries (Cavity) on tooth #14"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Treatment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Treatment *
                </label>
                <textarea
                  value={treatment}
                  onChange={e => setTreatment(e.target.value)}
                  required
                  rows={3}
                  placeholder="e.g., Composite filling applied. Patient was given local anesthesia. Cavity was cleaned and filled."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>

              {/* Prescription */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prescription <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={prescription}
                  onChange={e => setPrescription(e.target.value)}
                  rows={2}
                  placeholder="e.g., Amoxicillin 500mg - 3x daily for 5 days; Ibuprofen 400mg for pain as needed"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g., Follow-up in 2 weeks. Patient has sensitivity to cold foods."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {submitting ? 'Saving...' : '📝 Save Dental Record'}
              </button>
            </form>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
