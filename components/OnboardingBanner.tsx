"use client";
import Link from "next/link";

export default function OnboardingBanner() {
  return (
    <div
      className="mx-4 mt-4 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
      style={{ background: "linear-gradient(135deg, #0f2a1e 0%, #1a3d2b 100%)", border: "1px solid rgba(212,168,67,0.3)" }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
            style={{ background: "#d4a843", color: "#0f2a1e" }}
          >
            !
          </span>
          Activate your earnings
        </p>
        <p className="text-xs text-white/60 mt-0.5">
          Complete your partner profile — address, ID, and bank details — to start receiving dividend distributions.
        </p>
      </div>
      <Link
        href="/onboarding"
        className="flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-xl transition-opacity hover:opacity-90 text-center"
        style={{ background: "#d4a843", color: "#0f2a1e" }}
      >
        Complete Profile →
      </Link>
    </div>
  );
}
