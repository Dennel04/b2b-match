import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata = { title: "Terms of service — Crossdesk" };

const UPDATED = "19 September 2026";

/**
 * The rules both sides sign up to. Written in the product's own words (problem, service, match,
 * withheld, brief) and honest about what the platform can read: "withheld" means the other
 * company cannot see it, never that nobody can. A draft for a prototype, not legal advice —
 * a lawyer reads it before a real company relies on it.
 */
const SECTIONS: LegalSection[] = [
  {
    id: "service",
    title: "What Crossdesk is",
    body: (
      <>
        <p>
          Crossdesk matches companies that have a problem with companies that can solve it. A buyer
          describes a problem in private. A seller lists the services it sells. The platform checks
          the terms, two AI agents negotiate on behalf of each side, and the people meet only after
          both companies agree.
        </p>
        <p>
          Crossdesk is a prototype, built at a hackathon in Tallinn. It runs without a service level,
          may change or stop without notice, and should not yet be the only place you keep anything
          you depend on.
        </p>
      </>
    ),
  },
  {
    id: "who",
    title: "Who may use it",
    body: (
      <ul>
        <li>Crossdesk is for businesses. You use it on behalf of a company, not as a consumer.</li>
        <li>You confirm that you are allowed to act for the company you register, and that what you say about it is true.</li>
        <li>One account belongs to one person. Keep your password to yourself and tell us if someone else got into your account.</li>
      </ul>
    ),
  },
  {
    id: "private",
    title: "What you write and who reads it",
    body: (
      <>
        <p>
          <strong>A problem is private in full.</strong> Another company never sees its text, your
          budget ceiling or your dates. The platform reads them, and so does the AI model that runs
          the interview, the matching and your agent. That is how a match can be found at all.
        </p>
        <p>
          <strong>A service is a storefront.</strong> Its title and description are read by every
          signed-in company, because that is what a buyer&rsquo;s problem is matched against. Its
          terms — your price floor, formats and dates — are withheld: a buyer is told that they fit,
          never what they are.
        </p>
        <p>
          <strong>Figures are never passed across.</strong> Budgets and price floors are compared by
          the platform. Each side learns whether the terms are compatible, not the other side&rsquo;s
          numbers.
        </p>
        <p>
          <strong>Your company profile is public to signed-in users.</strong> It carries what your
          company does, where and at what size. Before a meeting is confirmed, a counterparty sees it
          without your name.
        </p>
      </>
    ),
  },
  {
    id: "agents",
    title: "AI agents act for you, not instead of you",
    body: (
      <>
        <p>
          Every problem and service is represented by an AI agent. Your agent negotiates within the
          terms you set and is told to keep your specifics withheld. The other side&rsquo;s agent never
          receives your problem, only what your agent says out loud, and every transcript is checked
          for leaked wording before it is stored.
        </p>
        <ul>
          <li>An agent cannot sign anything. &ldquo;Terms fit&rdquo; and a brief are a recommendation to meet, not an offer and not a contract.</li>
          <li>AI output can be wrong. Check a score, an explanation or a brief before you act on it.</li>
          <li>A deal exists only once the people at both companies agree it in writing, outside Crossdesk.</li>
        </ul>
      </>
    ),
  },
  {
    id: "matches",
    title: "Matches and meetings",
    body: (
      <ul>
        <li>A match stays anonymous until both sides agree: the buyer says Interested, then the seller accepts. Names are shared only then.</li>
        <li>Either side may decline at any point, without giving a reason. A declined company is never named to the other side.</li>
        <li>We do not promise that a problem will find a match, or that a match will lead to a deal.</li>
        <li>Crossdesk takes no part in the contract, the payment or the work that follows a meeting.</li>
      </ul>
    ),
  },
  {
    id: "confidential",
    title: "What you learn about the other side",
    body: (
      <p>
        Once a meeting is confirmed, you receive a brief about the other company. Use it only to
        decide on and prepare for that deal. Do not publish it, sell it or pass it on, and treat
        anything the other company tells you as confidential unless they say otherwise.
      </p>
    ),
  },
  {
    id: "websites",
    title: "Information read from websites",
    body: (
      <>
        <p>
          To save you typing, Crossdesk reads your company&rsquo;s public website and pre-fills your
          profile. Nothing is saved until you confirm it. The directory of companies is built the
          same way, from public websites, and the reader obeys each site&rsquo;s <code>robots.txt</code>.
        </p>
        <p>
          If your company is listed in the directory and you want it corrected or removed, tell us and
          we will do it.
        </p>
      </>
    ),
  },
  {
    id: "use",
    title: "What you may not do",
    body: (
      <ul>
        <li>Register a company you do not act for, or describe a problem or a service that does not exist.</li>
        <li>Try to get another company&rsquo;s problem, figures or identity out of the platform or its agents, including by writing instructions meant for an agent.</li>
        <li>Copy the directory, profiles or services in bulk, by script or by hand.</li>
        <li>Contact a company you met through Crossdesk for anything other than the deal you met about.</li>
        <li>Break the law, or anyone else&rsquo;s rights, through what you write.</li>
      </ul>
    ),
  },
  {
    id: "data",
    title: "Personal data",
    body: (
      <>
        <p>
          Most of what Crossdesk holds is about companies. Some of it is about people: your name and
          work email, the people you list as meeting contacts, and whatever a problem or service
          mentions. We process it under the EU General Data Protection Regulation to run the service
          you signed up for, and for nothing else.
        </p>
        <p>We rely on these providers, who process data on our behalf:</p>
        <ul>
          <li><strong>Supabase</strong> — database and sign-in.</li>
          <li><strong>Vercel</strong> — hosting and anonymous page-view analytics.</li>
          <li><strong>The AI model provider</strong> — reads problems, services and transcripts to run interviews, matching and agents. It may process data outside the European Economic Area.</li>
          <li><strong>Tavily</strong> — reads a public website when our own reader cannot.</li>
          <li><strong>Google</strong> — only if you choose to sign in with Google.</li>
        </ul>
        <p>
          You may ask to see, correct, export or delete your data, or object to how we use it.
          Ask us to delete your account and your company goes with it: its problems, services and matches. You may
          also complain to the Estonian Data Protection Inspectorate (Andmekaitse Inspektsioon).
        </p>
      </>
    ),
  },
  {
    id: "yours",
    title: "What stays yours",
    body: (
      <p>
        What you write stays yours. You give us the right to store it and to use it to run Crossdesk
        for you — matching, negotiating and writing briefs. We do not sell it, and we do not use your
        problems to train models.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Liability",
    body: (
      <p>
        Crossdesk is provided as it is. To the extent the law allows, we are not liable for lost
        business, lost profit, or a decision you took on the strength of a match or a brief. Nothing
        here limits liability for harm caused on purpose or through gross negligence.
      </p>
    ),
  },
  {
    id: "ending",
    title: "Ending and changes",
    body: (
      <ul>
        <li>You may ask us to delete your account at any time.</li>
        <li>We may suspend an account that breaks these terms, and will say why.</li>
        <li>If these terms change in a way that matters, we tell you before the change applies.</li>
        <li>These terms are governed by the law of Estonia. Disputes go to Harju County Court, unless the law says otherwise.</li>
      </ul>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      doc="/terms"
      title="The rules both sides agree to."
      lead="In short: your problem stays with you and the platform, figures are compared and never shown, agents recommend and people decide."
      updated={UPDATED}
      sections={SECTIONS}
    />
  );
}
