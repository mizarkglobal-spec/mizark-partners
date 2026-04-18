"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  adminEmail: string;
  isPrimary: boolean;
}

export default function AdminHeader({ adminEmail, isPrimary }: Props) {
  const router   = useRouter();
  const supabase = createClient();

  const initials = adminEmail.split("@")[0].slice(0, 2).toUpperCase();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="hidden lg:flex items-center justify-end gap-3 px-8 py-3 bg-[#0f2a1e] border-b border-white/[0.08] flex-shrink-0">

      {/* Identity card */}
      <div className="flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2">
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(145deg,#1a3a2a,#2d6a4f)" }}
        >
          <span className="text-[#74c69d] text-[11px] font-bold tracking-tight">{initials}</span>
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="text-white/80 text-xs font-medium truncate max-w-[180px]">{adminEmail}</div>
          <div className="text-white/30 text-[10px] mt-0.5">{isPrimary ? "Primary Admin" : "Admin"}</div>
        </div>

        {/* Badge */}
        <span className="bg-[#d4a843]/15 text-[#d4a843] text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#d4a843]/20 whitespace-nowrap ml-0.5">
          Admin
        </span>
      </div>

      {/* Sign out */}
      <button
        onClick={handleLogout}
        title="Sign out"
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all"
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="hidden sm:inline">Sign Out</span>
      </button>
    </header>
  );
}
