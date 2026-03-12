// ── LP Calculation (League-style) ──────────────────────

/**
 * Calculate LP gained/lost based on score margin and LP difference.
 * 
 * Margin-based:
 *   Win by 1-2  → +12 LP gained, -12 LP lost
 *   Win by 3-5  → +18 LP gained, -16 LP lost
 *   Win by 6-8  → +24 LP gained, -20 LP lost
 *   Win by 9+   → +30 LP gained, -24 LP lost
 * 
 * Upset bonus: up to +15 extra LP for beating someone ranked higher.
 * Favored penalty: up to +10 extra LP lost for losing to someone ranked lower.
 * LP floor is 0 (can't go negative).
 */
export function calcLpChange(winnerLp, loserLp, scoreDiff) {
  // Base LP from margin
  let baseGain, baseLoss;
  if (scoreDiff >= 9) {
    baseGain = 30;
    baseLoss = 24;
  } else if (scoreDiff >= 6) {
    baseGain = 24;
    baseLoss = 20;
  } else if (scoreDiff >= 3) {
    baseGain = 18;
    baseLoss = 16;
  } else {
    baseGain = 12;
    baseLoss = 12;
  }

  // Upset bonus: winner had less LP than loser
  const lpDiff = loserLp - winnerLp;
  let upsetBonus = 0;
  if (lpDiff > 0) {
    upsetBonus = Math.min(Math.round(lpDiff * 0.15), 15);
  }

  // Favored penalty: loser had more LP than winner (they should have won)
  let extraLoss = 0;
  if (lpDiff < 0) {
    extraLoss = Math.min(Math.round(Math.abs(lpDiff) * 0.1), 10);
  }

  return {
    gained: baseGain + upsetBonus,
    lost: baseLoss + extraLoss,
  };
}

// ── Tier System ────────────────────────────────────────

export function getLpTier(lp) {
  if (lp >= 500) return { name: "Diamond", color: "#B9F2FF", icon: "💎" };
  if (lp >= 350) return { name: "Platinum", color: "#E5E4E2", icon: "⚡" };
  if (lp >= 200) return { name: "Gold", color: "#FFD700", icon: "🥇" };
  if (lp >= 100) return { name: "Silver", color: "#C0C0C0", icon: "🥈" };
  return { name: "Bronze", color: "#CD7F32", icon: "🥉" };
}

// ── Formatting ─────────────────────────────────────────

export function formatDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ── Player Lookup ──────────────────────────────────────

/**
 * Find a registered player by name input.
 * Returns: player object, { ambiguous: true, matches } if multiple found, or null if not found.
 * Handles: full name, first name only, last name only. 
 * Excludes the current user from results to prevent self-matching.
 */
export function findPlayer(nameInput, players, excludeId = null) {
  const name = nameInput.trim().toLowerCase();
  if (!name) return null;

  const parts = name.split(/\s+/);
  const results = players.filter((p) => {
    if (p.id === excludeId) return false;
    const full = `${p.firstName} ${p.lastName}`.toLowerCase();
    const first = p.firstName.toLowerCase();
    const last = p.lastName.toLowerCase();
    if (full === name) return true;
    if (parts.length === 1) return first === name || last === name;
    return first === parts[0] && last === parts[parts.length - 1];
  });

  if (results.length === 1) return results[0];
  if (results.length > 1) return { ambiguous: true, matches: results };
  return null;
}
