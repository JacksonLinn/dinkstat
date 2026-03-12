import { calcLpChange } from "./lp";

// Demo players (used when Firebase is not configured)
export const DEMO_PLAYERS = [
  { id: "u1", firstName: "Jackson", lastName: "Lin", email: "jackson@demo.com", lp: 0 },
  { id: "u2", firstName: "Alex", lastName: "Chen", email: "alex.c@demo.com", lp: 0 },
  
];

const SEED_MATCHES = [
  
];

/**
 * Generate seeded match data with LP calculations.
 * Returns { matches, lpMap } where lpMap is { playerId: currentLp }
 */
export function seedData(players) {
  const matches = [];
  const lpMap = {};
  players.forEach((p) => (lpMap[p.id] = 0));

  let id = 1;
  for (const s of SEED_MATCHES) {
    const winner = s.s1 > s.s2 ? s.p1 : s.p2;
    const loser = winner === s.p1 ? s.p2 : s.p1;
    const diff = Math.abs(s.s1 - s.s2);
    const { gained, lost } = calcLpChange(lpMap[winner] || 0, lpMap[loser] || 0, diff);

    lpMap[winner] = Math.max(0, (lpMap[winner] || 0) + gained);
    lpMap[loser] = Math.max(0, (lpMap[loser] || 0) - lost);

    const p1 = players.find((p) => p.id === s.p1);
    const p2 = players.find((p) => p.id === s.p2);

    matches.push({
      id: id++,
      date: s.date,
      type: s.type,
      player1Id: s.p1,
      player1Name: `${p1.firstName} ${p1.lastName}`,
      player2Id: s.p2,
      player2Name: `${p2.firstName} ${p2.lastName}`,
      score1: s.s1,
      score2: s.s2,
      winnerId: winner,
      loserId: loser,
      lpGained: gained,
      lpLost: lost,
      location: ["Riverside Courts", "Downtown Rec", "Elm Park"][id % 3],
    });
  }

  return { matches, lpMap };
}
