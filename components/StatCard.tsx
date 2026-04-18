interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  change?: { value: string; positive: boolean };
  gold?: boolean;
}

export default function StatCard({ label, value, sub, change, gold }: StatCardProps) {
  return (
    <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-5">
      <div className="text-white/50 text-xs uppercase tracking-wide mb-2">{label}</div>
      <div className={`text-2xl font-bold mb-1 ${gold ? "text-[#d4a843]" : "text-white"}`}>
        {value}
      </div>
      {sub && <div className="text-white/40 text-xs">{sub}</div>}
      {change && (
        <div className={`text-xs font-medium mt-1 ${change.positive ? "text-[#74c69d]" : "text-red-400"}`}>
          {change.positive ? "▲" : "▼"} {change.value}
        </div>
      )}
    </div>
  );
}
