"use client";

export default function StatCard({ label, value, sub, icon, delay = 0 }) {
  return (
    <div
      className="relative overflow-hidden bg-dark-card border border-dark-border rounded-2xl"
      style={{ padding: "18px 20px", animation: `fadeUp 0.5s ease ${delay}s both` }}
    >
      <div className="absolute -top-5 -right-5 text-7xl opacity-[0.04] leading-none select-none">
        {icon}
      </div>
      <span className="block font-mono text-[11px] text-[#7A7A8E] uppercase tracking-[1.5px]">
        {label}
      </span>
      <span className="block text-[32px] font-extrabold font-display leading-none text-[#F0F0F5] mt-1">
        {value}
      </span>
      {sub && (
        <span className="block font-mono text-xs text-neon mt-1">{sub}</span>
      )}
    </div>
  );
}
