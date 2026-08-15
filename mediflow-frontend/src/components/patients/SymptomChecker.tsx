import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { useSlowLoad } from '../../hooks/useSlowLoad';
import { checkSymptoms } from '../../services/aiService';
import { Sparkles, Loader2, Stethoscope, AlertTriangle, ArrowRight } from 'lucide-react';

interface TriageResult {
  specialization: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  reasoning: string;
  disclaimer: string;
  doctors: { id: string; name: string; specialization: string; experience: number }[];
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
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isSlow = useSlowLoad(isLoading);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setError('');
    setResult(null);
    setIsLoading(true);
    try {
      const res = await checkSymptoms(symptoms.trim());
      setResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.msg || 'Could not check symptoms right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-md bg-white/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-950">
          <Sparkles className="h-5 w-5 text-green-600" />
          Not sure who to see?
        </CardTitle>
        <CardDescription>Describe how you're feeling and we'll suggest the right specialist.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g. I've had a sore throat and mild fever for two days..."
            className="border-green-200 focus-visible:border-green-500 focus-visible:ring-green-500 min-h-[90px]"
            maxLength={1000}
          />
          <Button
            type="submit"
            disabled={isLoading || !symptoms.trim()}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              'Check my symptoms'
            )}
          </Button>

          {isSlow && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-800 text-xs">
                Still working — this app runs on free hosting, so the server may be waking up from
                sleep. This can take up to a minute on the first try.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </form>

        {result && (
          <div className="mt-5 pt-5 border-t border-green-100 space-y-4">
            {result.urgency === 'emergency' ? (
              <Alert className="border-red-300 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <span className="font-semibold">This needs immediate attention.</span> {result.reasoning}{' '}
                  Please contact emergency services or visit the nearest emergency room — don't wait
                  for a routine appointment.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={URGENCY_STYLES[result.urgency]}>{URGENCY_LABEL[result.urgency]}</Badge>
                  <Badge variant="outline" className="border-green-200 text-green-800">
                    {result.specialization}
                  </Badge>
                </div>
                <p className="text-sm text-green-900">{result.reasoning}</p>

                {result.doctors.length > 0 ? (
                  <div className="space-y-2">
                    {result.doctors.map((d) => (
                      <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-green-50/60 border border-green-100">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-lg border border-green-100">
                            <Stethoscope className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium text-green-950 text-sm">{d.name}</div>
                            <div className="text-xs text-green-700/70">{d.specialization}</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-300 text-green-800 hover:bg-green-50"
                          onClick={() => navigate('/appointments')}
                        >
                          Book <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-green-700/70">
                    No {result.specialization} available to book right now — try the Appointments
                    page to see all doctors.
                  </p>
                )}
              </>
            )}
            <p className="text-xs text-green-700/50">{result.disclaimer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
