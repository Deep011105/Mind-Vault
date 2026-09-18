import { useRef } from 'react';
import { useSpeechToText } from '../utils/speech';
import { useToast } from '../context/ToastContext';

interface MicButtonProps {
    /** Current text in the field this mic is attached to. */
    value: string;
    /** Called with the new full text as speech is recognized. */
    onChange: (next: string) => void;
    className?: string;
}

/**
 * Toggles voice dictation into whatever text field it's paired with. Renders
 * nothing if the browser doesn't support the Web Speech API, rather than
 * showing a button that would silently fail.
 */
export default function MicButton({ value, onChange, className = '' }: MicButtonProps) {
    const { showToast } = useToast();
    // The transcript text field had *before* this listening session started —
    // each onResult fires with the FULL transcript-so-far for the session, so
    // we splice it onto this fixed base rather than the ever-changing `value`.
    const baseTextRef = useRef('');

    const { isSupported, isListening, start, stop } = useSpeechToText((transcript) => {
        const base = baseTextRef.current;
        const joined = base && transcript ? `${base} ${transcript}` : base || transcript;
        onChange(joined);
    });

    if (!isSupported) return null;

    const toggle = () => {
        if (isListening) {
            stop();
            return;
        }
        baseTextRef.current = value;
        try {
            start();
        } catch {
            showToast('Could not start voice input — check microphone permissions.', 'error');
        }
    };

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            title={isListening ? 'Stop voice input' : 'Start voice input'}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${isListening
                    ? 'border-rust-400 bg-rust-500 text-white animate-pulse'
                    : 'border-ink/10 dark:border-mist/15 text-ink-soft dark:text-mist-soft hover:border-moss-400/50'
                } ${className}`}
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
        </button>
    );
}