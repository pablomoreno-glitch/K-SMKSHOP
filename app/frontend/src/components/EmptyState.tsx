import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line px-6 py-12 text-center">
      <p className="text-body-lg font-semibold text-ink">{title}</p>
      {description && <p className="max-w-md text-body text-muted">{description}</p>}
      {children}
    </div>
  );
}
