"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Minimal typing — Web Speech API is not in all TypeScript DOM libs. */
interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function humanizeSpeechError(code: string): string {
  switch (code) {
    case "not-allowed":
      return "Microphone or speech permission blocked — check browser site settings.";
    case "service-not-allowed":
      return "Speech service not allowed for this page (try HTTPS or another browser).";
    case "network":
      return "Network error — check connection and try again.";
    case "aborted":
      return "";
    case "no-speech":
      return "No speech detected — try again a little closer.";
    default:
      return code ? `Voice error: ${code}` : "Voice input failed.";
  }
}

type VoiceDictationButtonProps = {
  /** Called with each finalized phrase while listening. */
  onAppend: (text: string) => void;
  disabled?: boolean;
  className?: string;
};

export function VoiceDictationButton({ onAppend, disabled, className }: VoiceDictationButtonProps) {
  const [listening, setListening] = useState(false);
  /** null = not yet checked (after SSR mount). Must not read window during SSR initial state. */
  const [supported, setSupported] = useState<boolean | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onAppendRef = useRef(onAppend);
  onAppendRef.current = onAppend;

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
  }, []);

  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        // ignore
      }
      recRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!hint) return;
    const t = window.setTimeout(() => setHint(null), 6000);
    return () => window.clearTimeout(t);
  }, [hint]);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      // ignore
    }
    recRef.current = null;
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || disabled) {
      if (!Ctor) setHint("Voice isn’t available in this browser (try Chrome on desktop or Android).");
      return;
    }

    const rec = new Ctor();
    rec.lang = typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US";
    rec.continuous = true;
    rec.interimResults = false;

    rec.onresult = (event: SpeechRecognitionEventLike) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const t = event.results[i][0].transcript.trim();
          if (t) onAppendRef.current(t);
        }
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEventLike) => {
      const msg = humanizeSpeechError(event.error);
      if (msg) setHint(msg);
      recRef.current = null;
      setListening(false);
    };

    rec.onend = () => {
      recRef.current = null;
      setListening(false);
    };

    try {
      recRef.current = rec;
      rec.start();
      setListening(true);
      setHint(null);
    } catch {
      recRef.current = null;
      setListening(false);
      setHint("Could not start voice input — try again or use another browser.");
    }
  }, [disabled]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  if (supported === false) {
    return (
      <div className={`shrink-0 text-right ${className ?? ""}`}>
        <button
          type="button"
          disabled
          title="Voice input isn’t supported in this browser (try Chrome or Edge)."
          className="rounded-lg border border-dashed px-2 py-1 text-xs text-muted-foreground opacity-50"
        >
          <span aria-hidden="true">🎤</span> Voice
        </button>
      </div>
    );
  }

  return (
    <div className={`shrink-0 text-right ${className ?? ""}`}>
      <button
        type="button"
        disabled={disabled || supported === null}
        onClick={toggle}
        aria-pressed={listening}
        title={listening ? "Stop dictation" : "Speak your message — text is added to the box"}
        className={`rounded-lg border px-2 py-1 text-xs font-medium transition ${
          listening
            ? "border-red-500/50 bg-red-500/15 text-red-200 ring-1 ring-red-500/30"
            : "border-border bg-surface-muted text-foreground hover:bg-surface"
        } ${disabled || supported === null ? "opacity-60" : ""}`}
      >
        <span className="inline-flex items-center gap-1">
          <span aria-hidden="true">{listening ? "⏹" : "🎤"}</span>
          {listening ? "Stop" : supported === null ? "…" : "Voice"}
        </span>
      </button>
      {hint ? <p className="mt-1 max-w-[200px] text-[10px] leading-snug text-amber-200">{hint}</p> : null}
    </div>
  );
}
