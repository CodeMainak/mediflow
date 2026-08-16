import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { MedicalLogo } from '../ui/medical-logo';
import { AiSymptomChat, ChatMessage } from '../shared/AiSymptomChat';
import { NearbyCareFinder } from '../patients/NearbyCareFinder';
import { chatSymptomsDemo } from '../../services/aiService';
import {
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  HeartPulse,
  Wand2,
} from 'lucide-react';

interface TriageResult {
  mode: 'ai' | 'fallback';
  specialization: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  reasoning: string;
  selfCare: string;
  disclaimer: string;
}

const URGENCY_STYLES: Record<TriageResult['urgency'], string> = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  emergency: 'bg-red-600 text-white border-red-600',
};

const URGENCY_LABEL: Record<TriageResult['urgency'], string> = {
  low: 'Low urgency',
  medium: 'Medium urgency',
  high: 'High urgency',
  emergency: 'Emergency',
};

const DemoSymptomChecker: React.FC = () => {
  const location = useLocation();
  // Carries over whatever was typed into the landing page's hero teaser, so
  // clicking through here doesn't require retyping the same symptom.
  const carriedOverSymptoms = (location.state as { symptoms?: string } | null)?.symptoms;

  return (
    <Card className="border border-gray-100 shadow-sm mb-8">
      <CardContent className="pt-6 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-green-600" />
          <h2 className="font-semibold text-gray-900">Try the real AI Symptom Checker</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          This is the actual product, not a mockup — describe how you're feeling and it'll ask real
          follow-up questions. No account needed.
        </p>

        <AiSymptomChat<TriageResult>
          initialMessage={carriedOverSymptoms}
          onMessage={async (messages: ChatMessage[]) => {
            const res = await chatSymptomsDemo(messages);
            return res.data.done ? { done: true, result: res.data } : { done: false, question: res.data.question, quickReplies: res.data.quickReplies };
          }}
          renderResult={(result, reset) => (
            <div className="pt-5 border-t border-gray-100 space-y-3">
              {result.urgency === 'emergency' ? (
                <>
                  <Alert className="border-red-300 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <span className="font-semibold">This needs immediate attention.</span> {result.reasoning}{' '}
                      Please contact emergency services rather than booking a routine appointment.
                    </AlertDescription>
                  </Alert>
                  <NearbyCareFinder category="emergency" label="Find nearest real hospital" demoMode />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={URGENCY_STYLES[result.urgency]}>{URGENCY_LABEL[result.urgency]}</Badge>
                    <Badge variant="outline" className="border-gray-200 text-gray-700">
                      {result.specialization}
                    </Badge>
                    {result.mode === 'ai' && (
                      <Badge variant="outline" className="border-green-200 text-green-700 gap-1">
                        <Wand2 className="h-3 w-3" /> AI-guided
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{result.reasoning}</p>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-green-50 border border-green-100">
                    <HeartPulse className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-green-900">{result.selfCare}</p>
                  </div>

                  <div className="pt-1">
                    <p className="text-xs text-gray-500 mb-2 font-medium">
                      Real {result.specialization.toLowerCase()} options near you:
                    </p>
                    <NearbyCareFinder category="general" keyword={result.specialization} demoMode />
                  </div>
                </>
              )}
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-gray-400">{result.disclaimer}</p>
                <Button size="sm" variant="ghost" className="text-gray-500 shrink-0" onClick={reset}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Start over
                </Button>
              </div>
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
};

export const DemoPreview: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-100 opacity-40 blur-3xl" />

      {/* Nav */}
      <nav className="relative max-w-3xl mx-auto flex items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-2 rounded-xl shadow-sm">
            <MedicalLogo size="sm" />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">MediFlow</span>
        </Link>
        <Link to="/signup">
          <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
            Create your free account
          </Button>
        </Link>
      </nav>

      <div className="relative max-w-3xl mx-auto px-6 pb-16">
        {/* Banner */}
        <div className="animate-fade-in-up flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl px-5 py-3.5 mb-8">
          <Sparkles className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-800">
            <span className="font-semibold">This is the real product, running live.</span>{' '}
            No account needed — nothing you type here is saved.
          </p>
        </div>

        <div className="animate-fade-in-up delay-1 mb-2">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Try MediFlow's AI triage</h1>
          <p className="text-gray-500 text-sm mt-1">
            The same follow-up questions, the same real nearby-care search you'd get signed in.
          </p>
        </div>

        <div className="animate-fade-in-up delay-2">
          <DemoSymptomChecker />
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-500 mb-4">
            Like what you see? Booking, prescriptions, and messaging are all one signup away.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/signup">
              <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                Create your free account
              </Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" className="text-gray-600 hover:bg-gray-100">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
