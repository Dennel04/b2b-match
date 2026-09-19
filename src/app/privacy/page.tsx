import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata = { title: "Privacy policy — Crossdesk" };

const UPDATED = "19 September 2026";

/**
 * What Crossdesk keeps, why, and who else touches it — written from the code, not from a template.
 * Every claim here has a place in the repository behind it (RLS in supabase/migrations, the
 * separate seller call in src/prompts/negotiate.ts, findLeaks() in src/lib/leak.ts, the log lines
 * in src/lib/claude.ts). Change one of those and this page is the second thing to change.
 */
const SECTIONS: LegalSection[] = [
  {
    id: "short",
    title: "The short version",
    body: (
      <ul>
        <li>We keep what you give us to find you a match, and nothing to sell.</li>
        <li>Your problem is never shown to another company. The platform and its AI model read it; that is how matching works.</li>
        <li>Figures are compared inside the platform. The other side learns that they fit, never what they are.</li>
        <li>One kind of cookie: the one that keeps you signed in. No ads, no trackers.</li>
        <li>We do not use what you write to train AI models.</li>
      </ul>
    ),
  },
  {
    id: "collect",
    title: "What we keep",
    body: (
      <>
        <p>
          <strong>Your account.</strong> Your work email and a password, which Supabase stores
          hashed; we never see it. If you sign in with Google, we receive your email and name from
          Google instead.
        </p>
        <p>
          <strong>Your company.</strong> Name, website, what it does, industry, size, city,
          languages and logo — mostly read off your website and confirmed by you. The name and role
          of the person who takes meetings, shared only once both sides agree to meet.
        </p>
        <p>
          <strong>Your problems.</strong> The text, the interview you had with the assistant, the
          part of the business it sits in, and its terms: budget ceiling, contract formats, start
          date and hard requirements.
        </p>
        <p>
          <strong>Your services.</strong> What you sell and who it is for, and its terms: price
          floor, contract formats and when you are free.
        </p>
        <p>
          <strong>Matches.</strong> For each pair: a score, an explanation written for the other side,
          the transcript of the two agents, what they settled, the status of the double opt-in, and
          when each side last opened it.
        </p>
        <p>
          <strong>The directory.</strong> Public facts about companies read from their own websites
          — name, domain, description, logo. It holds no information about people.
        </p>
      </>
    ),
  },
  {
    id: "wall",
    title: "How a problem stays private",
    body: (
      <>
        <p>
          &ldquo;Private&rdquo; is enforced in the code and the database, not only promised in a
          prompt:
        </p>
        <ul>
          <li>The database lets only your company read or change its problems. Another company&rsquo;s account cannot fetch them at all.</li>
          <li>The other side&rsquo;s agent is a separate AI call that is never handed your problem, not even a summary. It knows only what your agent says out loud.</li>
          <li>Every transcript is checked for your wording before it is stored. One that fails is thrown away, never shown.</li>
          <li>Budgets and price floors are compared in one place in the code. Neither figure enters the other side&rsquo;s prompt or screen.</li>
          <li>A counterparty stays anonymous — industry, size, city — until you both agree to meet.</li>
        </ul>
        <p>
          The platform itself can read your problem, and so can the AI model it sends it to. We say
          &ldquo;withheld&rdquo; rather than &ldquo;encrypted&rdquo; for exactly that reason.
        </p>
      </>
    ),
  },
  {
    id: "why",
    title: "Why we use it",
    body: (
      <ul>
        <li><strong>To run the service you signed up for</strong> — interviews, matching, negotiation, briefs. This is the contract between us (GDPR Art. 6(1)(b)).</li>
        <li><strong>To keep the directory</strong> of public company information, and to keep the service secure and working. This is our legitimate interest (Art. 6(1)(f)); you can object to it.</li>
        <li>We do not use your data for advertising, we do not sell it, and we do not profile people.</li>
      </ul>
    ),
  },
  {
    id: "processors",
    title: "Who else handles it",
    body: (
      <>
        <p>These providers process data on our behalf, only to run Crossdesk:</p>
        <ul>
          <li><strong>Supabase</strong> — the database and sign-in.</li>
          <li><strong>Vercel</strong> — hosting, server logs and page-view counts.</li>
          <li><strong>The AI model provider</strong> — currently DeepSeek, reached through an Anthropic-compatible interface. It receives problems, services, interviews and transcripts to run the assistant and the agents, and processes them outside the European Economic Area.</li>
          <li><strong>Tavily</strong> — reads a public website when our own reader cannot open it.</li>
          <li><strong>Google</strong> — only if you sign in with Google.</li>
          <li><strong>Stripe</strong> — only if your company pays the fee for an accepted meeting. Card details go to Stripe and never reach us.</li>
        </ul>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and analytics",
    body: (
      <>
        <p>
          Crossdesk sets one kind of cookie: the Supabase session that keeps you signed in. It is
          needed for the service to work, so there is nothing to consent to and no banner.
        </p>
        <p>
          Page views are counted with Vercel Analytics, which sets no cookies and stores no personal
          data. There are no advertising or third-party tracking scripts.
        </p>
      </>
    ),
  },
  {
    id: "logs",
    title: "Server logs",
    body: (
      <p>
        To see what is slow or broken, the server writes short lines to its log: which AI step ran,
        how long it took and how many tokens it used; which pages of a website were read and the
        profile drafted from them; how many turns an interview had. They hold no problem text, with
        one exception: when the privacy check stops a transcript, the log names the few words that
        would have leaked, so the cause can be fixed. Vercel keeps logs for a limited time and then
        deletes them.
      </p>
    ),
  },
  {
    id: "websites",
    title: "Reading company websites",
    body: (
      <p>
        When you sign up, Crossdesk reads your company&rsquo;s public website to pre-fill your
        profile; nothing is saved until you confirm it. The same reader builds the directory. It
        obeys each site&rsquo;s <code>robots.txt</code> and reads a handful of pages, not the whole
        site. If your company is in the directory and you want it corrected or removed, ask us.
      </p>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <ul>
        <li>Your account, company, problems, services and matches: for as long as the account exists.</li>
        <li>A transcript that fails the privacy check: not at all — it is discarded before it is stored.</li>
        <li>Server logs: for the hosting provider&rsquo;s short retention period.</li>
        <li>When you ask us to delete your account, your company and everything under it goes too.</li>
      </ul>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>Under the GDPR you can ask us to:</p>
        <ul>
          <li>show you what we hold about you, and give you a copy you can take elsewhere;</li>
          <li>correct it, or delete it;</li>
          <li>stop using it for our legitimate interest, or limit how we use it.</li>
        </ul>
        <p>
          If you think we got it wrong, you can complain to the Estonian Data Protection
          Inspectorate (Andmekaitse Inspektsioon, aki.ee).
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    body: (
      <p>
        When this policy changes in a way that matters, we tell you before the change applies. The
        date at the top says when it last changed.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      doc="/privacy"
      title="What we keep, and who reads it."
      lead="Crossdesk holds problems companies would not post anywhere else. This page says exactly what we keep, why, and who else touches it."
      updated={UPDATED}
      sections={SECTIONS}
    />
  );
}
