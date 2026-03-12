"use client";

import { useState } from "react";
import { findPlayer } from "@/lib/lp";

// ── Field component extracted OUTSIDE to prevent re-mount on every render ──
function FormField({ label, error, children }) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-[#7A7A8E] uppercase tracking-[1.2px] mb-[3px]">
        {label}
      </label>
      {children}
      {error && (
        <div className="text-loss text-[10px] font-mono mt-[3px] leading-tight">
          {error}
        </div>
      )}
    </div>
  );
}

// ── Score validation for pickleball rules ──
function validatePickleballScore(myScore, oppScore) {
  const s1 = parseInt(myScore);
  const s2 = parseInt(oppScore);

  if (isNaN(s1) || isNaN(s2)) return null;
  if (s1 < 0 || s2 < 0) return "Scores can't be negative.";

  // At least one player must reach 11
  if (s1 < 11 && s2 < 11) {
    return "Game not finished — at least one player must score 11 or more.";
  }

  // Can't be a tie
  if (s1 === s2) {
    return "Game not finished — can't be a tie.";
  }

  // Win by 2 rule
  const winner = Math.max(s1, s2);
  const loser = Math.min(s1, s2);
  if (winner - loser < 2) {
    return `Game not finished — must win by 2. (${winner}-${loser} is only a 1-point lead)`;
  }

  // If score goes past 11, both must be close (deuce situation)
  if (winner > 11 && loser < winner - 2 && loser >= 10) {
    // This is fine — extended deuce game
  } else if (winner > 11 && loser < 10) {
    return `Invalid score — game should have ended at 11-${loser}. Score can only go past 11 in a deuce (tied at 10+).`;
  }

  return null; // Valid
}

export default function MatchForm({ onSubmit, onCancel, players, currentUser }) {
  const [type, setType] = useState("Singles");
  const [opp1, setOpp1] = useState("");
  const [opp2, setOpp2] = useState("");
  const [partner, setPartner] = useState("");
  const [myScore, setMyScore] = useState("");
  const [oppScore, setOppScore] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [errors, setErrors] = useState({});

  const isDoubles = type === "Doubles";

  const validatePlayerField = (nameInput, fieldKey, newErrors) => {
    if (!nameInput.trim()) {
      newErrors[fieldKey] = "Enter a name";
      return null;
    }
    const result = findPlayer(nameInput, players, currentUser.id);
    if (!result) {
      newErrors[fieldKey] = `"${nameInput.trim()}" is not registered. They need to create an account first.`;
      return null;
    }
    if (result.ambiguous) {
      newErrors[fieldKey] = `Multiple players named "${nameInput.trim()}". Use their full name (first + last).`;
      return null;
    }
    return result;
  };

  const handleSave = () => {
    const newErrors = {};

    // Validate opponent
    const p2 = validatePlayerField(opp1, "opp1", newErrors);

    // Validate doubles players
    let partnerPlayer = null;
    let opp2Player = null;
    if (isDoubles) {
      partnerPlayer = validatePlayerField(partner, "partner", newErrors);
      opp2Player = validatePlayerField(opp2, "opp2", newErrors);
    }

    // Validate scores exist
    if (!myScore && !oppScore) {
      newErrors.score = "Enter both scores.";
    } else if (!myScore) {
      newErrors.score = "Enter your score.";
    } else if (!oppScore) {
      newErrors.score = "Enter opponent's score.";
    } else {
      // Validate pickleball rules
      const scoreError = validatePickleballScore(myScore, oppScore);
      if (scoreError) {
        newErrors.score = scoreError;
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    onSubmit({
      type,
      player2: p2,
      partner: isDoubles ? partnerPlayer : null,
      opponent2: isDoubles ? opp2Player : null,
      score1: parseInt(myScore),
      score2: parseInt(oppScore),
      location: location.trim() || "Unknown",
      date,
    });

    setOpp1("");
    setOpp2("");
    setPartner("");
    setMyScore("");
    setOppScore("");
    setLocation("");
    setErrors({});
  };

  return (
    <div
      className="border-b border-dark-border bg-neon/[0.02] overflow-hidden"
      style={{ padding: "20px 28px", animation: "slideDown 0.3s ease both" }}
    >
      {/* Type toggle */}
      <div className="flex gap-2 mb-3.5">
        {["Singles", "Doubles"].map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t);
              setErrors({});
            }}
            className={`px-5 py-[7px] rounded-xl border-none cursor-pointer text-[13px] font-semibold font-display transition-all ${
              type === t
                ? "bg-neon text-dark-bg"
                : "bg-white/[0.06] text-[#7A7A8E]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Player fields */}
      {isDoubles ? (
        <div className="flex gap-5 items-start mb-3.5">
          <div className="flex-1">
            <div className="text-[11px] font-mono text-neon mb-1.5 font-semibold">
              YOUR TEAM
            </div>
            <FormField label="Your Partner" error={errors.partner}>
              <input
                placeholder="First Last"
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
              />
            </FormField>
          </div>
          <div className="flex items-center text-[#7A7A8E] font-extrabold text-base pt-7">
            VS
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-mono text-loss mb-1.5 font-semibold">
              OPPONENT TEAM
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <FormField label="Opponent 1" error={errors.opp1}>
                  <input
                    placeholder="First Last"
                    value={opp1}
                    onChange={(e) => setOpp1(e.target.value)}
                  />
                </FormField>
              </div>
              <div className="flex-1">
                <FormField label="Opponent 2" error={errors.opp2}>
                  <input
                    placeholder="First Last"
                    value={opp2}
                    onChange={(e) => setOpp2(e.target.value)}
                  />
                </FormField>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-3.5 max-w-[300px]">
          <FormField label="Opponent" error={errors.opp1}>
            <input
              placeholder="First Last (must be registered)"
              value={opp1}
              onChange={(e) => setOpp1(e.target.value)}
            />
          </FormField>
        </div>
      )}

      {/* Score + details */}
      <div
        className="grid gap-2.5 items-start"
        style={{ gridTemplateColumns: "80px 80px 1fr 140px auto" }}
      >
        <FormField label="My Pts">
          <input
            type="number"
            min="0"
            placeholder="11"
            value={myScore}
            onChange={(e) => setMyScore(e.target.value)}
          />
        </FormField>
        <FormField label="Opp Pts">
          <input
            type="number"
            min="0"
            placeholder="7"
            value={oppScore}
            onChange={(e) => setOppScore(e.target.value)}
          />
        </FormField>
        <FormField label="Location">
          <input
            placeholder="Court name"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </FormField>
        <FormField label="Date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </FormField>
        <div className="flex gap-1.5 pt-[17px]">
          <button
            onClick={handleSave}
            className="h-[42px] px-5 rounded-xl border-none cursor-pointer text-sm font-bold font-display bg-neon text-dark-bg whitespace-nowrap hover:brightness-110 transition-all"
          >
            Save ✓
          </button>
          <button
            onClick={onCancel}
            className="h-[42px] px-3.5 rounded-xl border border-dark-border cursor-pointer text-[13px] font-display bg-transparent text-[#7A7A8E] hover:border-[#7A7A8E] transition-all"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Score validation error — shown below the whole form */}
      {errors.score && (
        <div className="mt-3 px-3.5 py-2.5 bg-loss/10 border border-loss/30 rounded-xl flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <span className="text-loss text-[12px] font-mono font-semibold">
            {errors.score}
          </span>
        </div>
      )}
    </div>
  );
}