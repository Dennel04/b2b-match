"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { runInterview, saveProblem } from "@/actions/problem";
import { AppShell } from "@/components/layout";
import { Button, Icon } from "@/components/ui";
import type { CompanyProfile, InterviewTurn } from "@/types";
import {
  FORMATS,
  PERIODS,
  REQUIREMENTS,
  type Period,
} from "../../onboarding/fields";
import {
  DEPARTMENTS,
  EMPTY,
  buyerTermsFrom,
  knownLines,
  problemText,
  type ProblemDraft,
} from "./fields";
import { Hero } from "./Hero";
import { ProblemForm } from "./ProblemForm";
import { Pills } from "@/components/cloud";
import { GATES, OPEN_QUESTIONS, SCRIPTED_NOTE, type GateKey } from "./script";

type Message = { from: "agent" | "you"; text: string };
type Key = keyof ProblemDraft;

/**
 * Describe a problem: a chat on the left, the form it fills on the right.
 *
 * The person can work from either side. Whatever they touch themselves is theirs — the interviewer
 * may fill a field once but never overwrites an answer a human gave, and is told what the form
 * already says so it does not ask twice. Nothing on this screen leaves the company.
 */
export function Compose({
  companyId,
  profile,
  initials,
}: {
  companyId: string;
  profile: CompanyProfile | null;
  initials: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<ProblemDraft>(EMPTY);
  const [messages, setMessages] = useState<Message[]>([]);
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const [thinking, setThinking] = useState(false);
  // Which scripted question is on screen. -1 while the model is still asking open ones.
  const [gate, setGate] = useState(-1);
  const [filled, setFilled] = useState<Key[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // A field the person edited by hand. The interviewer fills the rest and never takes one back.
  const mine = useRef(new Set<Key>());
  const asked = useRef(0);
  const question = useRef<string>("");
  const log = useRef<HTMLDivElement>(null);

  const set = <K extends Key>(k: K, v: ProblemDraft[K]) => {
    mine.current.add(k);
    setDraft((d) => ({ ...d, [k]: v }));
  };

  useEffect(() => {
    log.current?.scrollTo({
      top: log.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  /** The hero hands over the problem itself; the interview opens on it instead of a blank page. */
  const begin = (text: string) => {
    const d: ProblemDraft = { ...EMPTY, description: text };
    setDraft(d);
    setMessages([{ from: "you", text }]);
    setStarted(true);
    // Queued for after the swap has painted, so the screen never waits on the model to change.
    requestAnimationFrame(() => void turn([], null, d));
  };

  /** One interview round: ask, merge what came back, show the next question. */
  /** The scripted half: a closed question costs no model call, it just shows its own control. */
  function openGate(i: number, from: ProblemDraft) {
    if (i >= GATES.length) return void turn([...turns], null, from, "digest");
    setGate(i);
    setMessages((m) => [...m, { from: "agent", text: GATES[i].question }]);
  }

  async function turn(
    next: InterviewTurn[],
    answer: string | null,
    from: ProblemDraft = draft,
    mode: "ask" | "digest" = "ask",
  ) {
    setError(null);
    setThinking(true);
    if (answer) setMessages((m) => [...m, { from: "you", text: answer }]);
    try {
      const labels = {
        formats: from.formats.map(
          (f) => FORMATS.find((x) => x.value === f)?.label ?? f,
        ),
        requirements: from.requirements.map(
          (r) => REQUIREMENTS.find((x) => x.value === r)?.label ?? r,
        ),
      };
      const r = await runInterview(
        next,
        profile,
        DEPARTMENTS,
        `${SCRIPTED_NOTE}\n${knownLines(from, labels)}`,
      );

      setDraft((d) => {
        const moved: Key[] = [];
        const keep = <K extends Key>(
          k: K,
          v: ProblemDraft[K] | null | undefined,
        ) =>
          mine.current.has(k) ||
          v === null ||
          v === undefined ||
          (Array.isArray(v) && v.length === 0) ||
          v === ""
            ? d[k]
            : (moved.push(k), v);
        const t = r.terms;
        const merged = {
          ...d,
          title: keep("title", r.title),
          description: keep("description", r.summary),
          department: keep(
            "department",
            r.department && DEPARTMENTS.includes(r.department)
              ? r.department
              : null,
          ),
          urgency: keep("urgency", r.urgency),
          ceilingAmount: keep(
            "ceilingAmount",
            t?.budget_ceiling ? String(t.budget_ceiling.amount) : null,
          ),
          ceilingPeriod: keep(
            "ceilingPeriod",
            t?.budget_ceiling?.period ?? null,
          ),
          formats: keep("formats", t?.contract_formats),
          startBy: keep("startBy", t?.start_by),
          requirements: keep("requirements", t?.requirements),
          dealbreakers: keep("dealbreakers", t?.dealbreakers),
        };
        // Outside the updater: it may run twice, and the flash should fire once.
        queueMicrotask(() => setFilled(moved));
        return merged;
      });

      setTurns(next);
      if (
        mode === "ask" &&
        r.follow_up &&
        !r.done &&
        asked.current < OPEN_QUESTIONS
      ) {
        asked.current += 1;
        question.current = r.follow_up;
        setMessages((m) => [
          ...m,
          { from: "agent", text: r.follow_up as string },
        ]);
      } else if (mode === "ask") {
        openGate(0, from);
      } else {
        setDone(true);
        setMessages((m) => [
          ...m,
          {
            from: "agent",
            text: "That is enough to start looking. Check the form and change anything I got wrong.",
          },
        ]);
      }
    } catch {
      setError(
        "The interviewer did not answer. You can retry, or just fill the form yourself.",
      );
    } finally {
      setThinking(false);
    }
  }

  const answerGate = () => {
    setGate(-1);
    openGate(gate + 1, draft);
  };

  const send = () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    void turn([...turns, { question: question.current, answer: text }], text);
  };

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const p = await saveProblem({
        company_id: companyId,
        text: problemText(draft),
        department: draft.department || undefined,
        interview_json: turns,
        buyer_terms: buyerTermsFrom(draft),
        urgency: draft.urgency,
      });
      router.push(`/problems/${p.id}`);
    } catch {
      setError("Could not save the problem. Try again.");
      setSaving(false);
    }
  }

  const ready = draft.description.trim().length >= 20;

  const form = (
    <ProblemForm
      draft={draft}
      filled={filled}
      set={set}
      save={save}
      error={error}
      saving={saving}
      ready={ready}
    />
  );

  if (!started) return <Hero onStart={begin} form={form} />;

  return (
    <AppShell active="problems" initials={initials}>
      <main className="flex flex-col">
        <section className="mx-auto w-full max-w-[1440px] px-4 pt-6 md:px-9 md:pt-8">
          <nav className="text-[12.5px] text-ink-faint">
            <Link href="/dashboard" className="hover:text-ink hover:underline">
              Problems
            </Link>
            <span className="px-1.5">›</span>
            New
          </nav>
          <h1 className="mt-1.5 text-[34px] font-bold leading-[1.1] tracking-[-0.03em] md:text-[40px]">
            Describe a problem
          </h1>
          <p className="mt-2 max-w-[52ch] text-[16px] leading-snug text-ink-soft">
            Answer a few questions and the form fills itself. Change anything it
            gets wrong.
          </p>
        </section>

        <section className="mx-auto grid w-full max-w-[1440px] gap-8 px-4 pb-12 pt-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] md:px-9">
          <Interviewer
            messages={messages}
            thinking={thinking}
            done={done}
            input={input}
            onInput={setInput}
            onSend={send}
            onNote={(t) => setError(t)}
            logRef={log}
            gate={gate >= 0 ? GATES[gate].key : null}
            onGate={answerGate}
            draft={draft}
            set={set}
          />

          {form}
        </section>
      </main>
    </AppShell>
  );
}

/** The left half: the conversation, and the one box everything can be said into. */
function Interviewer({
  messages,
  thinking,
  done,
  input,
  onInput,
  onSend,
  onNote,
  logRef,
  gate,
  onGate,
  draft,
  set,
}: {
  messages: Message[];
  thinking: boolean;
  done: boolean;
  input: string;
  onInput: (v: string) => void;
  onSend: () => void;
  onNote: (t: string) => void;
  logRef: React.RefObject<HTMLDivElement | null>;
  /** A scripted question is on screen: it is answered with controls, not with a sentence. */
  gate: GateKey | null;
  onGate: () => void;
  draft: ProblemDraft;
  set: <K extends Key>(k: K, v: ProblemDraft[K]) => void;
}) {
  return (
    <div className="soft-in flex h-[min(76vh,760px)] flex-col overflow-hidden rounded-[24px] border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
        <span className="text-[13px] font-semibold">Interview</span>
        <span className="ml-auto text-[12px] text-ink-faint">
          {done ? "Enough to start" : "A few questions"}
        </span>
      </div>

      <div
        ref={logRef}
        className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4"
      >
        {messages.map((m, i) => {
          const you = m.from === "you";
          // The tail is the one square corner, on the side the message came from.
          return (
            <p
              key={i}
              className={`msg-in max-w-[82%] whitespace-pre-wrap px-4 py-2.5 text-[14px] leading-relaxed ${
                you
                  ? "self-end rounded-[18px] rounded-br-[6px] bg-ink text-surface"
                  : "self-start rounded-[18px] rounded-bl-[6px] bg-surface-alt text-ink"
              }`}
            >
              {m.text}
            </p>
          );
        })}
        {thinking && <Thinking />}
      </div>

      {gate ? (
        <Gate which={gate} draft={draft} set={set} onDone={onGate} />
      ) : (
        <Composer
          input={input}
          onInput={onInput}
          onSend={onSend}
          onNote={onNote}
          busy={thinking}
        />
      )}
    </div>
  );
}

/**
 * A scripted question, answered with the controls the form already uses. No model call is made
 * for these, and the answer lands straight in the draft the form is showing.
 */
function Gate({
  which,
  draft,
  set,
  onDone,
}: {
  which: GateKey;
  draft: ProblemDraft;
  set: <K extends Key>(k: K, v: ProblemDraft[K]) => void;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-line p-3">
      {which === "budget" && (
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="text-[15px] font-semibold text-ink-faint"
          >
            €
          </span>
          <input
            aria-label="Budget ceiling"
            inputMode="numeric"
            autoFocus
            value={
              draft.ceilingAmount
                ? Number(draft.ceilingAmount)
                    .toLocaleString("en-US")
                    .replace(/,/g, " ")
                : ""
            }
            onChange={(e) =>
              set(
                "ceilingAmount",
                e.target.value.replace(/[^\d]/g, "").slice(0, 9),
              )
            }
            onKeyDown={(e) => e.key === "Enter" && onDone()}
            placeholder="25 000"
            className="min-w-0 flex-1 bg-transparent text-[15px] tabular-nums outline-none placeholder:text-ink-faint"
          />
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                aria-pressed={draft.ceilingPeriod === p.value}
                onClick={() => set("ceilingPeriod", p.value as Period)}
                className={`inline-flex h-8 cursor-pointer items-center rounded-full px-3 text-[12.5px] font-medium transition-colors ${
                  draft.ceilingPeriod === p.value
                    ? "bg-ink text-surface"
                    : "text-ink-soft ring-1 ring-ink/10 hover:text-ink"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {which === "formats" && (
        <Pills
          options={FORMATS}
          value={draft.formats}
          onChange={(v) => set("formats", v)}
        />
      )}

      {which === "requirements" && (
        <Pills
          options={REQUIREMENTS}
          value={draft.requirements}
          onChange={(v) => set("requirements", v)}
        />
      )}

      <Button className="self-end" onClick={onDone}>
        Continue
      </Button>
    </div>
  );
}

/** Named, not a spinner: the screen says what it is doing while the model is out. */
function Thinking() {
  return (
    <p
      role="status"
      className="flex items-center gap-2.5 self-start text-[13px] text-ink-soft"
    >
      <span aria-hidden className="blob h-3.5 w-3.5 bg-ink" />
      Reading your answer…
    </p>
  );
}

function Composer({
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
