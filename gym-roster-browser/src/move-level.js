// Tracker stores a zero-based image index: 0–4 are base move levels,
// and 5–9 are the five superawakening levels. Keep syncLevel capped for scoring.
export function displayMoveLevel(pair) {
  const index = String(pair.rawValue ?? "").split("|")[0];
  return /^[0-9]$/.test(index) ? Number(index) + 1 : pair.syncLevel;
}
