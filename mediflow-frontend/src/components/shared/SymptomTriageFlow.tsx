import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { useSlowLoad } from '../../hooks/useSlowLoad';
import {
  TriageAnswers,
  Duration,
  Severity,
  DURATION_OPTIONS,
  SEVERITY_OPTIONS,
  RED_FLAG_OPTIONS,
  isLikelyEmergency,
} from '../../utils/demoTriage';
import { Sparkles, Loader2, Send } from 'lucide-react';

type Step = 'input' | 'duration' | 'severity' | 'redflags';

interface SymptomTriageFlowProps<T> {
  onSubmit: (answers: TriageAnswers) => T | Promise<T>;
  renderResult: (result: T, reset: () => void) => React.ReactNode;
  /** Renders the free-text step as a rounded pill instead of a full textarea card. */
  compact?: boolean;
  slowLoadMessage?: string;
  /** Clickable example symptoms shown before the visitor types anything. */
  examples?: string[];
}

const Chip: React.FC<{ selected?: boolean; onClick: () => void; children: React.ReactNode }> = ({ selected, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3.5 py-2 rounded-full text-sm border transition-colors ${
      selected
        ? 'bg-green-600 border-green-600 text-white'
        : 'bg-white border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50'
    }`}
  >
    {children}
  </button>
);

export function SymptomTriageFlow<T>({ onSubmit, renderResult, compact, slowLoadMessage, examples }: SymptomTriageFlowProps<T>) {
  const [step, setStep] = useState<Step>('input');
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState<Duration | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<T | null>(null);
  const isSlow = useSlowLoad(submitting);

  const reset = () => {
    setStep('input');
    setSymptoms('');
    setDuration(null);
    setSeverity(null);
    setRedFlags([]);
    setResult(null);
    setError('');
  };

  const finish = async (answers: TriageAnswers) => {
    setError('');
    setSubmitting(true);
    try {
      const res = await onSubmit(answers);
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.msg || 'Could not check symptoms right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRedFlag = (flag: string) => {
    setRedFlags((prev) => (prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]));
  };

  const submitInitialSymptoms = (text: string) => {
    if (!text.trim()) return;
    // Someone describing an emergency shouldn't have to click through
    // follow-up questions first — skip straight to the result.
    if (isLikelyEmergency(text)) {
      finish({ symptoms: text, duration: 'today', severity: 'severe', redFlags: [] });
      return;
    }
    setStep('duration');
  };

  if (result) {
    return <div className="animate-fade-in-up">{renderResult(result, reset)}</div>;
  }

  if (submitting) {
    return (
      <div className="animate-fade-in-up flex flex-col items-center gap-3 py-6 text-center">
        <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
        <p className="text-sm text-gray-500">Working out the best next step...</p>
        {isSlow && (
          <Alert className="border-amber-200 bg-amber-50 text-left">
            <AlertDescription className="text-amber-800 text-xs">
              {slowLoadMessage ||
                'Still working — this app runs on free hosting, so the server may be waking up from sleep. This can take up to a minute on the first try.'}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  if (step === 'input') {
    return compact ? (
      <div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitInitialSymptoms(symptoms);
          }}
          className="flex items-center gap-2 bg-white rounded-full border border-gray-200 shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-green-300 transition-all p-1.5 pl-5"
        >
          <Sparkles className="h-4 w-4 text-green-600 shrink-0" />
          <input
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Try it — describe how you're feeling..."
            className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-800 placeholder:text-gray-400 py-2"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!symptoms.trim()}
            className="rounded-full bg-green-600 hover:bg-green-700 text-white shrink-0 h-9 w-9"
            aria-label="Check symptoms"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {examples && examples.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3 justify-center">
            <span className="text-xs text-gray-400">Try asking:</span>
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => submitInitialSymptoms(ex)}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50 hover:text-green-800 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>
    ) : (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitInitialSymptoms(symptoms);
        }}
        className="space-y-3"
      >
        <Textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="e.g. I've had a sore throat and mild fever for two days..."
          className="border-gray-200 focus-visible:border-green-500 focus-visible:ring-green-500 min-h-[80px]"
        />
        <Button type="submit" disabled={!symptoms.trim()} className="bg-green-600 hover:bg-green-700 text-white transition-colors">
          Check my symptoms
        </Button>
        {examples && examples.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400">Try:</span>
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => submitInitialSymptoms(ex)}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50 hover:text-green-800 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </form>
    );
  }

  // Follow-up steps share a consistent question/chip layout.
  return (
    <div className="animate-fade-in-up space-y-4">
      <p className="text-xs text-gray-400">For: "{symptoms}"</p>

      {step === 'duration' && (
        <div>
          <p className="text-sm font-medium text-gray-800 mb-2.5">How long has this been going on?</p>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <Chip key={opt.value} onClick={() => { setDuration(opt.value); setStep('severity'); }}>
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {step === 'severity' && (
        <div>
          <p className="text-sm font-medium text-gray-800 mb-2.5">On a scale of 1-10, how severe is it?</p>
          <div className="flex flex-wrap gap-2">
            {SEVERITY_OPTIONS.map((opt) => (
              <Chip key={opt.value} onClick={() => { setSeverity(opt.value); setStep('redflags'); }}>
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {step === 'redflags' && (
        <div>
          <p className="text-sm font-medium text-gray-800 mb-2.5">Any of these along with it?</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {RED_FLAG_OPTIONS.map((flag) => (
              <Chip key={flag} selected={redFlags.includes(flag)} onClick={() => toggleRedFlag(flag)}>
                {flag}
              </Chip>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => finish({ symptoms, duration: duration as Duration, severity: severity as Severity, redFlags })}
            >
              Continue
            </Button>
            {redFlags.length === 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-500"
                onClick={() => finish({ symptoms, duration: duration as Duration, severity: severity as Severity, redFlags: [] })}
              >
                None of these
              </Button>
            )}
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
