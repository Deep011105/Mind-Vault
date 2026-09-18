import { useTextToSpeech } from '../utils/speech';

interface SpeakButtonProps {
    text: string;
    className?: string;
}

/**
 * Reads `text` aloud on click; click again while speaking to stop. Renders
 * nothing if the browser has no SpeechSynthesis support.
 */
export default function SpeakButton({ text, className = '' }: SpeakButtonProps) {
    const { isSupported, isSpeaking, speak, stop } = useTextToSpeech();

    if (!isSupported || !text.trim()) return null;

    return (
        <button
            type="button"
            onClick={() => (isSpeaking ? stop() : speak(text))}
            aria-label={isSpeaking ? 'Stop reading aloud' : 'Read aloud'}
            title={isSpeaking ? 'Stop reading aloud' : 'Read aloud'}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-current/70 transition-colors hover:text-current ${className}`}
        >
            {isSpeaking ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
            ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
                </svg>
            )}
        </button>
    );
}