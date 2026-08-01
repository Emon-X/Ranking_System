/**
 * Returns Tailwind badge classes for Codeforces judge rating tiers.
 * 
 * Newbie (< 1200): Gray
 * Pupil (1200-1399): Green
 * Specialist (1400-1599): Cyan
 * Expert (1600-1899): Blue
 * Candidate Master (1900-2199): Purple/Violet
 * Master (2200-2399): Orange
 * Grandmaster+ (>= 2400): Red
 */
export function getCodeforcesRatingClass(rating) {
  const r = Number(rating) || 0;
  if (r <= 0) return "text-muted-foreground border-border/50 bg-muted/20";
  if (r < 1200) return "text-zinc-400 border-zinc-500/30 bg-zinc-500/10";
  if (r < 1400) return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10 font-semibold";
  if (r < 1600) return "text-cyan-400 border-cyan-500/30 bg-cyan-500/10 font-semibold";
  if (r < 1900) return "text-blue-500 border-blue-500/30 bg-blue-500/10 font-semibold";
  if (r < 2200) return "text-purple-400 border-purple-500/30 bg-purple-500/10 font-semibold";
  if (r < 2400) return "text-amber-500 border-amber-500/30 bg-amber-500/10 font-bold";
  return "text-rose-500 border-rose-500/30 bg-rose-500/10 font-bold";
}

/**
 * Returns Tailwind badge classes for AtCoder judge rating tiers.
 * 
 * Gray (< 400)
 * Brown (400-799)
 * Green (800-1199)
 * Cyan (1200-1599)
 * Blue (1600-1999)
 * Yellow (2000-2399)
 * Orange (2400-2799)
 * Red (>= 2800)
 */
export function getAtCoderRatingClass(rating) {
  const r = Number(rating) || 0;
  if (r <= 0) return "text-muted-foreground border-border/50 bg-muted/20";
  if (r < 400) return "text-zinc-400 border-zinc-500/30 bg-zinc-500/10";
  if (r < 800) return "text-amber-700 dark:text-amber-600 border-amber-700/30 bg-amber-700/10 font-semibold";
  if (r < 1200) return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10 font-semibold";
  if (r < 1600) return "text-cyan-400 border-cyan-500/30 bg-cyan-500/10 font-semibold";
  if (r < 2000) return "text-blue-500 border-blue-500/30 bg-blue-500/10 font-semibold";
  if (r < 2400) return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10 font-bold";
  if (r < 2800) return "text-orange-500 border-orange-500/30 bg-orange-500/10 font-bold";
  return "text-rose-500 border-rose-500/30 bg-rose-500/10 font-bold";
}
