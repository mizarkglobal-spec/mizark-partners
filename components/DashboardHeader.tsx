"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fmt } from "@/lib/format";

interface Props {
  partnerName: string;
  equityPct: number;
  email: string;
  investmentAmount: number;
  startDate: string;
}

export default function DashboardHeader({ partnerName, equityPct, email, investmentAmount, startDate }: Props) {
  const router  = useRouter();
  const supabase = createClient();

  const firstName = partnerName.split(" ")[0];
  const initials  = partnerName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const memberSince = new Date(startDate).toLocaleDateString("en-NG", {
    month: "short", year: "numeric",
  });

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 flex-shrink-0">

      {/* Left: greeting */}
      <div>
        <p className="text-gray-400 text-[12px] uppercase tracking-wide">{today}</p>
        <h1 className="text-[18px] font-bold text-[#111827] mt-0.5" style={{ letterSpacing: "-0.02em" }}>
          Assalamu Alaikum, {firstName} 👋
        </h1>
      </div>

      {/* Right: identity card + sign out */}
      <div className="flex items-center gap-3">

        {/* Identity card */}
        <div className="flex items-center gap-3 bg-[#f7f8f7] border border-gray-200 rounded-2xl px-4 py-2.5">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(145deg,#0c2016,#1a3a2a)" }}
          >
            <span className="text-[#74c69d] text-xs font-bold tracking-tight">{initials}</span>
          </div>

          {/* Details */}
          <div className="min-w-0">
            <div className="text-[#111827] font-semibold text-sm leading-none truncate max-w-[160px]">
              {partnerName}
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[#d4a843] text-[11px] font-semibold">{equityPct.toFixed(3)}% equity</span>
              <span className="text-gray-300 text-[10px]">·</span>
              <span className="text-gray-400 text-[11px]">{fmt.naira(investmentAmount)}</span>
              <span className="text-gray-300 text-[10px]">·</span>
              <span className="text-gray-400 text-[11px]">Since {memberSince}</span>
            </div>
          </div>

          {/* Partner badge */}
          <span className="hidden xl:inline-flex items-center bg-[#f0fdf4] text-[#15803d] text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border border-[#bbf7d0] whitespace-nowrap ml-1">
            Active Partner
          </span>
        </div>

        {/* Sign out button */}
        <button
          onClick={handleLogout}
          title="Sign out"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm text-gray-400 hover:text-[#111827] hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
