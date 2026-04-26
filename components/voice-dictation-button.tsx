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

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
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

type VoiceDictationButtonProps = {
  /** Called with each finalized phrase while listening. */
  onAppend: (text: string) => void;
  disabled?: boolean;
  className?: string;
};

export function VoiceDictationButton({ onAppend, disabled, className }: VoiceDictationButtonProps) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => getRecognitionCtor() !== null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onAppendRef = useRef(onAppend);
  onAppendRef.current = onAppend;

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
    if (!Ctor || disabled) return;

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

    rec.onerror = () => {
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
    } catch {
      recRef.current = null;
      setListening(false);
    }
  }, [disabled]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        title="Voice input isn’t supported in this browser (try Chrome or Edge)."
        className={`shrink-0 rounded-lg border border-dashed px-2 py-1 text-xs text-muted-foreground opacity-50 ${className ?? ""}`}
      >
        <span aria-hidden="true">🎤</span> Voice
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={toggle}
      aria-pressed={listening}
      title={listening ? "Stop dictation" : "Speak your message — text is added to the box"}
      className={`shrink-0 rounded-lg border px-2 py-1 text-xs font-medium transition ${
        listening
          ? "border-red-500/50 bg-red-500/15 text-red-200 ring-1 ring-red-500/30"
          : "border-border bg-surface-muted text-foreground hover:bg-surface"
      } ${disabled ? "opacity-50" : ""} ${className ?? ""}`}
    >
      <span className="inline-flex items-center gap-1">
        <span aria-hidden="true">{listening ? "⏹" : "🎤"}</span>
        {listening ? "Stop" : "Voice"}
      </span>
    </button>
  );
}
