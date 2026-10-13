import { BRAND } from "../lib/brand";

/** The store name drawn as a lit neon tube. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`neon-text whitespace-nowrap font-neon leading-none [word-spacing:0.3em] ${className}`}>{BRAND.name}</span>
  );
}
