const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) {
    return "Precio a consultar";
  }
  return currencyFormatter.format(price);
}

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return dateFormatter.format(date);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return dateTimeFormatter.format(date);
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CO").format(value);
}

/** 40000 -> "40K", 12500 -> "12,5K"; the way the flyers and buyers say it. */
export function formatPuffs(puffs: number | null | undefined): string {
  if (!puffs) return "—";
  if (puffs < 1000) return String(puffs);
  const k = puffs / 1000;
  return `${Number.isInteger(k) ? k : k.toFixed(1).replace(".", ",")}K`;
}

export function formatNicotine(percent: number | null | undefined): string {
  if (percent === null || percent === undefined) return "—";
  return percent === 0 ? "Sin nicotina" : `${String(percent).replace(".", ",")}%`;
}
