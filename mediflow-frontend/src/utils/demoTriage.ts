// Client-side mirror of the backend's rule-based symptom triage
// (mediflow-backend/src/controllers/aiController.ts). Used only on the
// public demo page so it works with zero network calls, even offline.

export type Urgency = 'low' | 'medium' | 'high' | 'emergency';

export interface DemoTriageResult {
  specialization: string;
  urgency: Urgency;
  reasoning: string;
  doctors: { name: string; specialization: string }[];
}

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

export function demoTriage(symptoms: string): DemoTriageResult {
  const text = symptoms.toLowerCase();

  if (EMERGENCY_KEYWORDS.some((k) => text.includes(k))) {
    return {
      specialization: 'General Physician',
      urgency: 'emergency',
      reasoning: "What you described could be serious and shouldn't wait for a routine appointment.",
      doctors: [],
    };
  }

  for (const rule of RULES) {
    if (rule.keywords.some((k) => text.includes(k))) {
      return {
        specialization: rule.specialization,
        urgency: rule.urgency,
        reasoning: `Based on the symptoms you described, a ${rule.specialization} specialist is a reasonable starting point.`,
        doctors: rule.doctors.map((name) => ({ name, specialization: rule.specialization })),
      };
    }
  }

  return {
    specialization: 'General Physician',
    urgency: 'low',
    reasoning: 'A General Physician can evaluate these symptoms and refer you further if needed.',
    doctors: [{ name: 'Dr. John Smith', specialization: 'General Physician' }],
  };
}
