'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import PageWrapper from '@/components/PageWrapper'

const TIME_SLOTS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30']

export default function BookPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<{id:string;name:string}|null>(null)
  const [services, setServices] = useState<{id:string;service_name:string;price:number;duration_minutes:number}[]>([])
  const [dentists, setDentists] = useState<{id:string;name:string}[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [svc, setSvc] = useState(''); const [dentist, setDentist] = useState(''); const [date, setDate] = useState(''); const [time, setTime] = useState('')

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('users').select('id,name').eq('id', user.id).single()
      setProfile(p)
      const { data: s } = await supabase.from('services').select('*').order('service_name')
      setServices(s||[])
      const { data: d } = await supabase.from('users').select('id,name').eq('role','dentist').order('name')
      setDentists(d||[])
      setLoading(false)
    })()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: existing } = await supabase.from('appointments').select('queue_number').eq('appointment_date', date).order('queue_number',{ascending:false}).limit(1)
      const queueNumber = existing && existing.length > 0 ? existing[0].queue_number + 1 : 1
      const { error: e2 } = await supabase.from('appointments').insert({ patient_id: profile!.id, dentist_id: dentist, service_id: svc, appointment_date: date, appointment_time: time, status: 'Pending', queue_number: queueNumber })
      if (e2) throw e2
      setSuccess(true); setSvc(''); setDentist(''); setDate(''); setTime('')
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Booking failed') }
    finally { setSubmitting(false) }
  }

  const min = new Date(); min.setDate(min.getDate()+1)
  const minDate = min.toISOString().split('T')[0]
  const selSvc = services.find(s => s.id === svc)

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-blue-600">Loading...</div></div>

  return (
    <PageWrapper role="patient" userName={profile?.name||''} title="Book Appointment">
      <div className="max-w-2xl mx-auto">
        {success && (
          <div className="mb-6 p-5 bg-green-50 border border-green-200 rounded-2xl text-green-700">
            <div className="text-xl mb-1">✅ Appointment Booked!</div>
            <p className="text-sm">Your appointment has been scheduled successfully.</p>
            <button onClick={() => router.push('/patient/appointments')} className="mt-3 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700">View Appointments</button>
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Schedule Your Visit</h3>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Service</label>
              <select value={svc} onChange={e=>setSvc(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                <option value="">-- Choose a service --</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.service_name} — ₱{s.price.toLocaleString()} ({s.duration_minutes} min)</option>)}
              </select>
              {selSvc && <div className="mt-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-700"><strong>{selSvc.service_name}</strong> · {selSvc.duration_minutes} min · ₱{selSvc.price.toLocaleString()}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Dentist</label>
              <select value={dentist} onChange={e=>setDentist(e.target.value)} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                <option value="">-- Choose a dentist --</option>
                {dentists.map(d => <option key={d.id} value={d.id}>Dr. {d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Date</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} min={minDate} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map(t => (
                  <button key={t} type="button" onClick={()=>setTime(t)}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${time===t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={submitting||!time} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors">
              {submitting ? 'Booking...' : '📅 Confirm Appointment'}
            </button>
          </form>
        </div>
      </div>
    </PageWrapper>
  )
}
