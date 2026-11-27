import { useCallback, useEffect, useRef, useState } from 'react';

export type SpeechLangCode = 'en-US' | 'my-MM' | 'ko-KR' | 'ja-JP';

export const SPEECH_LANGUAGE_OPTIONS: ReadonlyArray<{
  code: SpeechLangCode;
  label: string;
}> = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'my-MM', label: 'မြန်မာ (MM)' },
  { code: 'ko-KR', label: '한국어 (KR)' },
  { code: 'ja-JP', label: '日本語 (JP)' },
];

export type VoiceInputStatus = 'idle' | 'listening' | 'error';

export type VoiceErrorCode =
  | 'not-allowed'
  | 'no-speech'
  | 'network'
  | 'audio-capture'
  | 'unsupported'
  | 'unknown';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function mapSpeechError(rawError: string): VoiceErrorCode {
  switch (rawError) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'not-allowed';
    case 'no-speech':
      return 'no-speech';
    case 'network':
      return 'network';
    case 'audio-capture':
      return 'audio-capture';
    default:
      return 'unknown';
  }
}

export function useVoiceInput({
  defaultLang = 'en-US',
  onResultTranscript,
}: {
  defaultLang?: SpeechLangCode;
  onResultTranscript: (transcript: string) => void;
}) {
  const [speechLang, setSpeechLang] = useState<SpeechLangCode>(defaultLang);
  const [status, setStatus] = useState<VoiceInputStatus>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<VoiceErrorCode | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const canceledByUserRef = useRef(false);
  const latestTranscriptRef = useRef('');
  const committedResultRef = useRef(false);
  const onResultRef = useRef(onResultTranscript);
  onResultRef.current = onResultTranscript;

  const isSupported = Boolean(getSpeechRecognitionConstructor());

  const cleanupInstance = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        // Ignore already-stopped errors across mobile WebKit/Chromium
      }
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupInstance();
    };
  }, [cleanupInstance]);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) {
      setStatus('idle');
      return;
    }
    try {
      rec.stop();
    } catch {
      cleanupInstance();
      setStatus('idle');
    }
  }, [cleanupInstance]);

  const cancelListening = useCallback(() => {
    canceledByUserRef.current = true;
    latestTranscriptRef.current = '';
    setInterimTranscript('');
    setErrorCode(null);
    cleanupInstance();
    setStatus('idle');
  }, [cleanupInstance]);

  const clearFeedback = useCallback(() => {
    setFinalTranscript(null);
    setInterimTranscript('');
    setErrorCode(null);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) {
      setStatus('error');
      setErrorCode('unsupported');
      return;
    }

    cleanupInstance();
    canceledByUserRef.current = false;
    committedResultRef.current = false;
    latestTranscriptRef.current = '';
    setErrorCode(null);
    setInterimTranscript('');

    try {
      const recognition = new Ctor();
      recognition.lang = speechLang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let fullText = '';
        let hasFinal = false;
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result?.[0]?.transcript ?? '';
          fullText += text;
          if (result?.isFinal) {
            hasFinal = true;
          }
        }

        const clean = fullText.trim();
        latestTranscriptRef.current = clean;
        setInterimTranscript(clean);

        if (hasFinal && clean && !committedResultRef.current) {
          committedResultRef.current = true;
          setFinalTranscript(clean);
          onResultRef.current(clean);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (canceledByUserRef.current || event.error === 'aborted') {
          return;
        }
        const mapped = mapSpeechError(event.error);
        setErrorCode(mapped);
        setStatus('error');
        cleanupInstance();
      };

      recognition.onend = () => {
        const hadUserCancel = canceledByUserRef.current;
        const captured = latestTranscriptRef.current;
        recognitionRef.current = null;

        if (hadUserCancel) {
          setStatus('idle');
          return;
        }

        // Mobile Safari/Android may end cleanly with interim text right before marking isFinal
        if (!committedResultRef.current && captured) {
          committedResultRef.current = true;
          setFinalTranscript(captured);
          onResultRef.current(captured);
          setInterimTranscript('');
          setStatus('idle');
          return;
        }

        setInterimTranscript('');
        setStatus((prev) => (prev === 'error' ? 'error' : 'idle'));
      };

      recognitionRef.current = recognition;
      setStatus('listening');
      recognition.start();
    } catch {
      cleanupInstance();
      setErrorCode('unknown');
      setStatus('error');
    }
  }, [cleanupInstance, speechLang]);

  return {
    isSupported,
    speechLang,
    setSpeechLang,
    status,
    interimTranscript,
    finalTranscript,
    errorCode,
    startListening,
    stopListening,
    cancelListening,
    clearFeedback,
  };
}
