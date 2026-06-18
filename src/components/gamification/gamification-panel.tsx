import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Flame, Trophy, Gift, Star, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  fetchUserStats,
  fetchAllBadges,
  fetchUserBadges,
  fetchActiveQuests,
  fetchQuestProgress,
  fetchMysteryBoxes,
  fetchRecentOpenings,
  openBox,
  progressQuest,
  todayPeriodKey,
  weekPeriodKey,
  levelTier,
  xpProgressToNext,
  type BoxOpening,
} from "@/lib/gamification";

export function GamificationPanel({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const statsQ = useQuery({ queryKey: ["stats", userId], queryFn: () => fetchUserStats(userId) });
  const badgesQ = useQuery({ queryKey: ["badges"], queryFn: fetchAllBadges });
  const userBadgesQ = useQuery({ queryKey: ["user-badges", userId], queryFn: () => fetchUserBadges(userId) });
  const questsQ = useQuery({ queryKey: ["quests"], queryFn: fetchActiveQuests });
  const progressQ = useQuery({ queryKey: ["quest-progress", userId], queryFn: () => fetchQuestProgress(userId) });
  const boxesQ = useQuery({ queryKey: ["boxes"], queryFn: fetchMysteryBoxes });
  const openingsQ = useQuery({ queryKey: ["openings", userId], queryFn: () => fetchRecentOpenings(userId) });

  // mark daily browse quest on load
  useEffect(() => {
    progressQuest(userId, "daily_browse").catch(() => {});
    // refresh quest progress after a beat
    const t = setTimeout(() => qc.invalidateQueries({ queryKey: ["quest-progress", userId] }), 800);
    return () => clearTimeout(t);
  }, [userId, qc]);

  const [opening, setOpening] = useState<string | null>(null);
  const [reveal, setReveal] = useState<BoxOpening | null>(null);

  const stats = statsQ.data;
  const tier = stats ? levelTier(stats.level) : null;
  const xpInfo = stats ? xpProgressToNext(stats) : null;

  const earnedIds = new Set((userBadgesQ.data ?? []).map((b) => b.badge_id));
  const progress = progressQ.data ?? [];

  const handleOpen = async (boxId: string) => {
    setOpening(boxId);
    try {
      const r = await openBox(boxId);
      setReveal(r);
      // celebrate
      qc.invalidateQueries({ queryKey: ["stats", userId] });
      qc.invalidateQueries({ queryKey: ["openings", userId] });
      setTimeout(() => setReveal(null), 4500);
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(msg === "insufficient_points" ? "Not enough Perk Points to open this box." : msg);
    } finally {
      setOpening(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Level card */}
      <section className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-amber-100/60 via-card to-card p-6 shadow-sm">
        {statsQ.isLoading || !stats || !tier || !xpInfo ? (
          <Skeleton className="h-32 rounded-xl" />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Your Perkly Level</p>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="font-display text-4xl font-bold">Lv {stats.level}</span>
                  <span className={`rounded-full px-3 py-1 font-display text-xs font-bold ${tier.color}`}>{tier.name}</span>
                </div>
              </div>
              <div className="flex gap-3 text-right">
                <div className="rounded-2xl border border-border bg-card/60 px-4 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Points</p>
                  <p className="font-display text-2xl font-bold text-primary">{stats.available_points}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card/60 px-4 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><Flame className="mr-1 inline h-3 w-3" />Streak</p>
                  <p className="font-display text-2xl font-bold">{stats.current_streak}d</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-to-r from-primary via-primary-glow to-amber-400 transition-all duration-700"
                  style={{ width: `${xpInfo.pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {xpInfo.remaining} XP until <strong>Lv {stats.level + 1}</strong>
              </p>
            </div>
          </>
        )}
      </section>

      {/* Quests */}
      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Active quests</p>
            <h3 className="font-display text-lg font-bold">Earn Perk Points today</h3>
          </div>
        </div>
        {questsQ.isLoading ? (
          <Skeleton className="mt-4 h-32 rounded-xl" />
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {(questsQ.data ?? []).map((q) => {
              const periodKey = q.kind === "weekly" ? weekPeriodKey() : todayPeriodKey();
              const p = progress.find((x) => x.quest_id === q.id && x.period_key === periodKey);
              const pct = Math.min(100, Math.round(((p?.progress ?? 0) / q.target) * 100));
              const done = !!p?.completed_at;
              return (
                <li key={q.id} className={`rounded-2xl border p-4 transition-colors ${done ? "border-emerald-300 bg-emerald-50/60" : "border-border bg-muted/30"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-display font-semibold">
                        <span className="text-lg">{q.icon}</span>{q.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{q.description}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${done ? "bg-emerald-600 text-white" : "bg-primary/10 text-primary"}`}>
                      +{q.reward_points}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{q.kind}{done ? " · completed ✓" : ""}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Badges */}
      <section className="rounded-3xl border border-border bg-card p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Badges</p>
        <h3 className="font-display text-lg font-bold">Your trophy case</h3>
        {badgesQ.isLoading ? (
          <Skeleton className="mt-4 h-24 rounded-xl" />
        ) : (
          <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {(badgesQ.data ?? []).map((b) => {
              const earned = earnedIds.has(b.id);
              return (
                <li
                  key={b.id}
                  className={`group relative aspect-square rounded-2xl border p-2 text-center transition ${earned ? "border-primary/40 bg-gradient-to-br from-primary/10 to-amber-100" : "border-dashed border-border bg-muted/30 opacity-60"}`}
                  title={`${b.name} — ${b.description}`}
                >
                  <div className="flex h-full flex-col items-center justify-center gap-1">
                    <span className="text-2xl">{earned ? b.icon : "🔒"}</span>
                    <span className="font-display text-[10px] font-semibold leading-tight">{b.name}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Mystery boxes */}
      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Mystery boxes</p>
            <h3 className="font-display text-lg font-bold">Spend Perk Points · win surprises</h3>
          </div>
        </div>
        {boxesQ.isLoading ? (
          <Skeleton className="mt-4 h-40 rounded-xl" />
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-3">
            {(boxesQ.data ?? []).map((b) => {
              const canAfford = (stats?.available_points ?? 0) >= b.cost_points;
              return (
                <li key={b.id} className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-amber-50 via-card to-card p-5 text-center transition-transform hover:-translate-y-1">
                  <div className="text-5xl transition-transform duration-500 group-hover:rotate-12">{b.icon}</div>
                  <p className="mt-2 font-display text-base font-bold">{b.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Cost</p>
                  <p className="font-display text-xl font-bold text-primary">{b.cost_points} pts</p>
                  <Button
                    className="mt-3 w-full"
                    disabled={!canAfford || opening === b.id}
                    onClick={() => handleOpen(b.id)}
                    variant={canAfford ? "default" : "outline"}
                  >
                    {opening === b.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :
                     canAfford ? <Gift className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                    {canAfford ? "Open box" : "Not enough"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Recent openings */}
        {openingsQ.data && openingsQ.data.length > 0 && (
          <div className="mt-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Recent rewards</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {openingsQ.data.map((o) => (
                <li key={o.id} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs">
                  <Star className="mr-1 inline h-3 w-3 text-amber-500" />{o.reward_label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Reveal modal */}
      {reveal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Confetti />
          <div className="relative w-full max-w-md animate-in zoom-in-95 rounded-3xl border border-primary/30 bg-card p-8 text-center shadow-2xl">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-5xl text-primary-foreground [transform-style:preserve-3d] animate-[spin_0.9s_ease-in-out_1]">
              🎉
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-primary">{reveal.rarity ?? "reward"} drop!</p>
            <h3 className="mt-1 font-display text-2xl font-bold">{reveal.reward_label}</h3>
            {reveal.points_awarded > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">+{reveal.points_awarded} Perk Points added.</p>
            )}
            <Button className="mt-6 w-full" onClick={() => setReveal(null)}>Awesome</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 40 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      color: ["#f59e0b", "#fb7185", "#22d3ee", "#a78bfa", "#34d399"][i % 5],
      rotate: Math.random() * 360,
    })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-[-20px] block h-3 w-2 rounded-sm"
          style={{
            left: `${p.left}%`,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall 2.4s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`@keyframes confetti-fall { to { transform: translateY(110vh) rotate(720deg); opacity: 0.6; } }`}</style>
    </div>
  );
}
