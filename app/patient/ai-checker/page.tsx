'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import PageWrapper from '@/components/PageWrapper'
import { analyzeSymptoms, SYMPTOM_OPTIONS, getSeverityColor, getSeverityLabel, type Symptom, type AICheckerResult } from '@/utils/aiChecker'

export default function AICheckerPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<{name:string}|null>(null)
  const [selected, setSelected] = useState<Symptom[]>([])
  const [result, setResult] = useState<AICheckerResult|null>(null)
  const [analyzed, setAnalyzed] = useState(false)

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('users').select('name').eq('id', user.id).single()
      setProfile(data)
    })()
  }, [])

  const toggle = (s: Symptom) => {
    setSelected(p => p.includes(s) ? p.filter(x=>x!==s) : [...p,s])
    setAnalyzed(false); setResult(null)
  }

  return (
    <PageWrapper role="patient" userName={profile?.name||''} title="AI Symptom Checker">
      <div className="max-w-2xl mx-auto">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
          <div className="flex gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="font-semibold text-blue-800">AI-Powered Symptom Checker</h3>
              <p className="text-sm text-blue-600 mt-1">Select your symptoms and our AI will suggest a possible dental condition. For informational purposes only.</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Select Your Symptoms</h3>
          <div className="space-y-3">
            {SYMPTOM_OPTIONS.map(s => {
              const on = selected.includes(s.id)
              return (
                <button key={s.id} type="button" onClick={()=>toggle(s.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${on ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${on?'bg-blue-600 border-blue-600':'border-gray-300'}`}>
                    {on && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${on?'text-blue-800':'text-gray-700'}`}>{s.label}</p>
                    <p className={`text-xs mt-0.5 ${on?'text-blue-600':'text-gray-400'}`}>{s.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={()=>{setResult(analyzeSymptoms(selected));setAnalyzed(true)}} disabled={selected.length===0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 text-white font-semibold py-3 rounded-xl transition-colors">
              🔍 Analyze Symptoms
            </button>
            {selected.length>0 && <button onClick={()=>{setSelected([]);setResult(null);setAnalyzed(false)}} className="px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm">Clear</button>}
          </div>
        </div>
        {analyzed && result && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">🩺 Analysis Result</h3>
            <div className={`rounded-xl border p-4 mb-4 ${getSeverityColor(result.severity)}`}>
              <h4 className="font-bold text-lg">{result.condition}</h4>
              <p className="text-xs mt-1">{getSeverityLabel(result.severity)}</p>
            </div>
            <div className="mb-4">
              <h5 className="text-xs font-semibold text-gray-400 uppercase mb-2">Explanation</h5>
              <p className="text-sm text-gray-700 leading-relaxed">{result.explanation}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <h5 className="text-xs font-semibold text-gray-400 uppercase mb-1">Recommended Service</h5>
              <p className="text-sm font-semibold text-gray-800">🦷 {result.recommendedService}</p>
            </div>
            <p className="text-xs text-gray-400 mb-4">⚠️ This is an AI-generated assessment and not a substitute for professional dental diagnosis.</p>
            <Link href="/patient/book" className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors">📅 Book Appointment Now</Link>
          </div>
        )}
        {analyzed && !result && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">🤔</div>
            <p className="text-yellow-700 font-medium">Please select at least one symptom above.</p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
