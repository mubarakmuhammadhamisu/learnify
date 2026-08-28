// ─────────────────────────────────────────────────────────────────────────────
// lib/randomGradient.ts
//
// Assigns a random from/to gradient pair to a course at CREATE time only.
// Uses the same Tailwind class-fragment convention already present on most
// existing rows ("from-cyan-500/20" style) — one existing row has raw hex
// codes instead, which is treated as a pre-existing inconsistency, not a
// pattern to continue.
//
// Deliberately NOT used on edit — a course's gradient should stay stable
// across edits; regenerating it every time someone fixes a typo would be a
// jarring, unwanted visual side effect.
// ─────────────────────────────────────────────────────────────────────────────

const GRADIENT_PALETTE: Array<{ from: string; to: string }> = [
  { from: 'from-cyan-500/20',   to: 'to-emerald-500/20' },
  { from: 'from-emerald-500/20', to: 'to-sky-500/20' },
  { from: 'from-teal-500/20',   to: 'to-indigo-500/20' },
  { from: 'from-indigo-500/20', to: 'to-purple-500/20' },
  { from: 'from-amber-500/20',  to: 'to-red-500/20' },
  { from: 'from-sky-500/20',    to: 'to-indigo-500/20' },
  { from: 'from-orange-500/20', to: 'to-yellow-500/20' },
  { from: 'from-pink-500/20',   to: 'to-rose-500/20' },
  { from: 'from-violet-500/20', to: 'to-fuchsia-500/20' },
  { from: 'from-blue-500/20',   to: 'to-cyan-500/20' },
];

export function randomGradient(): { gradientFrom: string; gradientTo: string } {
  const pick = GRADIENT_PALETTE[Math.floor(Math.random() * GRADIENT_PALETTE.length)];
  return { gradientFrom: pick.from, gradientTo: pick.to };
}
