import { Hanken_Grotesk } from 'next/font/google';
import {
  ACTIVITY, COMPANY, ENVELOPE, FORMAT_LABEL, INCOMING, LIVE_NEGOTIATION, MATCHES, MEETING,
  PROBLEMS, STAGE_LABEL,
} from '../_data';

/**
 * Variant L, skill: claude-design (jiji262), Design Direction Advisor -> "Dieter Rams industrial".
 * Declared system:
 *   type    one grotesk (Hanken Grotesk), two weights, three sizes: 13 / 16 / 28 (+ 64 for dials)
 *   colour  warm grey body #E7E5E0, panel #F4F3F0, graphite #2A2A28, one functional orange
 *           #EB5E1E used only where it means "act" or "live"
 *   layout  the dashboard as a device: panels with hairline-separated spec tables, scores as
 *           dials, a speaker-grille texture on the one hero panel
 *   rule    no decoration that is not also information
 */

const hanken = Hanken_Grotesk({ subsets: ['latin'], weight: ['400', '600'], variable: '--l-sans' });

export const metadata = { title: 'L · claude-design (Rams) — Lab' };

const ORANGE = '#EB5E1E';

function Dial({ value, size = 64, live = false }: { value: number; size?: number; live?: boolean }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const arc = c * 0.75; // 270 degree scale, like a radio dial
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`${value} of 100`} className="shrink-0">
      <g transform={`rotate(135 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#D6D3CC" strokeWidth="3" strokeDasharray={`${arc} ${c}`} strokeLinecap="round" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={live ? ORANGE : '#2A2A28'} strokeWidth="3"
          strokeDasharray={`${(arc * value) / 100} ${c}`} strokeLinecap="round"
        />
      </g>
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontSize={size * 0.28} fontWeight="600" fill="#2A2A28">{value}</text>
    </svg>
  );
}

function Panel({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <section className={`rounded-[20px] bg-[#F4F3F0] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_1px_2px_rgba(42,42,40,0.08),0_10px_30px_-18px_rgba(42,42,40,0.35)] ${className}`}>{children}</section>;
}

function Spec({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-[#DCD9D2] border-y border-[#DCD9D2] text-[13px]">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[1fr_auto] gap-4 py-2">
          <dt className="text-[#77746D]">{k}</dt><dd className="text-right">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function VariantL() {
  return (
    <div className={`${hanken.variable} min-h-dvh bg-[#E7E5E0] pb-32 font-[family-name:var(--l-sans)] text-[16px] text-[#2A2A28]`}>
      <header className="mx-auto flex max-w-[1160px] items-center justify-between px-5 py-6 text-[13px]">
        <span className="font-semibold">B2B Match</span>
        <span className="text-[#77746D]">{COMPANY.name}</span>
      </header>

      <main className="mx-auto grid max-w-[1160px] gap-5 px-5 md:grid-cols-12">
        {/* Hero panel with speaker grille */}
        <Panel className="relative overflow-hidden p-7 md:col-span-8 md:p-9">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 top-0 hidden h-full w-[45%] opacity-70 md:block"
            style={{ backgroundImage: 'radial-gradient(circle, #CFCBC3 1.6px, transparent 2px)', backgroundSize: '14px 14px', maskImage: 'linear-gradient(to left, black 40%, transparent)' }}
          />
          <div className="relative">
            <p className="text-[13px] text-[#77746D]">Next meeting</p>
            <h1 className="mt-2 max-w-[18ch] text-[28px] font-semibold leading-tight">
              {MEETING.with}, {MEETING.when}
            </h1>
            <p className="mt-1 text-[#77746D]">{MEETING.person}. {MEETING.where}.</p>
            <div className="mt-7 max-w-[380px]">
              <Spec rows={[
                ['Contract format', FORMAT_LABEL[ENVELOPE.agreed_format!]],
                ['Budget', 'Compatible'],
                ['Earliest start', '25 September'],
                ['Open questions', ENVELOPE.open_questions.length],
              ]} />
            </div>
            <div className="mt-7 flex items-center gap-4">
              <button className="h-11 rounded-full px-6 text-[13px] font-semibold text-white transition-transform duration-150 active:scale-[0.97]" style={{ background: ORANGE }}>
                Read the brief
              </button>
              <button className="h-11 rounded-full bg-[#2A2A28]/[0.06] px-6 text-[13px] font-semibold transition-colors hover:bg-[#2A2A28]/10">Add to calendar</button>
            </div>
          </div>
        </Panel>

        <Panel className="flex flex-col items-center justify-center p-7 text-center md:col-span-4">
          <Dial value={ENVELOPE.confidence} size={148} />
          <p className="mt-3 text-[13px] text-[#77746D]">Agent confidence after eight turns</p>
        </Panel>

        {/* Matches as a row of instruments */}
        <Panel className="p-7 md:col-span-12">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[16px] font-semibold">Matches</h2>
            <span className="text-[13px] text-[#77746D]">Fit, out of 100</span>
          </div>
          <div className="mt-5 grid gap-px overflow-hidden rounded-[14px] bg-[#DCD9D2] sm:grid-cols-2 lg:grid-cols-4">
            {MATCHES.map((m) => (
              <article key={m.id} className="flex flex-col gap-4 bg-[#F4F3F0] p-5">
                <div className="flex items-center gap-4">
                  <Dial value={m.score} live={m.stage === 'negotiating'} />
                  <div>
                    <p className="font-semibold">{m.seller}</p>
                    <p className="text-[13px]" style={m.stage === 'negotiating' ? { color: ORANGE } : { color: '#77746D' }}>{STAGE_LABEL[m.stage]}</p>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed text-[#55524C]">{m.reasoning}</p>
                <div className="mt-auto">
                  <Spec rows={[
                    ['Budget', m.compatibility.budget === 'ok' ? 'Compatible' : 'Gap'],
                    ['Format', FORMAT_LABEL[m.compatibility.contract_formats[0]]],
                  ]} />
                </div>
              </article>
            ))}
          </div>
        </Panel>

        {/* Live channel */}
        <Panel className="p-7 md:col-span-7">
          <div className="flex items-center gap-2">
            <span className="lab-pulse h-2 w-2 rounded-full" style={{ background: ORANGE }} aria-hidden />
            <h2 className="text-[16px] font-semibold">Agents with {LIVE_NEGOTIATION.with}</h2>
            <span className="ml-auto text-[13px] text-[#77746D]">Turn {LIVE_NEGOTIATION.turn} / {LIVE_NEGOTIATION.of}</span>
          </div>
          <div className="mt-2 flex gap-1" aria-hidden>
            {Array.from({ length: LIVE_NEGOTIATION.of }).map((_, i) => (
              <span key={i} className="h-1 flex-1 rounded-full" style={{ background: i < LIVE_NEGOTIATION.turn ? '#2A2A28' : '#D6D3CC' }} />
            ))}
          </div>
          <div className="mt-5 space-y-4">
            {LIVE_NEGOTIATION.lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[88px_1fr] gap-4">
                <span className="text-[13px] text-[#77746D]">{l.speaker === 'buyer_agent' ? 'Yours' : 'Theirs'}</span>
                <p className="leading-relaxed">{l.text}</p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-5 md:col-span-5">
          <Panel className="p-7">
            <h2 className="text-[16px] font-semibold">Your problems</h2>
            <div className="mt-4">
              <Spec rows={PROBLEMS.map((p) => [p.title, `${p.matches} matches`] as [string, string])} />
            </div>
            <p className="mt-3 text-[13px] text-[#77746D]">Private. Only a plain summary reaches sellers.</p>
          </Panel>
          <Panel className="p-7">
            <h2 className="text-[16px] font-semibold">Buyers asking for you</h2>
            <div className="mt-4">
              <Spec rows={INCOMING.map((m) => [`${m.buyer_industry}, ${m.buyer_size_hint}`, m.budget_compatible ? 'Fits' : 'Below floor'] as [string, string])} />
            </div>
          </Panel>
        </div>

        <Panel className="p-7 md:col-span-12">
          <h2 className="text-[16px] font-semibold">Log</h2>
          <div className="mt-4 grid gap-x-10 sm:grid-cols-2">
            <Spec rows={ACTIVITY.slice(0, 3).map((a) => [a.text, a.when] as [string, string])} />
            <Spec rows={ACTIVITY.slice(3).map((a) => [a.text, a.when] as [string, string])} />
          </div>
        </Panel>
      </main>
    </div>
  );
}
