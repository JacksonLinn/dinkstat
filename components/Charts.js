"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Area, AreaChart, LineChart, Line,
} from "recharts";

const NEON = "#BFFF00";
const LOSS = "#FF4060";
const ACCENT = "#00D4FF";
const TEXT_S = "#7A7A8E";
const WIN = "#BFFF00";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1A28] border border-dark-border rounded-xl px-3.5 py-2.5 text-xs font-mono">
      <div className="text-[#7A7A8E] mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || p.stroke }} className="font-semibold">
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

const chartAxis = { fill: TEXT_S, fontSize: 10, fontFamily: "JetBrains Mono" };
const gridStroke = "rgba(255,255,255,0.04)";

function ChartCard({ title, delay = 0, children }) {
  return (
    <div
      className="bg-dark-card border border-dark-border rounded-2xl"
      style={{ padding: "18px 16px 10px", animation: `fadeUp 0.5s ease ${delay}s both` }}
    >
      <h3 className="text-xs font-mono text-[#7A7A8E] uppercase tracking-[1.2px] mb-3.5">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function LpChart({ data }) {
  return (
    <ChartCard title="LP Rating Over Time" delay={0.3}>
      <ResponsiveContainer width="100%" height={190}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="date" tick={chartAxis} axisLine={false} tickLine={false} />
          <YAxis domain={[0, "dataMax + 20"]} tick={chartAxis} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Line type="monotone" dataKey="lp" stroke={ACCENT} strokeWidth={2.5} dot={{ fill: ACCENT, r: 3.5 }} name="LP" />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function WinRateChart({ data }) {
  return (
    <ChartCard title="Win Rate Trend" delay={0.35}>
      <ResponsiveContainer width="100%" height={190}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={NEON} stopOpacity={0.3} />
              <stop offset="95%" stopColor={NEON} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="date" tick={chartAxis} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={chartAxis} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="winRate" stroke={NEON} strokeWidth={2.5} fill="url(#gG)" name="Win %" dot={{ fill: NEON, r: 3.5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ScoreChart({ data }) {
  return (
    <ChartCard title="Score Per Match" delay={0.4}>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="date" tick={chartAxis} axisLine={false} tickLine={false} />
          <YAxis tick={chartAxis} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="myScore" name="You" fill={NEON} radius={[4, 4, 0, 0]} />
          <Bar dataKey="oppScore" name="Opponent" fill="rgba(255,64,96,0.7)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function WinLossPie({ wins, losses }) {
  return (
    <ChartCard title="Win / Loss Split" delay={0.45}>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={[{ name: "Wins", value: wins || 0 }, { name: "Losses", value: losses || 0 }]}
            cx="50%" cy="50%" innerRadius={46} outerRadius={68}
            paddingAngle={4} dataKey="value" stroke="none"
          >
            <Cell fill={WIN} />
            <Cell fill={LOSS} />
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-5 mt-0.5">
        {[["Wins", wins, WIN], ["Losses", losses, LOSS]].map(([n, v, c]) => (
          <span key={n} className="flex items-center gap-1.5 text-[11px] text-[#7A7A8E]">
            <span className="w-[9px] h-[9px] rounded-sm inline-block" style={{ background: c }} />
            {n} ({v})
          </span>
        ))}
      </div>
    </ChartCard>
  );
}
