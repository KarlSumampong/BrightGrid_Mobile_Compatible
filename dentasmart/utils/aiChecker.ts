// utils/aiChecker.ts
// Rule-Based AI Symptom Checker
// This module implements a decision-tree style symptom analysis without any external AI APIs.
// All logic is local and deterministic.

// ─── Types ────────────────────────────────────────────────────────────────────

export type Symptom =
  | 'toothPain'
  | 'bleedingGums'
  | 'swelling'
  | 'sensitivity'
  | 'badBreath'

export interface SymptomOption {
  id: Symptom
  label: string
  description: string
}

export interface AICheckerResult {
  condition: string
  explanation: string
  recommendedService: string
  severity: 'low' | 'medium' | 'high'
}

// ─── Symptom Definitions ──────────────────────────────────────────────────────

// All available symptoms the patient can select
export const SYMPTOM_OPTIONS: SymptomOption[] = [
  {
    id: 'toothPain',
    label: 'Tooth Pain',
    description: 'Aching, throbbing, or sharp pain in one or more teeth',
  },
  {
    id: 'bleedingGums',
    label: 'Bleeding Gums',
    description: 'Gums that bleed during brushing, flossing, or spontaneously',
  },
  {
    id: 'swelling',
    label: 'Swelling',
    description: 'Visible swelling in gums, jaw, or face area',
  },
  {
    id: 'sensitivity',
    label: 'Tooth Sensitivity',
    description: 'Pain or discomfort when eating/drinking hot, cold, or sweet items',
  },
  {
    id: 'badBreath',
    label: 'Bad Breath',
    description: 'Persistent bad breath (halitosis) that does not go away with brushing',
  },
]

// ─── Rule Engine ─────────────────────────────────────────────────────────────

/**
 * analyzeSymptoms
 *
 * Takes a list of selected symptom IDs and applies rule-based logic
 * to determine the most likely dental condition.
 *
 * Rules are evaluated in order from most specific (multiple symptoms)
 * to least specific (single symptom). The first matching rule wins.
 *
 * @param selectedSymptoms - Array of symptom IDs selected by the patient
 * @returns AICheckerResult with diagnosis, explanation, and recommended service
 */
export function analyzeSymptoms(selectedSymptoms: Symptom[]): AICheckerResult | null {
  // No symptoms selected → no result
  if (selectedSymptoms.length === 0) return null

  const has = (symptom: Symptom) => selectedSymptoms.includes(symptom)

  // ── Compound Rules (check multi-symptom combos first) ────────────────────

  // Rule: Bleeding Gums + Bad Breath → Periodontal Disease
  if (has('bleedingGums') && has('badBreath')) {
    return {
      condition: 'Possible Periodontal Disease',
      explanation:
        'The combination of bleeding gums and persistent bad breath is a strong indicator of periodontal (gum) disease. This is a serious infection of the gum tissue and bone that supports your teeth. Early treatment is essential to prevent tooth loss.',
      recommendedService: 'Periodontal Treatment',
      severity: 'high',
    }
  }

  // Rule: Swelling + Tooth Pain → Dental Abscess
  if (has('swelling') && has('toothPain')) {
    return {
      condition: 'Possible Dental Abscess',
      explanation:
        'Swelling combined with tooth pain may indicate a dental abscess — a pocket of infection at the root of a tooth or in the gum. This requires prompt dental care to prevent the infection from spreading.',
      recommendedService: 'Emergency Dental Consultation',
      severity: 'high',
    }
  }

  // Rule: Sensitivity + Tooth Pain → Advanced Cavity
  if (has('sensitivity') && has('toothPain')) {
    return {
      condition: 'Possible Advanced Cavity (Dental Caries)',
      explanation:
        'Tooth pain combined with sensitivity often indicates a cavity that has progressed past the enamel into the dentin. Without treatment, it could reach the pulp and require more extensive care.',
      recommendedService: 'Dental Filling or Root Canal Consultation',
      severity: 'medium',
    }
  }

  // ── Single Symptom Rules ──────────────────────────────────────────────────

  // Rule: Tooth Pain → Possible Cavity
  if (has('toothPain')) {
    return {
      condition: 'Possible Cavity (Dental Caries)',
      explanation:
        'Tooth pain is one of the most common signs of tooth decay (cavity). Bacteria produce acids that erode your tooth enamel, causing pain. Early detection can prevent the need for more invasive procedures.',
      recommendedService: 'Dental Checkup & Filling',
      severity: 'medium',
    }
  }

  // Rule: Bleeding Gums → Possible Gingivitis
  if (has('bleedingGums')) {
    return {
      condition: 'Possible Gingivitis',
      explanation:
        'Bleeding gums are the hallmark sign of gingivitis, an early-stage gum disease caused by plaque buildup. The good news: gingivitis is reversible with professional cleaning and improved oral hygiene.',
      recommendedService: 'Dental Cleaning (Prophylaxis)',
      severity: 'low',
    }
  }

  // Rule: Swelling → Possible Infection
  if (has('swelling')) {
    return {
      condition: 'Possible Dental Infection',
      explanation:
        'Facial or gum swelling can indicate a dental infection or abscess. Infections in the mouth can spread to other areas if left untreated. Please seek dental care promptly.',
      recommendedService: 'Emergency Dental Consultation',
      severity: 'high',
    }
  }

  // Rule: Sensitivity → Enamel Erosion
  if (has('sensitivity')) {
    return {
      condition: 'Possible Enamel Erosion',
      explanation:
        'Tooth sensitivity to hot, cold, or sweet foods often signals enamel erosion or exposed dentin. This can be caused by acidic foods, grinding, or improper brushing. Treatment options include desensitizing agents or dental bonding.',
      recommendedService: 'Sensitivity Treatment & Enamel Protection',
      severity: 'low',
    }
  }

  // Rule: Bad Breath → Possible Oral Hygiene Issue
  if (has('badBreath')) {
    return {
      condition: 'Possible Oral Hygiene Issue or Early Gum Disease',
      explanation:
        'Persistent bad breath (halitosis) may be caused by bacteria buildup, gum disease, or other oral health issues. A professional cleaning and examination can identify the root cause.',
      recommendedService: 'Dental Cleaning & Oral Health Assessment',
      severity: 'low',
    }
  }

  // Fallback (should not reach here if symptoms is non-empty)
  return null
}

// ─── Severity Helpers ─────────────────────────────────────────────────────────

/** Returns a Tailwind color class based on severity */
export function getSeverityColor(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'high':
      return 'text-red-600 bg-red-50 border-red-200'
  }
}

/** Returns a human-readable severity label */
export function getSeverityLabel(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'low':
      return '🟢 Low Priority'
    case 'medium':
      return '🟡 Moderate Priority'
    case 'high':
      return '🔴 High Priority – See a dentist soon'
  }
}
