"use client";

import { useState } from "react";
import { initialsOf } from "@/components/layout";

/**
 * A logo hot-linked from a company's own site. Sites move files and block hot-linking, so a
 * failed load falls back to the company's initials instead of a broken-image icon.
 */
export function RemoteLogo({ url, name, className = "" }: { url?: string | null; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) return <span className="text-[13px] font-semibold text-ink-soft">{initialsOf(name)}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a remote logo from the company's own site
    <img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={`h-full w-full object-contain ${className}`} />
  );
}
