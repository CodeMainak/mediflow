// Client-side mirror of the backend's rule-based symptom triage
// (mediflow-backend/src/controllers/aiController.ts). Used on the public
// demo page and landing hero so it works with zero network calls, even
// offline. Shared question/answer shapes live here so the UI flow and
// the backend request body stay in sync.

export type Urgency = 'low' | 'medium' | 'high' | 'emergency';
export type Duration = 'today' | 'few-days' | 'over-week';
export type Severity = 'mild' | 'moderate' | 'severe';

export interface TriageAnswers {
  symptoms: string;
  duration: Duration;
  severity: Severity;
  redFlags: string[];
}

export interface DemoTriageResult {
  specialization: string;
  urgency: Urgency;
  reasoning: string;
  doctors: { name: string; specialization: string }[];
}

export const DURATION_OPTIONS: { value: Duration; label: string }[] = [
  { value: 'today', label: 'Since today' },
  { value: 'few-days', label: 'A few days' },
  { value: 'over-week', label: 'Over a week' },
];

export const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: 'mild', label: '1-3 · Mild' },
  { value: 'moderate', label: '4-7 · Moderate' },
  { value: 'severe', label: '8-10 · Severe' },
];

export const RED_FLAG_OPTIONS = [
  'Fever',
  'Difficulty breathing',
  'Severe pain',
  'Vision changes',
  'Fainting or dizziness',
];

const EMERGENCY_KEYWORDS = [
  "can't breathe", 'cannot breathe', 'difficulty breathing', 'chest pain', 'unconscious',
  'severe bleeding', 'bleeding heavily', 'stroke', 'heart attack', 'seizure', 'not breathing',
];

const RULES: { keywords: string[]; specialization: string; urgency: Urgency; doctors: string[] }[] = [
  { keywords: ['chest pain', 'heart', 'palpitation', 'blood pressure'], specialization: 'Cardiology', urgency: 'high', doctors: ['Dr. Sarah Johnson'] },
  { keywords: ['skin', 'rash', 'acne', 'itch', 'mole'], specialization: 'Dermatology', urgency: 'low', doctors: ['Dr. Priya Nair'] },
  { keywords: ['bone', 'fracture', 'joint', 'back pain', 'sprain', 'knee', 'shoulder'], specialization: 'Orthopedics', urgency: 'medium', doctors: ['Dr. Alex Kim'] },
  { keywords: ['child', 'infant', 'baby', 'toddler'], specialization: 'Pediatrics', urgency: 'medium', doctors: ['Dr. Meera Iyer'] },
  { keywords: ['ear', 'nose', 'throat', 'sinus', 'hearing'], specialization: 'ENT', urgency: 'low', doctors: ['Dr. Tom Reyes'] },
  { keywords: ['headache', 'migraine', 'dizziness', 'numbness'], specialization: 'Neurology', urgency: 'medium', doctors: ['Dr. Lena Fischer'] },
  { keywords: ['anxiety', 'depress', 'stress', 'sleep', 'mood', 'panic'], specialization: 'Psychiatry', urgency: 'low', doctors: ['Dr. Omar Farouk'] },
  { keywords: ['cough', 'breath', 'asthma', 'wheeze', 'lung'], specialization: 'Pulmonology', urgency: 'medium', doctors: ['Dr. Sarah Johnson'] },
  { keywords: ['stomach', 'abdominal', 'nausea', 'vomit', 'diarrhea', 'digestion'], specialization: 'Gastroenterology', urgency: 'medium', doctors: ['Dr. Alex Kim'] },
];

function baseMatch(symptoms: string): { specialization: string; urgency: Urgency; doctors: { name: string; specialization: string }[] } {
  const text = symptoms.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => text.includes(k))) {
      return {
        specialization: rule.specialization,
        urgency: rule.urgency,
        doctors: rule.doctors.map((name) => ({ name, specialization: rule.specialization })),
      };
    }
  }
  return {
    specialization: 'General Physician',
    urgency: 'low',
    doctors: [{ name: 'Dr. John Smith', specialization: 'General Physician' }],
  };
}

/**
 * Cheap client-side pre-check used to skip the follow-up questions and go
 * straight to an emergency result — someone typing "can't breathe" shouldn't
 * have to click through duration/severity/red-flag questions first.
 */
export function isLikelyEmergency(symptoms: string): boolean {
  const text = symptoms.toLowerCase();
  return EMERGENCY_KEYWORDS.some((k) => text.includes(k));
}

function escalate(urgency: Urgency): Urgency {
  if (urgency === 'low') return 'medium';
  if (urgency === 'medium') return 'high';
  return urgency;
}

/**
 * Applies the same escalation rules used by the backend's ruleBasedTriage
 * (mediflow-backend/src/controllers/aiController.ts) to a base
 * specialization/urgency match, given how the patient answered the
 * duration/severity/red-flag follow-ups.
 */
export function demoTriage(answers: TriageAnswers): DemoTriageResult {
  const { symptoms, duration, severity, redFlags } = answers;

  if (EMERGENCY_KEYWORDS.some((k) => symptoms.toLowerCase().includes(k))) {
    return {
      specialization: 'General Physician',
      urgency: 'emergency',
      reasoning: "What you described could be serious and shouldn't wait for a routine appointment.",
      doctors: [],
    };
  }

  const base = baseMatch(symptoms);
  let urgency = base.urgency;
  const notes: string[] = [];

  if (redFlags.length > 0 && severity === 'severe') {
    urgency = 'emergency';
  } else {
    if (redFlags.length > 0) {
      urgency = escalate(urgency);
      notes.push(`the additional symptoms you flagged (${redFlags.join(', ').toLowerCase()}) are worth having a doctor check on soon`);
    }
    if (severity === 'severe') {
      urgency = escalate(urgency);
      notes.push("given how severe you rated this, it's worth getting seen sooner rather than later");
    }
    if (duration === 'over-week' && notes.length === 0 && urgency === 'low') {
      urgency = 'medium';
      notes.push("since this has lasted over a week, it's a good idea not to wait much longer");
    }
  }

  if (urgency === 'emergency') {
    return {
      specialization: 'General Physician',
      urgency: 'emergency',
      reasoning: 'The combination of severity and symptoms you described could be serious and should be looked at right away.',
      doctors: [],
    };
  }

  const reasoning = notes.length > 0
    ? `Based on what you described, a ${base.specialization} specialist is a reasonable starting point — ${notes.join(', and ')}.`
    : `Based on the symptoms you described, a ${base.specialization} specialist is a reasonable starting point.`;

  return {
    specialization: base.specialization,
    urgency,
    reasoning,
    doctors: base.doctors,
  };
}
