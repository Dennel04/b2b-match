import { debugScrape } from "@/actions/company";

export const metadata = { title: "Scrape debugger — Crossdesk" };
// A site read plus one model call: allow well over the usual 30 s.
export const maxDuration = 120;

/**
 * Development only. `/dev/scrape?url=bolt.eu` runs the same autofill the product runs and shows
 * every step: which pages were tried, what text survived, the exact prompt, and the model's answer.
 * Each URL is its own link, so a result can be shared. Takes up to half a minute to load.
 */
export default async function ScrapeDebugPage({ searchParams }: PageProps<"/dev/scrape">) {
  const { url } = await searchParams;
  const site = typeof url === "string" ? url.trim() : "";

  let result: Awaited<ReturnType<typeof debugScrape>> | null = null;
  let failure: string | null = null;
  if (site) {
    try {
      result = await debugScrape(site);
    } catch (e) {
      failure = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-col gap-6 px-4 py-8 text-[14px] md:px-8">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-ink-faint">Development</p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.02em]">Scrape debugger</h1>
        <p className="mt-1 text-ink-soft">What autofill reads on a website, and what the model makes of it.</p>
      </div>

      <form className="flex gap-2">
        <input
          name="url"
          defaultValue={site}
          placeholder="bolt.eu"
          aria-label="Website"
          className="h-10 flex-1 rounded-[8px] border border-line-strong bg-surface px-3 outline-none focus:border-accent"
        />
        <button className="cursor-pointer rounded-[8px] bg-ink px-4 font-semibold text-surface hover:bg-ink-soft">Run</button>
      </form>

      {failure && <p className="rounded-[8px] bg-gold-soft px-4 py-3">{failure}</p>}

      {result && (
        <>
          <p className="text-ink-soft">
            {result.site} · {result.trace.pages.length} pages · {result.trace.pages.reduce((n, p) => n + p.text.length, 0)} characters · scrape{" "}
            {(result.trace.ms / 1000).toFixed(1)} s · model {(result.modelMs / 1000).toFixed(1)} s
          </p>

          <Block title="1. Pages tried">
            <table className="w-full text-left text-[13px]">
              <tbody>
                {result.trace.steps.map((s, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className={`py-1.5 pr-4 align-top font-medium ${s.outcome === "used" ? "text-accent" : "text-ink-soft"}`}>{s.outcome}</td>
                    <td className="break-all py-1.5 pr-4 align-top">{s.url}</td>
                    <td className="py-1.5 text-right align-top tabular-nums text-ink-faint">{s.chars ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Block>

          <Block title="2. Model answer">
            {result.error ? <p className="text-seal">{result.error}</p> : <Pre>{JSON.stringify(result.draft, null, 2)}</Pre>}
          </Block>

          <Block title="3. Text sent to the model, per page">
            {result.trace.pages.map((p) => (
              <details key={p.url} className="border-b border-line py-2 last:border-0">
                <summary className="cursor-pointer break-all font-medium">
                  {p.url} <span className="text-ink-faint">({p.text.length})</span>
                </summary>
                <Pre>{p.text}</Pre>
              </details>
            ))}
          </Block>

          {result.prompt && (
            <Block title="4. Full prompt">
              <details>
                <summary className="cursor-pointer font-medium">Show {result.prompt.length} characters</summary>
                <Pre>{result.prompt}</Pre>
              </details>
            </Block>
          )}
        </>
      )}
    </main>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      <div className="rounded-[10px] border border-line bg-surface p-4">{children}</div>
    </section>
  );
}

function Pre({ children }: { children: React.ReactNode }) {
  return <pre className="mt-2 max-h-[480px] overflow-auto whitespace-pre-wrap break-words rounded-[8px] bg-surface-alt p-3 text-[12.5px] leading-relaxed">{children}</pre>;
}
