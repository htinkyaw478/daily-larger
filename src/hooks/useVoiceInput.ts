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
  | 'service-not-allowed'
  | 'language-not-supported'
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

export function getMyanmarFallbackLang(
  targetLang: string,
  triedFallback: boolean,
  mappedError: VoiceErrorCode
): 'my' | null {
  if (!triedFallback && targetLang === 'my-MM' && mappedError === 'language-not-supported') {
    return 'my';
  }
  return null;
}

export function mapSpeechError(rawError: string, lang?: string): VoiceErrorCode {
  switch (rawError) {
    case 'not-allowed':
      return 'not-allowed';
    case 'language-not-supported':
      return 'language-not-supported';
    case 'service-not-allowed':
      // Safari / WebKit emits 'service-not-allowed' when a speech locale (e.g. my-MM / my)
      // lacks an OS dictation model, even though microphone permission is granted.
      return lang === 'my-MM' || lang === 'my'
        ? 'language-not-supported'
        : 'service-not-allowed';
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
  const [speechLang, setSpeechLangState] = useState<SpeechLangCode>(defaultLang);
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
  const startAttemptRef = useRef<(targetLang: string, triedFallback: boolean) => void>(() => {});

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
    setStatus((prev) => (prev === 'error' ? 'idle' : prev));
  }, []);

  const setSpeechLang = useCallback((nextLang: SpeechLangCode) => {
    setSpeechLangState(nextLang);
    setErrorCode(null);
    setStatus((prev) => (prev === 'error' ? 'idle' : prev));
  }, []);

  const acceptTranscript = useCallback((rawText: string) => {
    const clean = rawText.trim();
    if (!clean) return;
    setErrorCode(null);
    setInterimTranscript('');
    setFinalTranscript(clean);
    setStatus('idle');
    onResultRef.current(clean);
  }, []);

  const startRecognitionAttempt = useCallback(
    (targetLang: string, triedFallback: boolean) => {
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
        recognition.lang = targetLang;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          if (recognitionRef.current !== recognition) return;
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
          if (recognitionRef.current !== recognition) return;
          if (canceledByUserRef.current || event.error === 'aborted') {
            return;
          }
          const mapped = mapSpeechError(event.error, targetLang);
          const fallbackLang = getMyanmarFallbackLang(targetLang, triedFallback, mapped);
          if (fallbackLang) {
            // Some browsers accept the base BCP-47 tag 'my' even when 'my-MM' fails.
            startAttemptRef.current(fallbackLang, true);
            return;
          }
          setErrorCode(mapped);
          setStatus('error');
          cleanupInstance();
        };

        recognition.onend = () => {
          if (recognitionRef.current !== recognition) return;
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
        const isMyanmarFallback =
          triedFallback && (targetLang === 'my-MM' || targetLang === 'my');
        setErrorCode(isMyanmarFallback ? 'language-not-supported' : 'unknown');
        setStatus('error');
      }
    },
    [cleanupInstance]
  );

  startAttemptRef.current = startRecognitionAttempt;

  const startListening = useCallback(() => {
    startRecognitionAttempt(speechLang, false);
  }, [speechLang, startRecognitionAttempt]);

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
    acceptTranscript,
  };
}
