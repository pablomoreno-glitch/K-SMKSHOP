import { NICOTINE_WARNING } from "../lib/brand";

/** The health warning printed on every box, shown wherever a product is sold. */
export function NicotineWarning({ className = "" }: { className?: string }) {
  return (
    <p
      role="note"
      className={`rounded-control border-2 border-ink/80 px-4 py-3 text-body font-semibold text-ink ${className}`}
    >
      ADVERTENCIA: {NICOTINE_WARNING}
    </p>
  );
}
