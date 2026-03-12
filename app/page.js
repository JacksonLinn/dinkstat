"use client";

import { useState, useMemo, useEffect } from "react";
import { calcLpChange, getLpTier, formatDate } from "@/lib/lp";
import {
  onAuthChange,
  logoutUser,
  subscribeToPlayers,
  subscribeToMatches,
  addMatch,
  deleteMatchDoc,
  updatePlayerLp,
} from "@/lib/firebase";
import StatCard from "@/components/StatCard";
import LpBadge from "@/components/LpBadge";
import AuthScreen from "@/components/AuthScreen";
import MatchForm from "@/components/MatchForm";
import { LpChart, WinRateChart, ScoreChart, WinLossPie } from "@/components/Charts";

const DARK_BG = "#0A0A0F";
const NEON = "#BFFF00";
const TEXT_S = "#7A7A8E";
const WIN = "#BFFF00";
const LOSS = "#FF4060";
const ACCENT = "#00D4FF";

export default function Home() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [view, setView] = useState("dashboard");
  const [showForm, setShowForm] = useState(false);

  // ── Listen to Firebase Auth state ──
  useEffect(() => {
    const unsub = onAuthChange((player) => {
      setUser(player);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Subscribe to Firestore players ──
  useEffect(() => {
    const unsub = subscribeToPlayers(setPlayers);
    return () => unsub();
  }, []);

  // ── Subscribe to Firestore matches ──
  useEffect(() => {
    const unsub = subscribeToMatches(setMatches);
    return () => unsub();
  }, []);

  // ── Compute LP map from all matches ──
  const lpMap = useMemo(() => {
    const map = {};
    players.forEach((p) => (map[p.id] = 0));
    const sorted = [...matches].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    for (const m of sorted) {
      const { gained, lost } = calcLpChange(
        map[m.winnerId] || 0,
        map[m.loserId] || 0,
        Math.abs(m.score1 - m.score2)
      );
      map[m.winnerId] = Math.max(0, (map[m.winnerId] || 0) + gained);
      map[m.loserId] = Math.max(0, (map[m.loserId] || 0) - lost);
    }
    return map;
  }, [matches, players]);

  // ── Current user stats ──
  const myLp = user ? lpMap[user.id] || 0 : 0;
  const myTier = getLpTier(myLp);

  const myMatches = useMemo(
    () => matches.filter((m) => m.player1Id === user?.id || m.player2Id === user?.id),
    [matches, user]
  );

  const myWins = myMatches.filter((m) => m.winnerId === user?.id).length;
  const myLosses = myMatches.length - myWins;
  const winRate = myMatches.length ? Math.round((myWins / myMatches.length) * 100) : 0;

  const avgFor = useMemo(() => {
    if (!myMatches.length || !user) return "0";
    const total = myMatches.reduce((s, m) => s + (m.player1Id === user.id ? m.score1 : m.score2), 0);
    return (total / myMatches.length).toFixed(1);
  }, [myMatches, user]);

  const avgAgainst = useMemo(() => {
    if (!myMatches.length || !user) return "0";
    const total = myMatches.reduce((s, m) => s + (m.player1Id === user.id ? m.score2 : m.score1), 0);
    return (total / myMatches.length).toFixed(1);
  }, [myMatches, user]);

  const streak = useMemo(() => {
    const sorted = [...myMatches].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    if (!sorted.length) return "—";
    let count = 0;
    const t = sorted[0].winnerId === user?.id;
    for (const m of sorted) {
      if ((m.winnerId === user?.id) === t) count++;
      else break;
    }
    return `${count}${t ? "W" : "L"}`;
  }, [myMatches, user]);

  // ── Chart data ──
  const lpHistory = useMemo(() => {
    const sorted = [...myMatches].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    let lp = 0;
    const hist = [{ date: "Start", lp: 0 }];
    for (const m of sorted) {
      const won = m.winnerId === user?.id;
      const diff = Math.abs(m.score1 - m.score2);
      const { gained, lost } = calcLpChange(
        won ? lp : (lpMap[m.winnerId] || 0),
        won ? (lpMap[m.loserId] || 0) : lp,
        diff
      );
      lp = Math.max(0, lp + (won ? gained : -lost));
      hist.push({ date: formatDate(m.date), lp });
    }
    return hist;
  }, [myMatches, user, lpMap]);

  const winRateData = useMemo(() => {
    const sorted = [...myMatches].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    return sorted.map((m, i, arr) => ({
      date: formatDate(m.date),
      winRate: Math.round((arr.slice(0, i + 1).filter((x) => x.winnerId === user?.id).length / (i + 1)) * 100),
    }));
  }, [myMatches, user]);

  const scoreData = useMemo(
    () =>
      [...myMatches].sort((a, b) => (a.date || "").localeCompare(b.date || "")).map((m) => ({
        date: formatDate(m.date),
        myScore: m.player1Id === user?.id ? m.score1 : m.score2,
        oppScore: m.player1Id === user?.id ? m.score2 : m.score1,
      })),
    [myMatches, user]
  );

  const leaderboard = useMemo(
    () =>
      players
        .map((p) => ({ ...p, lp: lpMap[p.id] || 0, isYou: p.id === user?.id }))
        .sort((a, b) => b.lp - a.lp),
    [players, lpMap, user]
  );

  // ── Add match to Firestore ──
  const handleAddMatch = async ({ type, player2, partner, opponent2, score1, score2, location, date }) => {
    const won = score1 > score2;
    const winnerId = won ? user.id : player2.id;
    const loserId = won ? player2.id : user.id;
    const diff = Math.abs(score1 - score2);
    const { gained, lost } = calcLpChange(lpMap[winnerId] || 0, lpMap[loserId] || 0, diff);

    await addMatch({
      date,
      type,
      player1Id: user.id,
      player1Name: `${user.firstName} ${user.lastName}`,
      player2Id: player2.id,
      player2Name: `${player2.firstName} ${player2.lastName}`,
      partner: partner ? `${partner.firstName} ${partner.lastName}` : null,
      opponent2: opponent2 ? `${opponent2.firstName} ${opponent2.lastName}` : null,
      score1,
      score2,
      winnerId,
      loserId,
      lpGained: gained,
      lpLost: lost,
      location,
    });

    // Update LP in Firestore
    await updatePlayerLp(winnerId, Math.max(0, (lpMap[winnerId] || 0) + gained));
    await updatePlayerLp(loserId, Math.max(0, (lpMap[loserId] || 0) - lost));

    setShowForm(false);
  };

  // ── Delete match from Firestore ──
  const handleDeleteMatch = async (matchId) => {
    await deleteMatchDoc(matchId);
  };

  // ── Sign out ──
  const handleSignOut = async () => {
    await logoutUser();
    setUser(null);
  };

  // ── Loading state ──
  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center" style={{ animation: "fadeUp 0.5s ease both" }}>
          <div className="text-5xl mb-4">🏓</div>
          <h1 className="text-2xl font-extrabold font-display text-[#F0F0F5]">
            DINK<span className="text-neon">STAT</span>
          </h1>
          <p className="text-[#7A7A8E] font-mono text-xs mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Auth gate ──
  if (!user) return <AuthScreen onLogin={setUser} />;

  const sortedDesc = [...myMatches].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  // ── Match row renderer ──
  const renderMatchRow = (m, i, showDelete = false) => {
    const isP1 = m.player1Id === user.id;
    const won = m.winnerId === user.id;
    const oppName = isP1 ? m.player2Name : m.player1Name;
    const myS = isP1 ? m.score1 : m.score2;
    const opS = isP1 ? m.score2 : m.score1;
    const delta = won ? m.lpGained : -m.lpLost;
    const cols = showDelete ? "80px 1fr 80px 70px 50px 60px 32px" : "80px 1fr 80px 70px 50px 60px";

    return (
      <div
        key={m.id}
        className="items-center border-b border-dark-border"
        style={{
          display: "grid",
          gridTemplateColumns: cols,
          padding: "12px 16px",
          gap: 8,
          background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent",
        }}
      >
        <span className="font-mono text-xs text-[#7A7A8E]">{formatDate(m.date)}</span>
        <div>
          <span className="text-[13px] font-semibold text-[#F0F0F5]">{oppName}</span>
          {m.partner && <span className="text-[10px] ml-1.5" style={{ color: ACCENT }}>w/ {m.partner}</span>}
          {m.opponent2 && <span className="text-[10px] text-[#7A7A8E] ml-1">& {m.opponent2}</span>}
          <span className="text-[10px] text-[#7A7A8E] ml-1.5">{m.location}</span>
        </div>
        <span className="font-mono text-[10px] text-[#7A7A8E] bg-white/5 py-0.5 px-2 rounded-full text-center">{m.type}</span>
        <span className="font-mono text-sm font-bold text-center" style={{ color: won ? WIN : LOSS }}>
          {myS}-{opS}
        </span>
        <span
          className="text-[10px] font-bold font-mono py-[3px] px-2.5 rounded-full text-center"
          style={{
            color: won ? DARK_BG : LOSS,
            background: won ? WIN : "rgba(255,64,96,0.15)",
          }}
        >
          {won ? "W" : "L"}
        </span>
        <span className="font-mono text-xs font-bold" style={{ color: delta > 0 ? NEON : LOSS }}>
          {delta > 0 ? "+" : ""}{delta} LP
        </span>
        {showDelete && (
          <button
            onClick={() => handleDeleteMatch(m.id)}
            className="bg-transparent border-none cursor-pointer text-[#7A7A8E] text-base p-0.5 rounded hover:text-loss transition-colors"
          >
            ×
          </button>
        )}
      </div>
    );
  };

  const tableHeader = (cols, headers) => (
    <div
      className="border-b border-dark-border"
      style={{ display: "grid", gridTemplateColumns: cols, padding: "6px 16px", gap: 8 }}
    >
      {headers.map((h) => (
        <span key={h} className="text-[10px] font-mono text-[#7A7A8E] uppercase tracking-wider">
          {h}
        </span>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-bg text-[#F0F0F5] font-display">
      {/* Ambient */}
      <div className="fixed pointer-events-none" style={{ top: -200, right: -200, width: 600, height: 600, background: "radial-gradient(circle,rgba(191,255,0,0.04) 0%,transparent 70%)" }} />
      <div className="fixed pointer-events-none" style={{ bottom: -200, left: -200, width: 500, height: 500, background: "radial-gradient(circle,rgba(0,212,255,0.03) 0%,transparent 70%)" }} />

      {/* Header */}
      <header className="flex justify-between items-center border-b border-dark-border" style={{ padding: "20px 28px", animation: "fadeUp 0.4s ease both" }}>
        <div className="flex items-center gap-3">
          <div className="w-[42px] h-[42px] rounded-xl bg-gradient-to-br from-neon to-[#7CFF00] flex items-center justify-center text-[22px]">🏓</div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight leading-tight">DINK<span className="text-neon">STAT</span></h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[#7A7A8E] text-[11px] font-mono">{user.firstName} {user.lastName}</span>
              <LpBadge lp={myLp} />
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 items-center">
          {["dashboard", "matches", "leaderboard"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-[7px] rounded-xl border-none cursor-pointer text-[13px] font-semibold font-display transition-all ${
                view === v ? "bg-neon text-dark-bg" : "bg-white/[0.06] text-[#7A7A8E] hover:text-[#F0F0F5]"
              }`}
            >
              {v === "dashboard" ? "📊 Dashboard" : v === "matches" ? "📋 Matches" : "🏆 Leaderboard"}
            </button>
          ))}
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-[7px] rounded-xl border-[1.5px] border-neon cursor-pointer text-[13px] font-bold font-display bg-transparent text-neon ml-1 hover:bg-neon/10 transition-all"
          >
            + Log Match
          </button>
          <button
            onClick={handleSignOut}
            className="px-3 py-[7px] rounded-xl border border-dark-border cursor-pointer text-xs font-mono bg-transparent text-[#7A7A8E] hover:border-[#7A7A8E] transition-all"
          >
            Sign Out
          </button>
        </div>
      </header>

      {showForm && <MatchForm onSubmit={handleAddMatch} onCancel={() => setShowForm(false)} players={players} currentUser={user} />}

      <main className="max-w-[1100px] mx-auto" style={{ padding: "22px 28px 40px" }}>
        {/* ═══ DASHBOARD ═══ */}
        {view === "dashboard" && (
          <>
            <div className="grid grid-cols-5 gap-3 mb-5">
              <StatCard label="LP Rating" value={myLp} sub={`${myTier.icon} ${myTier.name}`} icon="📊" delay={0.05} />
              <StatCard label="Win Rate" value={`${winRate}%`} sub={`${myWins}W - ${myLosses}L`} icon="📈" delay={0.1} />
              <StatCard label="Streak" value={streak} icon="🔥" delay={0.15} />
              <StatCard label="Avg Pts For" value={avgFor} icon="⬆" delay={0.2} />
              <StatCard label="Avg Pts Against" value={avgAgainst} icon="⬇" delay={0.25} />
            </div>

            {myMatches.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <LpChart data={lpHistory} />
                  <WinRateChart data={winRateData} />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <ScoreChart data={scoreData} />
                  <WinLossPie wins={myWins} losses={myLosses} />
                </div>
              </>
            ) : (
              <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center" style={{ animation: "fadeUp 0.5s ease both" }}>
                <div className="text-5xl mb-3">🏓</div>
                <p className="text-[#7A7A8E] font-mono text-sm">No matches yet — hit &quot;+ Log Match&quot; to start!</p>
              </div>
            )}

            {myMatches.length > 0 && (
              <div className="bg-dark-card border border-dark-border rounded-2xl pt-4" style={{ animation: "fadeUp 0.5s ease 0.5s both" }}>
                <h3 className="text-xs font-mono text-[#7A7A8E] uppercase tracking-[1.2px] px-4 pb-2.5">Recent Matches</h3>
                {tableHeader("80px 1fr 80px 70px 50px 60px", ["Date", "Opponent", "Type", "Score", "Result", "LP Δ"])}
                {sortedDesc.slice(0, 5).map((m, i) => renderMatchRow(m, i))}
              </div>
            )}
          </>
        )}

        {/* ═══ MATCHES ═══ */}
        {view === "matches" && (
          <div className="bg-dark-card border border-dark-border rounded-2xl pt-4" style={{ animation: "fadeUp 0.4s ease both" }}>
            <h3 className="text-xs font-mono text-[#7A7A8E] uppercase tracking-[1.2px] px-4 pb-2.5">All Matches ({myMatches.length})</h3>
            {tableHeader("80px 1fr 80px 70px 50px 60px 32px", ["Date", "Opponent", "Type", "Score", "Result", "LP Δ", ""])}
            {sortedDesc.map((m, i) => renderMatchRow(m, i, true))}
            {myMatches.length === 0 && (
              <div className="p-9 text-center text-[#7A7A8E] font-mono text-sm">
                No matches yet — hit &quot;+ Log Match&quot; to get started!
              </div>
            )}
          </div>
        )}

        {/* ═══ LEADERBOARD ═══ */}
        {view === "leaderboard" && (
          <div style={{ animation: "fadeUp 0.4s ease both" }}>
            <div className="bg-dark-card border border-dark-border rounded-2xl pt-4">
              <h3 className="text-xs font-mono text-[#7A7A8E] uppercase tracking-[1.2px] px-4 pb-2.5">
                Player Rankings — {players.length} Players
              </h3>
              <div className="border-b border-dark-border" style={{ display: "grid", gridTemplateColumns: "50px 1fr 130px 70px", padding: "6px 16px", gap: 8 }}>
                {["Rank", "Player", "Tier", "LP"].map((h) => (
                  <span key={h} className="text-[10px] font-mono text-[#7A7A8E] uppercase tracking-wider">{h}</span>
                ))}
              </div>
              {leaderboard.map((p, i) => (
                <div
                  key={p.id}
                  className="items-center border-b border-dark-border"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "50px 1fr 130px 70px",
                    padding: "14px 16px",
                    gap: 8,
                    background: p.isYou ? "rgba(191,255,0,0.04)" : i % 2 ? "rgba(255,255,255,0.015)" : "transparent",
                    borderLeft: p.isYou ? `3px solid ${NEON}` : "3px solid transparent",
                  }}
                >
                  <span
                    className="font-mono text-base font-extrabold"
                    style={{ color: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : TEXT_S }}
                  >
                    #{i + 1}
                  </span>
                  <div>
                    <span className={`text-sm ${p.isYou ? "font-extrabold" : "font-semibold"} text-[#F0F0F5]`}>
                      {p.firstName} {p.lastName}
                    </span>
                    {p.isYou && <span className="text-neon text-[10px] font-mono ml-2">YOU</span>}
                  </div>
                  <LpBadge lp={p.lp} />
                  <span className="font-mono text-[15px] font-bold text-[#F0F0F5]">{p.lp}</span>
                </div>
              ))}
            </div>

            {/* LP Explainer */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-5 mt-3">
              <h3 className="text-xs font-mono text-[#7A7A8E] uppercase tracking-[1.2px] mb-3">How LP Works</h3>
              <div className="grid grid-cols-2 gap-5 text-[13px] text-[#7A7A8E] leading-relaxed">
                <div>
                  <p>Everyone starts at <strong className="text-[#F0F0F5]">0 LP</strong>. LP gains depend on your margin of victory:</p>
                  <div className="mt-2.5 flex flex-col gap-1">
                    {[["Win by 1-2", "+12 LP"], ["Win by 3-5", "+18 LP"], ["Win by 6-8", "+24 LP"], ["Win by 9+", "+30 LP"]].map(([margin, lp]) => (
                      <div key={margin} className="flex justify-between font-mono text-xs px-2 py-1 bg-white/[0.03] rounded-md">
                        <span>{margin}</span>
                        <span className="text-neon font-bold">{lp}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2.5">Beat someone ranked higher? <strong style={{ color: ACCENT }}>Upset bonus</strong> up to +15 extra LP.</p>
                  <p>LP can&apos;t go below <strong className="text-[#F0F0F5]">0</strong>.</p>
                </div>
                <div>
                  <p className="mb-2.5">Tier thresholds:</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { tier: "Diamond", range: "500+ LP", color: "#B9F2FF", icon: "💎" },
                      { tier: "Platinum", range: "350-499 LP", color: "#E5E4E2", icon: "⚡" },
                      { tier: "Gold", range: "200-349 LP", color: "#FFD700", icon: "🥇" },
                      { tier: "Silver", range: "100-199 LP", color: "#C0C0C0", icon: "🥈" },
                      { tier: "Bronze", range: "0-99 LP", color: "#CD7F32", icon: "🥉" },
                    ].map((t) => (
                      <div key={t.tier} className="flex items-center gap-2.5">
                        <span>{t.icon}</span>
                        <span className="font-mono text-xs font-bold w-20" style={{ color: t.color }}>{t.tier}</span>
                        <span className="font-mono text-[11px]">{t.range}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
