# Symptom chat: request handling and UX decisions

Component: `mediflow-frontend/src/components/shared/AiSymptomChat.tsx`. Tests: `AiSymptomChat.test.tsx` (`npm test` in `mediflow-frontend`).

## Request lifecycle

Each turn is one request, tracked as `idle → loading → idle | error`. A single `AbortController` per request does three jobs.

| Situation | What happens |
| --- | --- |
| Patient submits | The controller is stored in a ref, which is also the lock. A second submit in the same tick is ignored, because a ref updates at once while state only updates on the next render |
| Patient presses **Cancel** | The request is aborted and the axios call rejects. No error is shown. The typed text or current question stays, and focus returns to it |
| A response arrives after Cancel | Dropped: `signal.aborted` is checked after every `await` |
| The chat unmounts mid-request | The effect cleanup aborts the request |
| The request fails | The current question stays on screen. The error says what to do next, and **Try again** resends exactly the messages that failed. The patient can also pick a different answer |

| Error | Message shown |
| --- | --- |
| No response (offline, DNS, CORS) | "Couldn't reach the server. Check your connection and try again." |
| 429 rate limit | The server's own message (express-rate-limit sends a plain string) |
| Other 4xx with `msg` | The server's `msg` |
| 5xx | A generic message. Server internals such as `error` are never shown |

There is no client-side timeout. A Render cold start can take 30–60 s, and a timeout would cut off requests that would have succeeded. Instead, a notice appears after 4 s explaining the wait, and **Cancel** is always available. The server already stops waiting for OpenAI after 8 s.

## Accessibility

- Every input has a real `<label>`, visually hidden; a placeholder isn't a label. The icon-only send button has `aria-label="Send answer"`.
- Progress is announced through a `role="status"` live region. The region is **always rendered**, because screen readers only announce changes to a region that already exists.
- Errors use `role="alert"`.
- Focus moves to the new question when it arrives, and to **Try again** after an error. Otherwise keyboard users would be left on a control that has just been disabled or removed.
- Quick replies sit in a `role="group"` named by their question.
- Spinner and icon graphics are `aria-hidden`.

## Streaming: evaluated, not adopted

Streaming helps when a model writes long prose that people start reading before it finishes. This feature doesn't work that way:

1. **The reply is a small JSON object, not prose.** It's a short question or a one-line conclusion. Most of the wait is model start-up time, the network and Render cold starts. Generating the reply itself is a small share of it.
2. **Partial output can't be shown safely.** Day 19's `parseAgentTurn` validates the *complete* object before anything is used. Streaming would mean showing unvalidated text, and a triage urgency must never appear half-written.
3. **Emergencies don't use the model at all.** The rule-based safety check answers without calling OpenAI.
4. **The cost would be real.** It would need server-sent events from Express, `fetch` with a `ReadableStream` in place of axios, and incremental JSON parsing, for very little gain.

Instead, the app shows progress as soon as you submit, a slow-server notice, and Cancel. Streaming would be worth revisiting for a future prose feature, such as a long plain-language explanation of a result.

## Manual checks (not covered by automated tests)

- [ ] Chrome DevTools, Network set to **Slow 4G**: submit, check the status text, the slow notice after 4 s, and that Cancel works
- [ ] DevTools set to **Offline**: answer a question, check the connection error and that **Try again** works once back online
- [ ] Keyboard only: complete a full triage with Tab, Enter and Space; focus should always land on the next thing to do
- [ ] Screen reader (VoiceOver: Cmd+F5): "Looking at your symptoms…", each new question, and errors are announced
