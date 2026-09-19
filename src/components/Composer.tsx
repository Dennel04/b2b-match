"use client";

import { useRef, useState } from "react";
import { Button, Icon } from "@/components/ui";

/**
 * The box everything can be said into, shared by both interviews — describing a problem and
 * describing a service ask different questions but are answered the same way: type it, dictate
 * it, or drop a text file in.
 */
export function Composer({
  input,
  onInput,
  onSend,
  onNote,
  busy,
}: {
  input: string;
  onInput: (v: string) => void;
  onSend: () => void;
  onNote: (t: string) => void;
  busy: boolean;
}) {
  const [listening, setListening] = useState(false);
  const recognition = useRef<SpeechRecognitionLike | null>(null);

  // Dictation is the browser's own; no library, and the button is simply absent where it is missing.
  const speech =
    typeof window !== "undefined" &&
    (window.SpeechRecognition ?? window.webkitSpeechRecognition);

  const dictate = () => {
    if (!speech) return;
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const r: SpeechRecognitionLike = new speech();
    r.lang = "en-GB";
    r.interimResults = false;
    r.onresult = (e) => {
      const said = Array.from(e.results)
        .map((x) => x[0].transcript)
        .join(" ")
        .trim();
      if (said) onInput(input ? `${input} ${said}` : said);
    };
    r.onerror = () => onNote("The microphone did not start. Type instead.");
    r.onend = () => setListening(false);
    recognition.current = r;
    r.start();
    setListening(true);
  };

  /**
   * Attachments are read as text and pasted into the message — a quote, a spec, an export. Images
   * and PDFs are not read: the interview is a text call. ponytail: add them when ask() takes blocks.
   */
  const attach = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!/^text\/|\.(md|csv|txt|json)$/i.test(file.type || file.name)) {
      onNote(
        `${file.name} is not a text file. Paste the part that matters instead.`,
      );
      return;
    }
    const text = (await file.text()).slice(0, 4000);
    onInput(`${input ? `${input}\n\n` : ""}From ${file.name}:\n${text}`);
  };

  return (
    <div className="border-t border-line p-3">
      <textarea
        value={input}
        onChange={(e) => onInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        rows={2}
        placeholder="Answer here — Enter sends, Shift+Enter makes a new line"
        className="w-full resize-none bg-transparent px-1.5 py-1 text-[14px] leading-relaxed outline-none placeholder:text-ink-faint"
      />
      <div className="flex items-center gap-2 pt-1">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] border border-line-strong px-2.5 py-1.5 text-[12px] font-semibold text-ink transition-colors hover:bg-surface-alt">
          <Icon name="paperclip" size={14} />
          Attach
          <input
            type="file"
            className="sr-only"
            accept=".txt,.md,.csv,.json,text/*"
            onChange={(e) => void attach(e.target.files)}
          />
        </label>
        {speech && (
          <Button
            variant="quiet"
            onClick={dictate}
            aria-pressed={listening}
            className={listening ? "border-accent text-accent-strong" : ""}
          >
            <Icon name="mic" size={14} />
            {listening ? "Listening…" : "Speak"}
          </Button>
        )}
        <Button
          className="ml-auto"
          onClick={onSend}
          disabled={busy || !input.trim()}
        >
          Send
        </Button>
      </div>
    </div>
  );
}

/** The slice of the Web Speech API this uses. It is not in lib.dom yet. */
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: (e: {
    results: ArrayLike<ArrayLike<{ transcript: string }>>;
  }) => void;
  onerror: () => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

/** Named, not a spinner: the screen says what it is doing while the model is out. */
export function Thinking({ label = "Reading your answer…" }: { label?: string }) {
  return (
    <p role="status" className="flex items-center gap-2.5 self-start text-[13px] text-ink-soft">
      <span aria-hidden className="blob h-3.5 w-3.5 bg-ink" />
      {label}
    </p>
  );
}
