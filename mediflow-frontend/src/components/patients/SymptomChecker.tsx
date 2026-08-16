import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { AiSymptomChat, ChatMessage } from '../shared/AiSymptomChat';
import { NearbyCareFinder } from './NearbyCareFinder';
import { chatSymptoms, getSymptomHistory } from '../../services/aiService';
import { Sparkles, AlertTriangle, RotateCcw, HeartPulse, Wand2, History, ChevronDown } from 'lucide-react';

interface TriageResult {
  mode: 'ai' | 'fallback';
  specialization: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  reasoning: string;
  selfCare: string;
  disclaimer: string;
}

interface HistoryEntry {
  _id: string;
  symptoms: string;
  specialization: string;
  urgency: TriageResult['urgency'];
  reasoning: string;
  createdAt: string;
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
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const refreshHistory = useCallback(() => {
    getSymptomHistory()
      .then((res) => setHistory(res.data.history || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Sparkles className="h-5 w-5 text-green-600" />
          Not sure who to see?
        </CardTitle>
        <CardDescription>
          Answer a couple of quick follow-ups, tailored to what you tell us, and we'll figure out what kind of
          care you need — then find real options nearby, not a made-up doctor list. Since you're signed in,
          this gets saved to your history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AiSymptomChat<TriageResult>
          onMessage={async (messages: ChatMessage[]) => {
            const res = await chatSymptoms(messages);
            if (res.data.done) {
              refreshHistory();
              return { done: true, result: res.data };
            }
            return { done: false, question: res.data.question, quickReplies: res.data.quickReplies };
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

        {history.length > 0 && (
          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen} className="mt-5 pt-4 border-t border-gray-100">
            <CollapsibleTrigger asChild>
              <button type="button" className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-gray-700">
                <span className="flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" />
                  Your past checks ({history.length})
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 space-y-2">
                {history.map((h) => (
                  <div key={h._id} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <Badge className={`${URGENCY_STYLES[h.urgency]} text-[10px] py-0`}>{URGENCY_LABEL[h.urgency]}</Badge>
                      <Badge variant="outline" className="border-gray-200 text-gray-600 text-[10px] py-0">{h.specialization}</Badge>
                      <span className="text-gray-400 ml-auto">{new Date(h.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-600">"{h.symptoms}"</p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};
