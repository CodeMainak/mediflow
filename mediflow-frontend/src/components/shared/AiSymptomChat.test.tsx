import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiSymptomChat, ChatMessage, describeError } from './AiSymptomChat';

type Reply = { done: true; result: { label: string } } | { done: false; question: string; quickReplies?: string[] };

interface Call {
  messages: ChatMessage[];
  signal: AbortSignal;
  resolve: (reply: Reply) => void;
  reject: (err: unknown) => void;
}

/**
 * Renders the chat with an onMessage whose requests the test settles by hand.
 * Like axios, a request rejects as soon as its signal aborts — unless
 * `ignoreAbort` simulates a response that was already on its way.
 */
function setup({ initialMessage, ignoreAbort = false }: { initialMessage?: string; ignoreAbort?: boolean } = {}) {
  const calls: Call[] = [];
  const onMessage = vi.fn(
    (messages: ChatMessage[], signal: AbortSignal) =>
      new Promise<Reply>((resolve, reject) => {
        calls.push({ messages, signal, resolve, reject });
        if (!ignoreAbort) {
          signal.addEventListener('abort', () => reject(Object.assign(new Error('canceled'), { name: 'CanceledError' })));
        }
      })
  );
  const user = userEvent.setup();
  const utils = render(
    <AiSymptomChat<{ label: string }>
      onMessage={onMessage}
      initialMessage={initialMessage}
      renderResult={(result) => <p>Result: {result.label}</p>}
    />
  );
  return { ...utils, calls, onMessage, user };
}

async function startConversation(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Describe your symptoms'), 'my knee hurts');
  await user.click(screen.getByRole('button', { name: 'Check my symptoms' }));
}

const question: Reply = { done: false, question: 'Can you put weight on it?', quickReplies: ['Yes', 'No'] };

describe('AiSymptomChat', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('loading and accessibility', () => {
    it('should announce progress in a live region and offer Cancel', async () => {
      const { user } = setup();

      await startConversation(user);

      expect(screen.getByRole('status')).toHaveTextContent('Looking at your symptoms');
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Check my symptoms' })).toBeDisabled();
    });

    it('should move focus to the next question and group its quick replies', async () => {
      const { user, calls } = setup();
      await startConversation(user);

      await act(async () => calls[0].resolve(question));

      expect(screen.getByText('Can you put weight on it?')).toHaveFocus();
      const group = screen.getByRole('group', { name: 'Can you put weight on it?' });
      expect(group).toContainElement(screen.getByRole('button', { name: 'No' }));
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });

    it('should give the free-text answer a label and the send button a name', async () => {
      const { user, calls } = setup();
      await startConversation(user);

      await act(async () => calls[0].resolve({ done: false, question: 'How long has it lasted?' }));

      expect(screen.getByLabelText('Your answer')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send answer' })).toBeDisabled();
    });

    it('should show the slow-server notice only after 4 seconds', () => {
      vi.useFakeTimers();
      setup();
      fireEvent.change(screen.getByLabelText('Describe your symptoms'), { target: { value: 'my knee hurts' } });
      fireEvent.submit(screen.getByLabelText('Describe your symptoms').closest('form')!);

      act(() => vi.advanceTimersByTime(3999));
      expect(screen.getByRole('status')).not.toHaveTextContent('waking up');

      act(() => vi.advanceTimersByTime(1));
      expect(screen.getByRole('status')).toHaveTextContent('waking up from sleep');
    });
  });

  describe('duplicate submissions', () => {
    it('should send only once when the form is submitted twice in the same tick', () => {
      const { onMessage } = setup();
      const textarea = screen.getByLabelText('Describe your symptoms');
      fireEvent.change(textarea, { target: { value: 'my knee hurts' } });

      // Two submits before React re-renders: only the ref lock can catch the second.
      fireEvent.submit(textarea.closest('form')!);
      fireEvent.submit(textarea.closest('form')!);

      expect(onMessage).toHaveBeenCalledTimes(1);
    });

    it('should ignore a second quick reply while the first is being sent', async () => {
      const { user, calls, onMessage } = setup();
      await startConversation(user);
      await act(async () => calls[0].resolve(question));

      await user.click(screen.getByRole('button', { name: 'No' }));
      await user.click(screen.getByRole('button', { name: 'Yes' }));

      expect(onMessage).toHaveBeenCalledTimes(2);
      expect(calls[1].messages.at(-1)).toEqual({ role: 'user', content: 'No' });
    });
  });

  describe('cancel', () => {
    it('should abort the request, keep the typed text and show no error', async () => {
      const { user, calls, onMessage } = setup();
      await startConversation(user);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(calls[0].signal.aborted).toBe(true);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
      const textarea = screen.getByLabelText('Describe your symptoms');
      expect(textarea).toHaveValue('my knee hurts');
      expect(textarea).toHaveFocus();

      await user.click(screen.getByRole('button', { name: 'Check my symptoms' }));
      expect(onMessage).toHaveBeenCalledTimes(2);
    });

    it('should drop a response that arrives after Cancel', async () => {
      const { user, calls } = setup({ ignoreAbort: true });
      await startConversation(user);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      await act(async () => calls[0].resolve(question));

      expect(screen.queryByText('Can you put weight on it?')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Describe your symptoms')).toBeInTheDocument();
    });

    it('should abort the in-flight request when the chat unmounts', async () => {
      const { user, calls, unmount } = setup();
      await startConversation(user);

      unmount();

      expect(calls[0].signal.aborted).toBe(true);
    });
  });

  describe('errors and retry', () => {
    it('should keep the question, focus Try again and resend the same messages', async () => {
      const { user, calls, onMessage } = setup();
      await startConversation(user);
      await act(async () => calls[0].resolve(question));
      await user.click(screen.getByRole('button', { name: 'No' }));

      await act(async () => calls[1].reject(new Error('Network Error'))); // no response: offline

      expect(screen.getByRole('alert')).toHaveTextContent("Couldn't reach the server");
      expect(screen.getByText('Can you put weight on it?')).toBeInTheDocument();
      const retry = screen.getByRole('button', { name: 'Try again' });
      expect(retry).toHaveFocus();

      await user.click(retry);
      expect(onMessage).toHaveBeenCalledTimes(3);
      expect(calls[2].messages).toEqual(calls[1].messages);

      await act(async () => calls[2].resolve({ done: true, result: { label: 'Orthopedics' } }));
      expect(screen.getByText('Result: Orthopedics')).toBeInTheDocument();
    });

    it('should let the patient pick a different answer after an error', async () => {
      const { user, calls } = setup();
      await startConversation(user);
      await act(async () => calls[0].resolve(question));
      await user.click(screen.getByRole('button', { name: 'No' }));
      await act(async () => calls[1].reject(new Error('Network Error')));

      await user.click(screen.getByRole('button', { name: 'Yes' }));

      expect(calls[2].messages.at(-1)).toEqual({ role: 'user', content: 'Yes' });
    });
  });

  it('should start straight away with a carried-over message and keep it editable', async () => {
    const { calls } = setup({ initialMessage: '  sore throat  ' });

    expect(calls).toHaveLength(1);
    expect(calls[0].messages).toEqual([{ role: 'user', content: 'sore throat' }]);

    await act(async () => calls[0].reject(new Error('Network Error')));
    expect(screen.getByLabelText('Describe your symptoms')).toHaveValue('sore throat');
  });
});

describe('describeError', () => {
  it.each([
    ['a network failure', new Error('Network Error'), "Couldn't reach the server. Check your connection and try again."],
    [
      'a rate limit with a string body',
      { response: { status: 429, data: 'Too many demo requests from this IP, please try again later' } },
      'Too many demo requests from this IP, please try again later',
    ],
    ['a rate limit with a JSON message', { response: { status: 429, data: { msg: "You've reached today's upload limit." } } }, "You've reached today's upload limit."],
    ['a rate limit without a body', { response: { status: 429 } }, 'Too many requests right now. Please wait a few minutes and try again.'],
    ['a 400 with a server message', { response: { status: 400, data: { msg: 'Please describe your symptoms to start.' } } }, 'Please describe your symptoms to start.'],
    ['a 500', { response: { status: 500, data: { msg: 'Server error', error: 'stack details' } } }, 'Something went wrong on our side. Please try again.'],
  ])('should explain %s', (_label, err, expected) => {
    expect(describeError(err)).toBe(expected);
  });
});
