export const fmt = {
  naira: (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n),
  percent: (n: number, decimals = 3) => `${n.toFixed(decimals)}%`,
  date: (d: string | Date) => new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }),
  shortDate: (d: string | Date) => new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }),
  month: (d: string) => { const [y, m] = d.split("-"); return new Date(+y, +m - 1).toLocaleDateString("en-NG", { month: "long", year: "numeric" }); },
  quarter: (period: string) => {
    const [y, q] = period.split("-Q");
    return `Q${q} ${y}`;
  },
};

export function generateToken(): string {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
}

export function totalPool() { return 20_000_000; }
export function totalEquityOffered() { return 20; } // percent
export function equityForAmount(amount: number): number {
  return (amount / totalPool()) * totalEquityOffered();
}
