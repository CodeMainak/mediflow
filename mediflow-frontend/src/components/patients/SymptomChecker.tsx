import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { SymptomTriageFlow } from '../shared/SymptomTriageFlow';
import { NearbyCareFinder } from './NearbyCareFinder';
import { checkSymptoms } from '../../services/aiService';
import { Sparkles, Stethoscope, AlertTriangle, ArrowRight, RotateCcw, HeartPulse } from 'lucide-react';

interface TriageResult {
  specialization: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  reasoning: string;
  selfCare: string;
  disclaimer: string;
  doctors: { id: string; name: string; specialization: string; experience: number }[];
  doctorsNote?: string;
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
  const navigate = useNavigate();

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Sparkles className="h-5 w-5 text-green-600" />
          Not sure who to see?
        </CardTitle>
        <CardDescription>Answer a few quick questions and we'll suggest the right specialist.</CardDescription>
      </CardHeader>
      <CardContent>
        <SymptomTriageFlow<TriageResult>
          onSubmit={async (answers) => {
            const res = await checkSymptoms(answers);
            return res.data;
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
                  <NearbyCareFinder category="emergency" label="Find nearest real hospital" />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={URGENCY_STYLES[result.urgency]}>{URGENCY_LABEL[result.urgency]}</Badge>
                    <Badge variant="outline" className="border-gray-200 text-gray-700">
                      {result.specialization}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700">{result.reasoning}</p>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-green-50 border border-green-100">
                    <HeartPulse className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-green-900">{result.selfCare}</p>
                  </div>

                  {result.doctors.length > 0 ? (
                    <div className="space-y-2">
                      {result.doctors.map((d) => (
                        <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg border border-gray-100">
                              <Stethoscope className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{d.name}</div>
                              <div className="text-xs text-gray-500">{d.specialization}</div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-200 text-gray-700 hover:bg-white"
                            onClick={() => navigate('/appointments')}
                          >
                            Book <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No {result.specialization} available to book right now.
                    </p>
                  )}
                  {result.doctorsNote && <p className="text-xs text-gray-400">{result.doctorsNote}</p>}

                  <div className="pt-1 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2 pt-3">Prefer real care today instead of booking here?</p>
                    <NearbyCareFinder category="general" />
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
