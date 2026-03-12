"use client";

import { getLpTier } from "@/lib/lp";

export default function LpBadge({ lp }) {
  const tier = getLpTier(lp);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full text-[11px]"
      style={{
        background: `${tier.color}15`,
        border: `1px solid ${tier.color}40`,
        padding: "3px 10px",
      }}
    >
      <span>{tier.icon}</span>
      <span className="font-mono font-bold" style={{ color: tier.color }}>
        {tier.name}
      </span>
      <span className="font-mono text-[#7A7A8E]">{lp} LP</span>
    </span>
  );
}
