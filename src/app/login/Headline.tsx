const BROKEN = "what’s broken.";

/** One span per letter, so the "rw" loop in globals.css can type them in one at a time. */
function Typed({ text, className }: { text: string; className: string }) {
  return (
    <span className={className} aria-hidden>
      {[...text].map((ch, i) => (
        <span key={i} className="rw-char" style={{ ["--c" as string]: i }}>
          {ch}
        </span>
      ))}
    </span>
  );
}

/** A plain block eraser; its shape and motion are in globals.css. */
function Eraser() {
  return (
    <span className="rw-eraser" aria-hidden>
      <span className="rw-hand">
        <span>
          <span />
        </span>
      </span>
    </span>
  );
}

/**
 * The promise, with "what's broken." typed, struck through and rewritten. Shared by the login
 * screen and the landing page; the parent must carry `script.variable` for the italic.
 */
export function Headline({ as: Tag = "h2" }: { as?: "h1" | "h2" }) {
  return (
    <Tag className="text-[clamp(2.4rem,5vw,4.2rem)] font-extrabold leading-[1.02] tracking-[-0.045em]">
      Say{" "}
      <span className="rw">
        <span className="sr-only">what&rsquo;s broken.</span>
        <Typed className="rw-layer" text={BROKEN} />
        <Typed className="rw-layer rw-italic" text={BROKEN} />
        <Eraser />
      </span>{" "}
      Only the right company hears about it.
    </Tag>
  );
}
