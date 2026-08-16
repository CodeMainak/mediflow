import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AiSymptomChat, ChatMessage } from '../shared/AiSymptomChat';
import { NearbyCareFinder } from './NearbyCareFinder';
import { chatSymptoms } from '../../services/aiService';
import { Sparkles, AlertTriangle, RotateCcw, HeartPulse, Wand2 } from 'lucide-react';

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

export const SymptomChecker: React.FC = () => {
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Sparkles className="h-5 w-5 text-green-600" />
          Not sure who to see?
        </CardTitle>
        <CardDescription>
          Answer a couple of quick follow-ups, tailored to what you tell us, and we'll figure out what kind of
          care you need — then find real options nearby, not a made-up doctor list.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AiSymptomChat<TriageResult>
          onMessage={async (messages: ChatMessage[]) => {
            const res = await chatSymptoms(messages);
            return res.data.done ? { done: true, result: res.data } : { done: false, question: res.data.question, quickReplies: res.data.quickReplies };
          }}
          renderResult={(result, reset) => (
            <div className="space-y-4">
              {result.urgency === 'emergency' ? (
                <>
                  <Alert className="border-red-300 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <span className="font-semibold">This needs immediate attention.</span> {result.reasoning}{' '}
                      Please contact emergency services or visit the nearest emergency room — don't wait
                      for a routine appointment.
                    </AlertDescription>
                  </Alert>
                  <NearbyCareFinder category="emergency" label="Find nearest real hospital" autoStart />
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

                  <div className="pt-1 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2 pt-3 font-medium">
                      Real {result.specialization.toLowerCase()} options near you:
                    </p>
                    <NearbyCareFinder category="general" keyword={result.specialization} autoStart />
                  </div>
                </>
              )}
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-gray-400 flex-1">{result.disclaimer}</p>
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
