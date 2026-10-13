import { BRAND } from "../lib/brand";

/** The store name drawn as a lit neon tube. */
export function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`neon-text font-neon leading-none ${className}`}>{BRAND.name}</span>;
}
