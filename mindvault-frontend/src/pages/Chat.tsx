import { useEffect, useRef, useState, type FormEvent } from 'react';
import Navbar from '../components/Navbar';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../api/client';
import * as chatApi from '../api/chat';
import type { ChatMessage } from '../types';
import { formatTime } from '../utils/date';

export default function Chat() {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatApi
      .getChatHistory()
      .then(setMessages)
      .catch((err) => showToast(extractErrorMessage(err), 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    // Optimistic: show the user's message immediately; the backend persists it
    // but only returns the assistant's reply.
    const optimisticUser: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'USER',
      content: text,
      safetyIntercepted: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput('');
    setSending(true);

    try {
      const reply = await chatApi.sendChatMessage(text);
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper dark:bg-night">
      <Navbar />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-6">
        <div className="mb-4">
          <h1 className="font-display text-2xl text-ink dark:text-mist">Your companion</h1>
          <p className="mt-1 text-sm text-ink-faint dark:text-mist-soft/70">
            A private, local space to think out loud — not a replacement for professional support.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto rounded-2xl border border-ink/10 dark:border-mist/10 bg-paper dark:bg-night-raised shadow-soft dark:shadow-soft-dark">
          <div className="flex flex-col gap-4 px-5 py-6">
            {loading && (
              <p className="text-center text-sm text-ink-faint dark:text-mist-soft/70">Loading conversation…</p>
            )}

            {!loading && messages.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-ink-faint dark:text-mist-soft/70">
                  Nothing here yet — say whatever's on your mind, even if it's small.
                </p>
              </div>
            )}

            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} />
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-ink/5 dark:bg-mist/10 px-4 py-2.5">
                  <span className="flex gap-1">
                    <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <form onSubmit={handleSend} className="mt-4 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as unknown as FormEvent);
              }
            }}
            placeholder="Type a message… (Enter to send, Shift+Enter for a new line)"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-ink/10 dark:border-mist/15 bg-paper dark:bg-night-raised px-4 py-3 text-sm text-ink dark:text-mist placeholder:text-ink-faint/50 dark:placeholder:text-mist-soft/40 focus:outline-none focus:border-moss-400/60"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-xl bg-moss-600 px-4 py-3 text-sm font-medium text-white hover:bg-moss-500 transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'USER';

  if (message.safetyIntercepted) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-amber-400/40 bg-amber-400/10 px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink dark:text-mist">{message.content}</p>
          <p className="mt-1.5 font-mono text-[10px] text-ink-faint dark:text-mist-soft/50">{formatTime(message.createdAt)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'rounded-br-sm bg-moss-600 text-white'
            : 'rounded-bl-sm bg-ink/5 dark:bg-mist/10 text-ink dark:text-mist'
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        <p className={`mt-1 font-mono text-[10px] ${isUser ? 'text-white/60' : 'text-ink-faint dark:text-mist-soft/50'}`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

function Dot({ delay = '0s' }: { delay?: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-faint dark:bg-mist-soft/60"
      style={{ animationDelay: delay }}
    />
  );
}
