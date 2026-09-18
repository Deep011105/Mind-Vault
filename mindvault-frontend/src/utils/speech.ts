import { useCallback, useEffect, useRef, useState } from 'react';

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | undefined {
    if (typeof window === 'undefined') return undefined;
    return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

/**
 * Voice-to-text via the browser's native Web Speech API. Entirely client-side —
 * no backend call, no API key — which fits MindVault's local-first design.
 * Support varies (solid in Chrome/Edge, absent in Firefox and some Safari
 * versions), so callers should check `isSupported` and hide the mic button
 * when it's false rather than showing a button that silently does nothing.
 *
 * `onResult` fires with the FULL accumulated transcript for the current
 * listening session each time speech is recognized (not just the newest
 * chunk), so it's meant to be used as `setText(base + ' ' + transcript)` —
 * see MicButton, which handles that composition.
 */
export function useSpeechToText(onResult: (transcript: string, isFinal: boolean) => void) {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const onResultRef = useRef(onResult);
    onResultRef.current = onResult;

    const isSupported = !!getSpeechRecognitionCtor();

    const start = useCallback(() => {
        const Ctor = getSpeechRecognitionCtor();
        if (!Ctor) {
            setError('Voice input is not supported in this browser.');
            return;
        }
        setError(null);

        const recognition = new Ctor();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            let transcript = '';
            let isFinal = false;
            for (let i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
                if (event.results[i].isFinal) isFinal = true;
            }
            onResultRef.current(transcript.trim(), isFinal);
        };

        recognition.onerror = (event) => {
            setError(event.error === 'not-allowed' ? 'Microphone access was denied.' : `Voice input error: ${event.error}`);
            setIsListening(false);
        };

        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    }, []);

    const stop = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    useEffect(() => () => recognitionRef.current?.abort(), []);

    return { isSupported, isListening, error, start, stop };
}

/**
 * Reads text aloud via the browser's native SpeechSynthesis API. Also fully
 * client-side. `stop()` is exposed separately from the internal cancel-on-new-
 * speak so a "stop" button can halt playback without starting new speech.
 */
export function useTextToSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    const speak = useCallback(
        (text: string) => {
            if (!isSupported || !text.trim()) return;
            window.speechSynthesis.cancel(); // stop anything already playing
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        },
        [isSupported],
    );

    const stop = useCallback(() => {
        if (!isSupported) return;
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, [isSupported]);

    useEffect(() => () => window.speechSynthesis?.cancel(), []);

    return { isSupported, isSpeaking, speak, stop };
}