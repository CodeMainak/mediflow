import React, { useState, useEffect, useRef, useId } from 'react';
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

// One request at a time. `sent` is exactly what was posted, so a retry can
// resend it unchanged.
type RequestState =
  | { status: 'idle' }
  | { status: 'loading'; sent: ChatMessage[] }
  | { status: 'error'; sent: ChatMessage[]; message: string };

interface AiSymptomChatProps<T> {
  /** `signal` aborts the request when the patient cancels or the chat unmounts — pass it to the HTTP call. */
  onMessage: (
    messages: ChatMessage[],
    signal: AbortSignal
  ) => Promise<{ done: true; result: T } | { done: false; question: string; quickReplies?: string[] }>;
  renderResult: (result: T, reset: () => void) => React.ReactNode;
  /** If provided, immediately starts the conversation with this text instead of showing the empty input — e.g. carrying over what was typed on the landing page. */
  initialMessage?: string;
}

/** Turns an axios-style error into something a patient can act on. */
export function describeError(err: unknown): string {
  const response = (err as { response?: { status?: number; data?: unknown } })?.response;
  if (!response) return "Couldn't reach the server. Check your connection and try again.";

  const { status = 0, data } = response;
  if (status === 429) {
    // express-rate-limit sends its message as a plain string body.
    return typeof data === 'string' && data ? data : 'Too many requests right now. Please wait a few minutes and try again.';
  }
  const msg = (data as { msg?: unknown } | undefined)?.msg;
  if (status >= 400 && status < 500 && typeof msg === 'string') return msg;
  return 'Something went wrong on our side. Please try again.';
}

const Chip: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode }> = ({
  onClick,
  disabled,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="px-3.5 py-2 rounded-full text-sm border bg-white border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
  >
    {children}
  </button>
);

export function AiSymptomChat<T>({ onMessage, renderResult, initialMessage }: AiSymptomChatProps<T>) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [symptomsInput, setSymptomsInput] = useState(initialMessage?.trim() ?? '');
  const [pending, setPending] = useState<PendingQuestion | null>(null);
  const [freeTextAnswer, setFreeTextAnswer] = useState('');
  const [request, setRequest] = useState<RequestState>({ status: 'idle' });
  const [result, setResult] = useState<T | null>(null);
  // Also the in-flight lock: a ref changes immediately, so a second click in
  // the same tick sees it, where `request.status` would still read 'idle'.
  const controllerRef = useRef<AbortController | null>(null);
  const busy = request.status === 'loading';
  const isSlow = useSlowLoad(busy);

  const ids = useId();
  const symptomsId = `${ids}-symptoms`;
  const answerId = `${ids}-answer`;
  const questionId = `${ids}-question`;
  const retryId = `${ids}-retry`;
  // Button, Input and Textarea don't forward refs, so focus goes by id.
  const focusById = (id: string) => document.getElementById(id)?.focus();

  const abortInFlight = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  };

  const sendTurn = async (nextMessages: ChatMessage[]) => {
    if (controllerRef.current) return; // a request is already in flight
    const controller = new AbortController();
    controllerRef.current = controller;
    setRequest({ status: 'loading', sent: nextMessages });

    try {
      const res = await onMessage(nextMessages, controller.signal);
      // Cancelled or unmounted while the response was on its way: drop it.
      if (controller.signal.aborted) return;
      if (res.done) {
        setResult(res.result);
      } else {
        setMessages([...nextMessages, { role: 'assistant', content: res.question }]);
        setPending({ question: res.question, quickReplies: res.quickReplies });
        setFreeTextAnswer('');
      }
      setRequest({ status: 'idle' });
    } catch (err) {
      if (controller.signal.aborted) return; // axios rejects with CanceledError on abort
      setRequest({ status: 'error', sent: nextMessages, message: describeError(err) });
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  };

  // Never leave a request running for a chat that's gone.
  useEffect(() => abortInFlight, []);

  useEffect(() => {
    if (initialMessage && initialMessage.trim()) {
      sendTurn([{ role: 'user', content: initialMessage.trim() }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  // Move focus to whatever needs the patient next, so keyboard and
  // screen-reader users aren't left on a control that just disappeared.
  useEffect(() => {
    if (pending) focusById(questionId);
  }, [pending, questionId]);
  useEffect(() => {
    if (request.status === 'error') focusById(retryId);
  }, [request.status, retryId]);

  const reset = () => {
    abortInFlight();
    setMessages([]);
    setSymptomsInput('');
    setPending(null);
    setFreeTextAnswer('');
    setResult(null);
    setRequest({ status: 'idle' });
  };

  const cancel = () => {
    abortInFlight();
    setRequest({ status: 'idle' });
    focusById(messages.length === 0 ? symptomsId : questionId);
  };

  const retry = () => {
    if (request.status === 'error') sendTurn(request.sent);
  };

  const submitInitial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomsInput.trim()) return;
    sendTurn([{ role: 'user', content: symptomsInput.trim() }]);
  };

  const answer = (text: string) => {
    if (!text.trim()) return;
    sendTurn([...messages, { role: 'user', content: text.trim() }]);
  };

  if (result) {
    return <div className="animate-fade-in-up">{renderResult(result, reset)}</div>;
  }

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
    <div className="space-y-4">
      {messages.length === 0 ? (
        <form onSubmit={submitInitial} className="space-y-3">
          <label htmlFor={symptomsId} className="sr-only">
            Describe your symptoms
          </label>
          <Textarea
            id={symptomsId}
            value={symptomsInput}
            onChange={(e) => setSymptomsInput(e.target.value)}
            readOnly={busy}
            placeholder="e.g. I've had a sore throat and mild fever for two days..."
            className="border-gray-200 focus-visible:border-green-500 focus-visible:ring-green-500 min-h-[80px]"
          />
          <Button
            type="submit"
            disabled={busy || !symptomsInput.trim()}
            className="bg-green-700 hover:bg-green-800 text-white transition-colors"
          >
            Check my symptoms
          </Button>
        </form>
      ) : (
        <div className="animate-fade-in-up space-y-4">
          <p className="text-xs text-gray-500">For: "{opening}"</p>

          {priorExchanges.length > 0 && (
            <div className="space-y-1.5 text-xs text-gray-500 border-l-2 border-gray-100 pl-3">
              {priorExchanges.map((ex, i) => (
                <div key={i}>
                  <span className="text-gray-500">{ex.q}</span> <span className="text-green-700 font-medium">{ex.a}</span>
                </div>
              ))}
            </div>
          )}

          {pending && (
            <div>
              <p id={questionId} tabIndex={-1} className="text-sm font-medium text-gray-800 mb-2.5 outline-none">
                {pending.question}
              </p>
              {pending.quickReplies && pending.quickReplies.length > 0 ? (
                <div role="group" aria-labelledby={questionId} className="flex flex-wrap gap-2">
                  {pending.quickReplies.map((opt) => (
                    <Chip key={opt} disabled={busy} onClick={() => answer(opt)}>
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
                  <label htmlFor={answerId} className="sr-only">
                    Your answer
                  </label>
                  <Input
                    id={answerId}
                    value={freeTextAnswer}
                    onChange={(e) => setFreeTextAnswer(e.target.value)}
                    readOnly={busy}
                    placeholder="Type your answer..."
                    className="border-gray-200 focus-visible:border-green-500"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    aria-label="Send answer"
                    disabled={busy || !freeTextAnswer.trim()}
                    className="bg-green-700 hover:bg-green-800 text-white shrink-0"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* Always rendered: a live region only announces changes to content it already contains. */}
      <div role="status" aria-live="polite" className="space-y-2">
        {busy && (
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 text-green-600 animate-spin" aria-hidden="true" />
            {messages.length === 0 ? 'Looking at your symptoms...' : 'Thinking about what to ask next...'}
          </p>
        )}
        {busy && isSlow && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Still working — this app runs on free hosting, so the server may be waking up from sleep. This can take
            up to a minute on the first try.
          </p>
        )}
      </div>

      {busy && (
        <Button type="button" variant="outline" size="sm" onClick={cancel}>
          Cancel
        </Button>
      )}

      {request.status === 'error' && (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{request.message}</span>
            <Button id={retryId} type="button" variant="outline" size="sm" onClick={retry}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
