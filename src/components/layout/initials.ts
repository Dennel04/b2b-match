/**
 * First letters of the first two words: "Kaubamaja Logistics" → "KL".
 *
 * Its own file, with no "use client" above it: AppShell is a client component now, and a server
 * component reading a company name still has to call this.
 */
export function initialsOf(name: string | null | undefined) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return (words.slice(0, 2).map((w) => w[0]).join("") || "·").toUpperCase();
}
