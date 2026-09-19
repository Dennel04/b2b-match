type Variant = "solid" | "ghost" | "quiet";

const VARIANTS: Record<Variant, string> = {
  /** The one action a screen wants you to take. */
  solid: "bg-brand text-surface hover:bg-brand-strong",
  /** An alternative action, equal in weight, lower in emphasis. */
  ghost: "border border-line-strong bg-surface text-ink hover:bg-surface-alt",
  /** Page-level controls in a bar, not decisions about content. */
  quiet: "border border-line-strong bg-surface text-ink text-[12px] hover:bg-surface-alt",
};

export function Button({
  variant = "solid",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const pad = variant === "quiet" ? "px-2.5 py-1.5 gap-1.5" : "px-4 py-2 gap-2";
  return (
    <button
      {...rest}
      className={`inline-flex cursor-pointer items-center justify-center rounded-[8px] text-[13px] font-semibold transition-colors disabled:cursor-default disabled:opacity-50 ${pad} ${VARIANTS[variant]} ${className}`}
    />
  );
}
