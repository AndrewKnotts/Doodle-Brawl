export type RatingRow = { rating: number; wins: number; losses: number };

export function ensureRow(map: Map<string, RatingRow>, id: string) {
  if (!map.has(id)) map.set(id, { rating: 1000, wins: 0, losses: 0 });
  return map.get(id)!;
}

export function expectedScore(ra: number, rb: number) {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

export function applyElo(
  a: RatingRow, // winner
  b: RatingRow, // loser
  K = 32
) {
  const Ea = expectedScore(a.rating, b.rating);
  const Eb = 1 - Ea;
  a.rating = Math.round(a.rating + K * (1 - Ea));
  b.rating = Math.round(b.rating + K * (0 - Eb));
  a.wins += 1;
  b.losses += 1;
}
