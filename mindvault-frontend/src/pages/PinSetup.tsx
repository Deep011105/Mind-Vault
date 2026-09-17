import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupPin } from '../api/auth';
import { setToken } from '../api/client';
import { useToast } from '../context/ToastContext';

const PIN_LENGTH = 4;

export default function PinSetup() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  }

  function pressDigit(d: string) {
    if (submitting) return;
    const next = pin + d;
    if (next.length > PIN_LENGTH) return;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      // Small delay so the last dot fills before we act.
      setTimeout(() => handleComplete(next), 80);
    }
  }

  function backspace() {
    setPin((p) => p.slice(0, -1));
  }

  async function handleComplete(entered: string) {
    if (step === 'create') {
      setFirstPin(entered);
      setPin('');
      setStep('confirm');
      return;
    }

    // Confirm step
    if (entered !== firstPin) {
      triggerShake();
      setPin('');
      showToast("PINs don't match — try again.", 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { token } = await setupPin(entered);
      setToken(token);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Setup failed. Please try again.';
      showToast(msg, 'error');
      setPin('');
      setStep('create');
      setFirstPin('');
    } finally {
      setSubmitting(false);
    }
  }

  function goBack() {
    setStep('create');
    setFirstPin('');
    setPin('');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper dark:bg-night px-4">
      <div className="w-full max-w-xs">
        {/* Brand */}
        <div className="mb-10 text-center">
          <p className="font-display text-4xl text-ink dark:text-mist tracking-tight">MindVault</p>
          <p className="mt-1 text-xs font-mono uppercase tracking-widest text-ink-faint dark:text-mist-soft/60">
            Private · Local · Yours
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-ink/10 dark:border-mist/10 bg-white dark:bg-night-raised shadow-soft dark:shadow-soft-dark px-8 py-8">
          {/* Step heading */}
          <div className="mb-6 text-center">
            {step === 'create' ? (
              <>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-moss-50 dark:bg-moss-900/40">
                  <svg className="h-6 w-6 text-moss-600 dark:text-moss-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7a4.5 4.5 0 00-9 0v3.5M5 10.5h14a1 1 0 011 1V19a2 2 0 01-2 2H6a2 2 0 01-2-2v-7.5a1 1 0 011-1z" />
                  </svg>
                </div>
                <h1 className="font-display text-xl text-ink dark:text-mist">Create a PIN</h1>
                <p className="mt-1 text-sm text-ink-faint dark:text-mist-soft/70">
                  Choose a {PIN_LENGTH}-digit PIN to secure your vault
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-moss-50 dark:bg-moss-900/40">
                  <svg className="h-6 w-6 text-moss-600 dark:text-moss-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="font-display text-xl text-ink dark:text-mist">Confirm your PIN</h1>
                <p className="mt-1 text-sm text-ink-faint dark:text-mist-soft/70">
                  Enter the same PIN again to confirm
                </p>
              </>
            )}
          </div>

          {/* PIN dots */}
          <div className={`mb-8 flex justify-center gap-4 ${shake ? 'animate-shake' : ''}`}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={`h-3.5 w-3.5 rounded-full transition-all duration-150 ${
                  i < pin.length
                    ? 'bg-moss-600 dark:bg-moss-400 scale-110'
                    : 'bg-ink/12 dark:bg-mist/15'
                }`}
              />
            ))}
          </div>

          {/* Number pad */}
          <div className="grid grid-cols-3 gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <PinButton key={n} label={String(n)} onClick={() => pressDigit(String(n))} disabled={submitting} />
            ))}
            {/* Empty bottom-left */}
            <div />
            <PinButton label="0" onClick={() => pressDigit('0')} disabled={submitting} />
            <button
              onClick={backspace}
              disabled={submitting || pin.length === 0}
              className="flex h-14 items-center justify-center rounded-xl text-ink-soft dark:text-mist-soft
                         hover:bg-ink/5 dark:hover:bg-mist/10 active:scale-95
                         transition-all disabled:opacity-30"
              aria-label="Backspace"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.374-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33z" />
              </svg>
            </button>
          </div>

          {/* Back link on confirm step */}
          {step === 'confirm' && (
            <button
              onClick={goBack}
              className="mt-5 w-full text-center text-xs text-ink-faint dark:text-mist-soft/60 hover:text-ink-soft dark:hover:text-mist-soft transition-colors"
            >
              ← Choose a different PIN
            </button>
          )}

          {/* Step indicator */}
          <div className="mt-6 flex justify-center gap-1.5">
            <div className={`h-1 w-6 rounded-full transition-all ${step === 'create' ? 'bg-moss-500 dark:bg-moss-400' : 'bg-ink/15 dark:bg-mist/20'}`} />
            <div className={`h-1 w-6 rounded-full transition-all ${step === 'confirm' ? 'bg-moss-500 dark:bg-moss-400' : 'bg-ink/15 dark:bg-mist/20'}`} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink-faint dark:text-mist-soft/50">
          Your data stays private and local — never leaves this machine.
        </p>
      </div>
    </div>
  );
}

function PinButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-14 items-center justify-center rounded-xl border border-ink/8 dark:border-mist/10
                 bg-paper-dim dark:bg-night font-display text-xl text-ink dark:text-mist
                 hover:bg-moss-50 hover:border-moss-400/30 dark:hover:bg-moss-900/20 dark:hover:border-moss-400/30
                 active:scale-95 transition-all shadow-soft dark:shadow-soft-dark
                 disabled:opacity-40 select-none"
    >
      {label}
    </button>
  );
}
