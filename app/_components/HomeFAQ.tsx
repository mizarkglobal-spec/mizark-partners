"use client";
import { useState } from "react";
import type { HomepageFaq } from "@/lib/homepage";

export default function HomeFAQ({ faqs }: { faqs: HomepageFaq[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="rounded-[20px] border border-gray-100 overflow-hidden divide-y divide-gray-100">
      {faqs.map((f, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full text-left px-7 py-5 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-[14px] text-gray-900">{f.q}</span>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-all ${
                open === i ? "bg-[#0f2a1e] text-white rotate-45" : "bg-gray-100 text-gray-500"
              }`}
            >
              +
            </span>
          </button>
          {open === i && (
            <div className="px-7 pb-5 bg-gray-50">
              <p className="text-gray-600 text-[13px] leading-[1.7]">{f.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
