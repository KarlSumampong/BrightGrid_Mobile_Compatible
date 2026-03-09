// Rule-Based AI Symptom Checker - no external APIs

export type Symptom = 'toothPain' | 'bleedingGums' | 'swelling' | 'sensitivity' | 'badBreath'

export interface SymptomOption { id: Symptom; label: string; description: string }
export interface AICheckerResult {
  condition: string; explanation: string; recommendedService: string; severity: 'low' | 'medium' | 'high'
}

export const SYMPTOM_OPTIONS: SymptomOption[] = [
  { id: 'toothPain', label: 'Tooth Pain', description: 'Aching or sharp pain in one or more teeth' },
  { id: 'bleedingGums', label: 'Bleeding Gums', description: 'Gums that bleed during brushing or spontaneously' },
  { id: 'swelling', label: 'Swelling', description: 'Visible swelling in gums, jaw, or face area' },
  { id: 'sensitivity', label: 'Tooth Sensitivity', description: 'Pain when eating hot, cold, or sweet items' },
  { id: 'badBreath', label: 'Bad Breath', description: 'Persistent bad breath that does not go away' },
]

export function analyzeSymptoms(selected: Symptom[]): AICheckerResult | null {
  if (selected.length === 0) return null
  const has = (s: Symptom) => selected.includes(s)

  if (has('bleedingGums') && has('badBreath')) return {
    condition: 'Possible Periodontal Disease',
    explanation: 'The combination of bleeding gums and persistent bad breath strongly indicates periodontal disease — a serious gum infection that can lead to tooth loss without treatment.',
    recommendedService: 'Periodontal Treatment', severity: 'high'
  }
  if (has('swelling') && has('toothPain')) return {
    condition: 'Possible Dental Abscess',
    explanation: 'Swelling with tooth pain may indicate a dental abscess — a pocket of infection at the root. This requires prompt care to prevent spreading.',
    recommendedService: 'Emergency Dental Consultation', severity: 'high'
  }
  if (has('sensitivity') && has('toothPain')) return {
    condition: 'Possible Advanced Cavity',
    explanation: 'Tooth pain with sensitivity suggests a cavity that has reached the dentin layer. Treatment now can prevent a more invasive root canal later.',
    recommendedService: 'Dental Filling Consultation', severity: 'medium'
  }
  if (has('toothPain')) return {
    condition: 'Possible Cavity (Dental Caries)',
    explanation: 'Tooth pain is a common sign of tooth decay. Bacteria erode tooth enamel causing pain. Early treatment prevents more invasive procedures.',
    recommendedService: 'Dental Checkup & Filling', severity: 'medium'
  }
  if (has('bleedingGums')) return {
    condition: 'Possible Gingivitis',
    explanation: 'Bleeding gums are the hallmark of gingivitis — early-stage gum disease caused by plaque buildup. It is fully reversible with professional cleaning.',
    recommendedService: 'Dental Cleaning (Prophylaxis)', severity: 'low'
  }
  if (has('swelling')) return {
    condition: 'Possible Dental Infection',
    explanation: 'Facial or gum swelling can indicate a dental infection. Infections in the mouth can spread if left untreated. Please seek dental care promptly.',
    recommendedService: 'Emergency Dental Consultation', severity: 'high'
  }
  if (has('sensitivity')) return {
    condition: 'Possible Enamel Erosion',
    explanation: 'Sensitivity to hot, cold, or sweet foods often signals enamel erosion or exposed dentin. Treatment includes desensitizing agents or dental bonding.',
    recommendedService: 'Sensitivity Treatment', severity: 'low'
  }
  if (has('badBreath')) return {
    condition: 'Possible Oral Hygiene Issue',
    explanation: 'Persistent bad breath may be caused by bacteria buildup or early gum disease. A professional cleaning can identify and treat the root cause.',
    recommendedService: 'Dental Cleaning & Assessment', severity: 'low'
  }
  return null
}

export function getSeverityColor(s: 'low' | 'medium' | 'high'): string {
  return s === 'low' ? 'text-green-700 bg-green-50 border-green-200'
    : s === 'medium' ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
    : 'text-red-700 bg-red-50 border-red-200'
}

export function getSeverityLabel(s: 'low' | 'medium' | 'high'): string {
  return s === 'low' ? '🟢 Low Priority'
    : s === 'medium' ? '🟡 Moderate Priority'
    : '🔴 High Priority – See a dentist soon'
}
