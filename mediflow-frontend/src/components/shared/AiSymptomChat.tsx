import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { useSlowLoad } from '../../hooks/useSlowLoad';
import { Loader2, Send } from 'lucide-react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface PendingQuestion {
  question: string;
  quickReplies?: string[];
}

interface AiSymptomChatProps<T> {
  onMessage: (
    messages: ChatMessage[]
  ) => Promise<{ done: true; result: T } | { done: false; question: string; quickReplies?: string[] }>;
  renderResult: (result: T, reset: () => void) => React.ReactNode;
  /** If provided, immediately starts the conversation with this text instead of showing the empty input — e.g. carrying over what was typed on the landing page. */
  initialMessage?: string;
}

const Chip: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="px-3.5 py-2 rounded-full text-sm border bg-white border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50 transition-colors"
  >
    {children}
  </button>
);

export function AiSymptomChat<T>({ onMessage, renderResult, initialMessage }: AiSymptomChatProps<T>) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [symptomsInput, setSymptomsInput] = useState('');
  const [pending, setPending] = useState<PendingQuestion | null>(null);
  const [freeTextAnswer, setFreeTextAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<T | null>(null);
  const isSlow = useSlowLoad(loading);
  const autoStarted = useRef(false);

  const reset = () => {
    setMessages([]);
    setSymptomsInput('');
    setPending(null);
    setFreeTextAnswer('');
    setResult(null);
    setError('');
  };

  const sendTurn = async (nextMessages: ChatMessage[]) => {
    setError('');
    setLoading(true);
    setPending(null);
    try {
      const res = await onMessage(nextMessages);
      if (res.done) {
        setResult(res.result);
      } else {
        setMessages([...nextMessages, { role: 'assistant', content: res.question }]);
        setPending({ question: res.question, quickReplies: res.quickReplies });
      }
    } catch (err: any) {
      setError(err?.response?.data?.msg || 'Could not continue the conversation right now. Please try again.');
      setMessages(nextMessages.slice(0, -1)); // drop the unanswered user turn so they can retry
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialMessage && initialMessage.trim() && !autoStarted.current) {
      autoStarted.current = true;
      sendTurn([{ role: 'user', content: initialMessage.trim() }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  const submitInitial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomsInput.trim()) return;
    sendTurn([{ role: 'user', content: symptomsInput.trim() }]);
  };

  const answer = (text: string) => {
    if (!text.trim()) return;
    setFreeTextAnswer('');
    sendTurn([...messages, { role: 'user', content: text.trim() }]);
  };

  if (result) {
    return <div className="animate-fade-in-up">{renderResult(result, reset)}</div>;
  }

  if (loading) {
    return (
      <div className="animate-fade-in-up flex flex-col items-center gap-3 py-6 text-center">
        <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
        <p className="text-sm text-gray-500">Thinking about what to ask next...</p>
        {isSlow && (
          <Alert className="border-amber-200 bg-amber-50 text-left">
            <AlertDescription className="text-amber-800 text-xs">
              Still working — this app runs on free hosting, so the server may be waking up from sleep. This can
              take up to a minute on the first try.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <form onSubmit={submitInitial} className="space-y-3">
        <Textarea
          value={symptomsInput}
          onChange={(e) => setSymptomsInput(e.target.value)}
          placeholder="e.g. I've had a sore throat and mild fever for two days..."
          className="border-gray-200 focus-visible:border-green-500 focus-visible:ring-green-500 min-h-[80px]"
        />
        <Button type="submit" disabled={!symptomsInput.trim()} className="bg-green-600 hover:bg-green-700 text-white transition-colors">
          Check my symptoms
        </Button>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>
    );
  }

  // Mid-conversation: show the exchange so far, then the current question.
  // messages alternates user(symptom), assistant(Q1), user(A1), assistant(Q2), ...
  // — pair each assistant question with the user answer that follows it.
  const priorExchanges: { q: string; a: string }[] = [];
  const opening = messages[0]?.content || '';
  for (let i = 1; i < messages.length; i += 2) {
    const assistantQ = messages[i];
    const userA = messages[i + 1];
    if (assistantQ?.role === 'assistant' && userA?.role === 'user') {
      priorExchanges.push({ q: assistantQ.content, a: userA.content });
    }
  }

  return (
    <div className="animate-fade-in-up space-y-4">
      <p className="text-xs text-gray-400">For: "{opening}"</p>

      {priorExchanges.length > 0 && (
        <div className="space-y-1.5 text-xs text-gray-400 border-l-2 border-gray-100 pl-3">
          {priorExchanges.map((ex, i) => (
            <div key={i}>
              <span className="text-gray-500">{ex.q}</span> <span className="text-green-700 font-medium">{ex.a}</span>
            </div>
          ))}
        </div>
      )}

      {pending && (
        <div>
          <p className="text-sm font-medium text-gray-800 mb-2.5">{pending.question}</p>
          {pending.quickReplies && pending.quickReplies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {pending.quickReplies.map((opt) => (
                <Chip key={opt} onClick={() => answer(opt)}>
                  {opt}
                </Chip>
              ))}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                answer(freeTextAnswer);
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={freeTextAnswer}
                onChange={(e) => setFreeTextAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="border-gray-200 focus-visible:border-green-500"
              />
              <Button type="submit" size="icon" disabled={!freeTextAnswer.trim()} className="bg-green-600 hover:bg-green-700 text-white shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
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
