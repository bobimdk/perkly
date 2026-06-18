import { supabase } from "@/integrations/supabase/client";

export type Circle = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  cover_color: string | null;
  member_count: number;
  is_public: boolean;
  created_by: string | null;
};

export type CircleMessage = {
  id: string;
  circle_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type SeasonalDrop = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_image: string | null;
  theme_color: string | null;
  starts_at: string;
  ends_at: string;
  featured_offer_ids: string[];
  is_active: boolean;
};

export type TeamDeal = {
  id: string;
  offer_id: string;
  title: string;
  threshold: number;
  discount_percent: number;
  ends_at: string;
  joined_count: number;
  offers?: { title: string; slug: string; cover_url: string | null; price_all: number } | null;
};

export type CheckIn = {
  id: string;
  provider_id: string;
  lat: number;
  lng: number;
  created_at: string;
};

export async function listCircles() {
  const { data, error } = await supabase
    .from("circles")
    .select("*")
    .eq("is_public", true)
    .order("member_count", { ascending: false });
  if (error) throw error;
  return data as Circle[];
}

export async function getCircleBySlug(slug: string) {
  const { data, error } = await supabase.from("circles").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as Circle | null;
}

export async function isCircleMember(circleId: string, userId: string) {
  const { data } = await supabase
    .from("circle_members")
    .select("id")
    .eq("circle_id", circleId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function joinCircle(circleId: string, userId: string) {
  const { error } = await supabase.from("circle_members").insert({ circle_id: circleId, user_id: userId });
  if (error && !error.message.includes("duplicate")) throw error;
}

export async function leaveCircle(circleId: string, userId: string) {
  await supabase.from("circle_members").delete().eq("circle_id", circleId).eq("user_id", userId);
}

export async function fetchCircleMessages(circleId: string) {
  const { data, error } = await supabase
    .from("circle_messages")
    .select("*")
    .eq("circle_id", circleId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return data as CircleMessage[];
}

export async function postCircleMessage(circleId: string, userId: string, body: string) {
  const { error } = await supabase
    .from("circle_messages")
    .insert({ circle_id: circleId, user_id: userId, body });
  if (error) throw error;
}

export async function listDrops() {
  const { data, error } = await supabase
    .from("seasonal_drops")
    .select("*")
    .eq("is_active", true)
    .order("starts_at", { ascending: false });
  if (error) throw error;
  return data as SeasonalDrop[];
}

export async function getDropBySlug(slug: string) {
  const { data, error } = await supabase.from("seasonal_drops").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as SeasonalDrop | null;
}

export async function listTeamDeals() {
  const { data, error } = await supabase
    .from("team_deals")
    .select("*, offers(title, slug, cover_url, price_all)")
    .order("ends_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TeamDeal[];
}

export async function joinTeamDeal(dealId: string, userId: string) {
  const { error } = await supabase.from("team_deal_joiners").insert({ team_deal_id: dealId, user_id: userId });
  if (error && !error.message.includes("duplicate")) throw error;
}

export async function fetchCheckIns(limit = 500) {
  const { data, error } = await supabase
    .from("perk_checkins")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as CheckIn[];
}

export async function recordCheckIn(providerId: string, lat: number, lng: number, userId?: string) {
  await supabase.from("perk_checkins").insert({ provider_id: providerId, lat, lng, user_id: userId ?? null });
}

export async function sendGift(toUserId: string, amountALL: number, message: string) {
  const { data, error } = await supabase.rpc("send_gift", {
    p_to: toUserId,
    p_amount: amountALL,
    p_message: message,
  });
  if (error) throw error;
  return data as string;
}

export async function sendBroadcast(title: string, body: string, audience: string) {
  const { data, error } = await supabase.rpc("send_broadcast", { p_title: title, p_body: body, p_audience: audience });
  if (error) throw error;
  return data as number;
}

export async function listUsers(query: string) {
  let q = supabase
    .from("profiles")
    .select("id, email, first_name, last_name, suspended, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (query) q = q.ilike("email", `%${query}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function setUserSuspended(userId: string, suspended: boolean, reason?: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ suspended, suspended_reason: reason ?? null })
    .eq("id", userId);
  if (error) throw error;
}

export async function platformStats() {
  const [users, providers, offers, tx] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("providers").select("id", { count: "exact", head: true }),
    supabase.from("offers").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("transactions").select("amount_all"),
  ]);
  const gmv = (tx.data ?? []).reduce((s, t: any) => s + Number(t.amount_all), 0);
  return {
    users: users.count ?? 0,
    providers: providers.count ?? 0,
    offers: offers.count ?? 0,
    gmv,
    transactions: tx.data?.length ?? 0,
  };
}

export async function findUserByEmail(email: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name")
    .ilike("email", email)
    .limit(5);
  return data ?? [];
}
