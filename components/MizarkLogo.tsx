interface Props {
  /** "dark" = white wordmark (use on dark backgrounds); "light" = dark wordmark */
  theme?: "dark" | "light";
  subtitle?: string;
  size?: "sm" | "md";
}

/** The geometric M mark, sized via the parent container */
function MarkSvg() {
  return (
    <svg viewBox="0 0 26 20" fill="none" aria-hidden="true" className="w-full h-full">
      <path
        d="M2 18V2L13 11L24 2V18"
        stroke="#d4a843"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MizarkLogo({ theme = "dark", subtitle, size = "md" }: Props) {
  const isSmall = size === "sm";
  const boxSize  = isSmall ? "w-7 h-7"   : "w-8 h-8";
  const svgWrap  = isSmall ? "w-[15px] h-[12px]" : "w-[18px] h-[14px]";
  const nameSize = isSmall ? "text-[13px]" : "text-[15px]";
  const nameColor = theme === "dark" ? "text-white" : "text-[#0f2a1e]";
  const subColor  = theme === "dark" ? "text-[#74c69d]" : "text-[#40916c]";

  return (
    <div className="flex items-center gap-2.5">
      {/* Icon badge */}
      <div
        className={`${boxSize} rounded-[8px] flex items-center justify-center flex-shrink-0`}
        style={{
          background: "linear-gradient(145deg, #0c2016, #132d20)",
          border: "1.5px solid rgba(212,168,67,0.35)",
        }}
      >
        <div className={svgWrap}>
          <MarkSvg />
        </div>
      </div>

      {/* Wordmark */}
      <div className="leading-none">
        <span className={`${nameColor} ${nameSize} font-bold tracking-[-0.02em] block`}>
          Mizark
        </span>
        {subtitle && (
          <span className={`${subColor} text-[9px] uppercase tracking-[0.14em] mt-[2px] block`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
