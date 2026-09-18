/* eslint-disable @next/next/no-img-element -- picsum placeholders, as the skill prescribes */
import { Outfit } from 'next/font/google';
import {
  COMPANY, ENVELOPE, FORMAT_LABEL, INCOMING, LIVE_NEGOTIATION, MATCHES, MEETING, PROBLEMS,
  STAGE_LABEL,
} from '../_data';

/**
 * Variant M, skill: gpt-taste (taste-skill).
 * <design_plan>
 *   rng (seed = prompt length 187): hero = "Cinematic Center", type = Outfit,
 *     components = inline typography images, stacking cards, gapless bento,
 *     motion = scrubbing text reveal + image scale-on-scroll
 *   AIDA: floating pill nav, Attention = hero, Interest = bento, Desire = stacking matches and
 *     scrubbed privacy line, Action = massive closing CTA
 *   hero math: H1 in max-w-6xl at clamp(2.6rem,5.4vw,5.6rem), 2 lines on desktop, no stats in hero
 *   bento: 4 cols, cells 2x2 + 2x1 + 1x1 + 1x1 + 4x1 = 12 slots, 3 full rows, grid-flow-dense, no voids
 *   labels: no "SECTION 01" meta-labels; all buttons light-on-dark or dark-on-light
 * </design_plan>
 * Deviation: GSAP is replaced by CSS scroll-driven animations and sticky stacking, because the
 * project rule is no new dependencies.
 */

const outfit = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--m-sans' });

export const metadata = { title: 'M · gpt-taste — Lab' };

const img = (seed: string, w = 1600, h = 1000) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const PRIVACY = 'Your problem stayed with you. Sellers saw a plain summary. Budgets met in private and only the word compatible crossed the wall.'.split(' ');

export default function VariantM() {
  return (
    <main className={`${outfit.variable} w-full max-w-full overflow-x-hidden bg-[#0B0B0C] pb-32 font-[family-name:var(--m-sans)] text-[#F2F1EE]`}>
      {/* Floating glass pill nav */}
      <nav className="fixed left-1/2 top-5 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] p-1.5 text-sm backdrop-blur-xl">
        <span className="px-4 font-semibold">B2B Match</span>
        <a href="#" className="rounded-full bg-white px-4 py-2 font-medium text-[#0B0B0C]">Overview</a>
        <a href="#" className="hidden rounded-full px-4 py-2 text-white/60 hover:text-white sm:block">Matches</a>
        <a href="#" className="hidden rounded-full px-4 py-2 text-white/60 hover:text-white sm:block">Meetings</a>
      </nav>

      {/* Attention: cinematic center */}
      <section className="relative flex min-h-[92dvh] flex-col items-center justify-center px-5 text-center">
        <img src={img('harbor-cranes-night', 1920, 1200)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50 grayscale contrast-125" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,11,12,0.35)_0%,#0B0B0C_75%)]" />
        <div className="relative">
          <h1 className="mx-auto max-w-6xl text-[clamp(2.6rem,5.4vw,5.6rem)] font-medium leading-[1.02] tracking-[-0.035em]">
            {COMPANY.person}, you meet{' '}
            <span className="mx-1 inline-block h-[0.8em] w-[1.9em] rounded-full bg-cover bg-center align-baseline grayscale" style={{ backgroundImage: `url(${img('office-desk-light', 400, 200)})` }} aria-hidden />{' '}
            {MEETING.with} on Tuesday
          </h1>
          <p className="mx-auto mt-6 max-w-[46ch] text-lg font-light text-white/65">
            Two agents agreed the terms without either company in the room.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a href="#" className="rounded-full bg-white px-7 py-3.5 font-medium text-[#0B0B0C] transition-transform duration-500 hover:scale-[1.03] active:scale-[0.98]">Read the brief</a>
            <a href="#" className="rounded-full border border-white/20 px-7 py-3.5 font-medium text-white transition-colors duration-500 hover:bg-white/10">New problem</a>
          </div>
        </div>
      </section>

      {/* Interest: gapless bento */}
      <section className="mx-auto max-w-[1240px] px-5 py-32 md:py-48">
        <div className="grid grid-flow-dense auto-rows-[220px] grid-cols-1 gap-4 md:grid-cols-4">
          <article className="group relative overflow-hidden rounded-[28px] md:col-span-2 md:row-span-2">
            <img src={img('warehouse-aisle-dusk', 1200, 1200)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 grayscale transition-transform duration-700 ease-out group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/40 to-transparent" />
            <div className="relative flex h-full flex-col justify-end p-8">
              <p className="text-white/60">{MEETING.when}</p>
              <p className="mt-1 text-4xl font-medium tracking-[-0.03em]">{MEETING.with}</p>
              <p className="mt-2 max-w-[40ch] font-light text-white/70">{FORMAT_LABEL[ENVELOPE.agreed_format!]}, budgets compatible, start from 25 September.</p>
            </div>
          </article>
          <article className="flex flex-col justify-between rounded-[28px] bg-[#F2F1EE] p-7 text-[#0B0B0C] md:col-span-2">
            <p className="text-sm text-black/55">Agent confidence</p>
            <p className="text-7xl font-semibold tracking-[-0.05em]">{ENVELOPE.confidence}<span className="text-2xl font-normal text-black/40"> / 100</span></p>
          </article>
          <article className="flex flex-col justify-between rounded-[28px] border border-white/10 bg-white/[0.04] p-7">
            <p className="text-sm text-white/55">Live with {LIVE_NEGOTIATION.with}</p>
            <div>
              <p className="text-5xl font-semibold tracking-[-0.04em]">{LIVE_NEGOTIATION.turn}<span className="text-white/35">/{LIVE_NEGOTIATION.of}</span></p>
              <p className="mt-1 text-sm text-white/55">turns so far</p>
            </div>
          </article>
          <article className="flex flex-col justify-between rounded-[28px] border border-white/10 bg-white/[0.04] p-7">
            <p className="text-sm text-white/55">Your problems</p>
            <ul className="space-y-1 text-[15px]">
              {PROBLEMS.map((p) => <li key={p.id}>{p.title}</li>)}
            </ul>
          </article>
          <article className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-7 md:col-span-4 md:flex-row md:items-center">
            <p className="text-sm text-white/55 md:w-48">Buyers asking for you</p>
            {INCOMING.map((m) => (
              <div key={m.id} className="flex-1">
                <p className="text-lg">{m.buyer_industry} <span className="text-white/40">{m.score}</span></p>
                <p className="text-sm font-light text-white/60">{m.buyer_size_hint}, {m.budget_compatible ? 'budget fits your floor' : 'below your floor'}</p>
              </div>
            ))}
          </article>
        </div>
      </section>

      {/* Desire: scrubbed privacy statement */}
      <section className="mx-auto max-w-5xl px-5 py-24">
        <p className="lab-scrub text-[clamp(1.8rem,3.6vw,3.3rem)] font-medium leading-[1.2] tracking-[-0.03em]">
          {PRIVACY.map((w, i) => <span key={i}>{w} </span>)}
        </p>
      </section>

      {/* Desire: stacking match cards */}
      <section className="mx-auto max-w-[1000px] px-5 py-24">
        <h2 className="mb-12 text-[clamp(2rem,4vw,3.6rem)] font-medium tracking-[-0.035em]">Companies that can help</h2>
        <div className="space-y-6">
          {MATCHES.map((m, i) => (
            <article
              key={m.id}
              className="sticky grid gap-6 overflow-hidden rounded-[32px] border border-white/10 bg-[#161618] p-8 shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.8)] md:grid-cols-[1fr_280px]"
              style={{ top: `${96 + i * 18}px` }}
            >
              <div>
                <p className="text-sm text-white/50">{STAGE_LABEL[m.stage]}</p>
                <p className="mt-2 text-3xl font-medium tracking-[-0.03em]">{m.seller}</p>
                <p className="mt-3 max-w-[48ch] font-light leading-relaxed text-white/70">{m.reasoning}</p>
                <p className="mt-6 text-6xl font-semibold tracking-[-0.05em]">{m.score}</p>
              </div>
              <div className="lab-scale-view hidden overflow-hidden rounded-[22px] md:block">
                <img src={img(`${m.seller.replace(/\W/g, '')}-work`, 600, 700)} alt="" className="h-full w-full object-cover opacity-80 grayscale" />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Action */}
      <section className="mx-auto max-w-[1240px] px-5 py-32 text-center md:py-48">
        <h2 className="mx-auto max-w-5xl text-[clamp(2.4rem,6vw,6rem)] font-medium leading-[1] tracking-[-0.04em]">Got another problem?</h2>
        <a href="#" className="mt-10 inline-block rounded-full bg-white px-10 py-5 text-lg font-medium text-[#0B0B0C] transition-transform duration-500 hover:scale-[1.03] active:scale-[0.98]">
          Describe it privately
        </a>
      </section>
    </main>
  );
}
