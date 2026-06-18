import { supabase } from "@/integrations/supabase/client";

export type UserStats = {
  user_id: string;
  level: number;
  xp: number;
  total_points: number;
  available_points: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
};

export type Badge = {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  requirement: string | null;
};

export type UserBadge = { id: string; badge_id: string; earned_at: string; badges: Badge | null };

export type Quest = {
  id: string;
  key: string;
  title: string;
  description: string;
  kind: "daily" | "weekly";
  target: number;
  reward_points: number;
  icon: string;
};

export type QuestProgress = {
  id: string;
  quest_id: string;
  progress: number;
  completed_at: string | null;
  claimed_at: string | null;
  period_key: string;
};

export type MysteryBox = {
  id: string;
  key: string;
  name: string;
  description: string;
  cost_points: number;
  tier: string;
  icon: string;
};

export type BoxReward = {
  id: string;
  box_id: string;
  label: string;
  description: string | null;
  points_value: number;
  rarity: string;
  icon: string;
};

export type BoxOpening = {
  id: string;
  box_id: string;
  reward_id: string | null;
  reward_label: string;
  points_awarded: number;
  rarity: string | null;
  created_at: string;
};

const PERKLY_LEVELS = [
  { min: 1, max: 4, name: "Explorer", color: "bg-amber-200 text-amber-900" },
  { min: 5, max: 9, name: "Insider", color: "bg-orange-200 text-orange-900" },
  { min: 10, max: 19, name: "Champion", color: "bg-rose-200 text-rose-900" },
  { min: 20, max: 49, name: "Hero", color: "bg-violet-200 text-violet-900" },
  { min: 50, max: 999, name: "Legend", color: "bg-yellow-200 text-yellow-900" },
];

export function levelTier(level: number) {
  return PERKLY_LEVELS.find((l) => level >= l.min && level <= l.max) ?? PERKLY_LEVELS[0];
}

export function xpForLevel(level: number) {
  return Math.pow(level - 1, 2) * 100;
}

export function xpProgressToNext(stats: UserStats) {
  const current = xpForLevel(stats.level);
  const next = xpForLevel(stats.level + 1);
  const pct = Math.min(100, Math.max(0, ((stats.xp - current) / (next - current)) * 100));
  return { current, next, pct, remaining: Math.max(0, next - stats.xp) };
}

export async function ensureUserStats(userId: string): Promise<UserStats> {
  const { data } = await supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle();
  if (data) return data as UserStats;
  const { data: inserted, error } = await supabase
    .from("user_stats")
    .insert({ user_id: userId })
    .select("*")
    .single();
  if (error) throw error;
  return inserted as UserStats;
}

export async function fetchUserStats(userId: string) {
  return ensureUserStats(userId);
}

export async function fetchAllBadges() {
  const { data, error } = await supabase.from("badges").select("*").order("tier");
  if (error) throw error;
  return (data ?? []) as Badge[];
}

export async function fetchUserBadges(userId: string) {
  const { data, error } = await supabase
    .from("user_badges")
    .select("id, badge_id, earned_at, badges(*)")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as unknown as UserBadge[];
}

export function todayPeriodKey() {
  return new Date().toISOString().slice(0, 10);
}

export function weekPeriodKey() {
  const d = new Date();
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return `W-${start.toISOString().slice(0, 10)}`;
}

export async function fetchActiveQuests() {
  const { data, error } = await supabase
    .from("quests")
    .select("*")
    .eq("is_active", true)
    .order("kind");
  if (error) throw error;
  return (data ?? []) as Quest[];
}

export async function fetchQuestProgress(userId: string) {
  const { data, error } = await supabase
    .from("quest_progress")
    .select("*")
    .eq("user_id", userId)
    .in("period_key", [todayPeriodKey(), weekPeriodKey()]);
  if (error) throw error;
  return (data ?? []) as QuestProgress[];
}

export async function progressQuest(userId: string, questKey: string) {
  const { data: q } = await supabase.from("quests").select("*").eq("key", questKey).maybeSingle();
  if (!q) return null;
  const periodKey = q.kind === "weekly" ? weekPeriodKey() : todayPeriodKey();
  const { data: existing } = await supabase
    .from("quest_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_id", q.id)
    .eq("period_key", periodKey)
    .maybeSingle();

  if (existing?.completed_at) return existing as QuestProgress;

  const nextProgress = (existing?.progress ?? 0) + 1;
  const completed = nextProgress >= q.target;
  if (existing) {
    const { data, error } = await supabase
      .from("quest_progress")
      .update({
        progress: nextProgress,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    if (completed) await claimQuestReward(userId, q.id, q.reward_points, q.key);
    return data as QuestProgress;
  }
  const { data, error } = await supabase
    .from("quest_progress")
    .insert({
      user_id: userId,
      quest_id: q.id,
      progress: nextProgress,
      period_key: periodKey,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .select("*")
    .single();
  if (error) throw error;
  if (completed) await claimQuestReward(userId, q.id, q.reward_points, q.key);
  return data as QuestProgress;
}

async function claimQuestReward(userId: string, questId: string, points: number, key: string) {
  await supabase.rpc("award_points", {
    _user_id: userId,
    _delta: points,
    _reason: `quest:${key}`,
    _metadata: { quest_id: questId } as never,
  });
  await supabase
    .from("quest_progress")
    .update({ claimed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("quest_id", questId)
    .is("claimed_at", null);
}

export async function fetchMysteryBoxes() {
  const { data, error } = await supabase
    .from("mystery_boxes")
    .select("*")
    .eq("is_active", true)
    .order("cost_points");
  if (error) throw error;
  return (data ?? []) as MysteryBox[];
}

export async function fetchBoxRewards(boxId: string) {
  const { data, error } = await supabase.from("box_rewards").select("*").eq("box_id", boxId);
  if (error) throw error;
  return (data ?? []) as BoxReward[];
}

export async function openBox(boxId: string): Promise<BoxOpening> {
  const { data, error } = await supabase.rpc("open_mystery_box", { _box_id: boxId });
  if (error) throw error;
  return data as unknown as BoxOpening;
}

export async function fetchRecentOpenings(userId: string, limit = 5) {
  const { data, error } = await supabase
    .from("box_openings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as BoxOpening[];
}
