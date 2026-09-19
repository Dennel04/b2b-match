"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { runInterview, saveProblem } from "@/actions/problem";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui";
import { Composer, Thinking } from "@/components/Composer";
import type { CompanyProfile, ContractFormat, InterviewTurn, Requirement } from "@/types";
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
import { Pills, PillsNarrowed } from "@/components/cloud";
import { GATES, OPEN_QUESTIONS, SCRIPTED_NOTE, TIMINGS, type GateKey } from "./script";

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
  // The deadline chip picked in the interview, so the reply can name it rather than a date.
  const [timing, setTiming] = useState<(typeof TIMINGS)[number]["value"] | null>(null);
  // The runners-up the interviewer named, so the closed question offers three chips, not seventeen.
  const [alts, setAlts] = useState<string[]>([]);
  // Which of the closed options are worth putting in front of THIS person, so the form does not
  // ask a €500 job about ISO 27001.
  const [offer, setOffer] = useState<{ formats: string[]; second: string[] }>({ formats: [], second: [] });

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
  function openGate(i: number, from: ProblemDraft, history: InterviewTurn[] = turns) {
    if (i >= GATES.length) return void turn(history, null, from, "digest");
    setGate(i);
    setMessages((m) => [...m, { from: "agent", text: GATES[i].question(from.department) }]);
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

      setAlts((r.department_alternatives ?? []).filter((a) => DEPARTMENTS.includes(a)));
      setOffer({ formats: r.suggested_formats ?? [], second: r.suggested_requirements ?? [] });
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
        openGate(0, from, next);
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

  /**
   * A scripted answer is said back in the chat as the person's own reply and kept as an interview
   * turn — otherwise the questions pile up with nothing between them and the chat reads as spam.
   */
  const answerGate = () => {
    const g = GATES[gate];
    const reply = gateReply(g.key, draft, timing);
    const history = [...turns, { question: g.question(draft.department), answer: reply }];
    setMessages((m) => [...m, { from: "you", text: reply }]);
    setTurns(history);
    setGate(-1);
    openGate(gate + 1, draft, history);
  };

  const pickTiming = (v: (typeof TIMINGS)[number]["value"] | null) => {
    setTiming(v);
    const t = TIMINGS.find((x) => x.value === v);
    set("startBy", t?.days ? new Date(Date.now() + t.days * 86_400_000).toISOString().slice(0, 10) : "");
    if (t) set("urgency", t.urgency);
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
    const r = await saveProblem({
      company_id: companyId,
      text: problemText(draft),
      department: draft.department || undefined,
      interview_json: turns,
      buyer_terms: buyerTermsFrom(draft),
      urgency: draft.urgency,
    });
    if (!r.ok) {
      setError(r.message);
      setSaving(false);
      return;
    }
    router.push(`/problems/${r.data.id}`);
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
          <nav aria-label="Breadcrumb" className="text-[12.5px] text-ink-soft">
            <Link href="/problems" className="hover:text-ink hover:underline">
              Problems
            </Link>
            <span className="px-1.5">›</span>
            New
          </nav>
          <h1 className="mt-1.5 text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] md:text-[34px]">
            Describe a problem
          </h1>
          <p className="mt-2 max-w-[52ch] text-[14px] text-ink-soft">
            Answer a few questions and the form fills itself. Change anything it
            gets wrong.
          </p>
        </section>

        <section className="mx-auto grid w-full max-w-[1440px] gap-8 px-4 pb-12 pt-6 lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)] md:px-9">
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
            alts={alts}
            offer={offer}
            draft={draft}
            set={set}
            timing={timing}
            onTiming={pickTiming}
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
  alts,
  offer,
  draft,
  set,
  timing,
  onTiming,
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
  /** What the interviewer suggested besides its first answer. */
  alts: string[];
  /** Which closed options the interviewer thinks are worth offering this person. */
  offer: { formats: string[]; second: string[] };
  draft: ProblemDraft;
  set: <K extends Key>(k: K, v: ProblemDraft[K]) => void;
  timing: (typeof TIMINGS)[number]["value"] | null;
  onTiming: (v: (typeof TIMINGS)[number]["value"] | null) => void;
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
        <Gate which={gate} draft={draft} set={set} onDone={onGate} alts={alts} offer={offer} timing={timing} onTiming={onTiming} />
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
  alts,
  offer,
  timing,
  onTiming,
}: {
  which: GateKey;
  draft: ProblemDraft;
  set: <K extends Key>(k: K, v: ProblemDraft[K]) => void;
  onDone: () => void;
  alts: string[];
  offer: { formats: string[]; second: string[] };
  timing: (typeof TIMINGS)[number]["value"] | null;
  onTiming: (v: (typeof TIMINGS)[number]["value"] | null) => void;
}) {
  const empty =
    (which === "department" && !draft.department) ||
    (which === "timing" && !timing) ||
    (which === "budget" && !Number(draft.ceilingAmount)) ||
    (which === "formats" && !draft.formats.length) ||
    (which === "requirements" && !draft.requirements.length);
  return (
    <div className="flex max-h-[46%] flex-col gap-3 overflow-y-auto border-t border-line p-3">
      {which === "department" && (
        <PillsNarrowed
          options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
          suggested={[...(draft.department ? [draft.department] : []), ...alts]}
          value={draft.department ? [draft.department] : []}
          onChange={(v) => set("department", v.find((x) => x !== draft.department) ?? "")}
          more="Another part of the business"
          openWhenEmpty
        />
      )}

      {which === "timing" && (
        <Pills
          options={TIMINGS.map((t) => ({ value: t.value, label: t.label }))}
          value={timing ? [timing] : []}
          onChange={(v) => onTiming(v.find((x) => x !== timing) ?? null)}
        />
      )}

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
                    ? "bg-selected text-surface"
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
        <PillsNarrowed
          options={FORMATS}
          suggested={offer.formats as ContractFormat[]}
          value={draft.formats}
          onChange={(v) => set("formats", v)}
          more="Other ways of buying"
        />
      )}

      {which === "requirements" && (
        <PillsNarrowed
          options={REQUIREMENTS}
          suggested={offer.second as Requirement[]}
          value={draft.requirements}
          onChange={(v) => set("requirements", v)}
          more="Other things a company must satisfy"
        />
      )}

      <Button className="self-end" variant={empty ? "ghost" : "solid"} onClick={onDone}>
        {empty ? "Skip" : "Continue"}
      </Button>
    </div>
  );
}

/** The person's reply to a scripted question, in their voice, as it appears in the chat. */
function gateReply(
  which: GateKey,
  d: ProblemDraft,
  timing: (typeof TIMINGS)[number]["value"] | null,
): string {
  const list = (xs: string[]) => xs.join(", ");
  switch (which) {
    case "department":
      return d.department || "Not sure yet";
    case "timing":
      return TIMINGS.find((t) => t.value === timing)?.label ?? "No fixed date";
    case "budget":
      return Number(d.ceilingAmount)
        ? `Up to €${Number(d.ceilingAmount).toLocaleString("en-US").replace(/,/g, " ")} ${d.ceilingPeriod === "monthly" ? "per month" : "for the project"}`
        : "I would rather not say";
    case "formats":
      return d.formats.length ? list(d.formats.map((f) => FORMATS.find((x) => x.value === f)?.label ?? f)) : "Any format is fine";
    case "requirements":
      return d.requirements.length ? list(d.requirements.map((r) => REQUIREMENTS.find((x) => x.value === r)?.label ?? r)) : "Nothing specific";
  }
}


