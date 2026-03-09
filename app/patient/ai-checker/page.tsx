'use client'
// app/patient/ai-checker/page.tsx
// AI-powered symptom checker using rule-based logic (no external APIs)

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import PageWrapper from '@/components/PageWrapper'
import {
  analyzeSymptoms,
  SYMPTOM_OPTIONS,
  getSeverityColor,
  getSeverityLabel,
  type Symptom,
  type AICheckerResult,
} from '@/utils/aiChecker'

export default function AICheckerPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<{ id: string; name: string } | null>(null)
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([])
  const [result, setResult] = useState<AICheckerResult | null>(null)
  const [analyzed, setAnalyzed] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('users').select('id, name').eq('id', user.id).single()
    setProfile(data)
  }

  // Toggle a symptom on/off
  const toggleSymptom = (symptom: Symptom) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    )
    // Reset results when user changes symptoms
    setAnalyzed(false)
    setResult(null)
  }

  // Run the rule-based AI analysis
  const handleAnalyze = () => {
    const analysis = analyzeSymptoms(selectedSymptoms)
    setResult(analysis)
    setAnalyzed(true)
  }

  const handleReset = () => {
    setSelectedSymptoms([])
    setResult(null)
    setAnalyzed(false)
  }

  return (
    <PageWrapper role="patient" userName={profile?.name || ''} title="AI Symptom Checker">
      <div className="max-w-2xl mx-auto">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
          <div className="flex gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="font-semibold text-blue-800">AI-Powered Symptom Checker</h3>
              <p className="text-sm text-blue-600 mt-1">
                Select your symptoms below and our AI will analyze them to suggest a possible dental condition.
                This is for informational purposes only — please consult a dentist for proper diagnosis.
              </p>
            </div>
          </div>
        </div>

        {/* Symptom Selection */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Select Your Symptoms</h3>
          <div className="space-y-3">
            {SYMPTOM_OPTIONS.map(symptom => {
              const isSelected = selectedSymptoms.includes(symptom.id)
              return (
                <button
                  key={symptom.id}
                  type="button"
                  onClick={() => toggleSymptom(symptom.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                  }`}
                >
                  {/* Custom checkbox */}
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>
                      {symptom.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                      {symptom.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAnalyze}
              disabled={selectedSymptoms.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              🔍 Analyze Symptoms
            </button>
            {selectedSymptoms.length > 0 && (
              <button
                onClick={handleReset}
                className="px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Analysis Result */}
        {analyzed && (
          <>
            {result ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 mb-4">🩺 Analysis Result</h3>

                {/* Condition */}
                <div className={`rounded-xl border p-4 mb-4 ${getSeverityColor(result.severity)}`}>
                  <h4 className="font-bold text-lg">{result.condition}</h4>
                  <p className="text-xs mt-1">{getSeverityLabel(result.severity)}</p>
                </div>

                {/* Explanation */}
                <div className="mb-4">
                  <h5 className="text-xs font-semibold text-gray-400 uppercase mb-2">Explanation</h5>
                  <p className="text-sm text-gray-700 leading-relaxed">{result.explanation}</p>
                </div>

                {/* Recommended Service */}
                <div className="bg-gray-50 rounded-xl p-4 mb-5">
                  <h5 className="text-xs font-semibold text-gray-400 uppercase mb-1">Recommended Service</h5>
                  <p className="text-sm font-semibold text-gray-800">🦷 {result.recommendedService}</p>
                </div>

                {/* Disclaimer */}
                <p className="text-xs text-gray-400 mb-4">
                  ⚠️ This is an AI-generated assessment based on your selected symptoms and is not a substitute for professional dental diagnosis.
                </p>

                {/* Book Now CTA */}
                <Link
                  href="/patient/book"
                  className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  📅 Book Appointment Now
                </Link>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
                <div className="text-3xl mb-2">🤔</div>
                <p className="text-yellow-700 font-medium">No matching condition found</p>
                <p className="text-yellow-600 text-sm mt-1">Please select at least one symptom above.</p>
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  )
}
