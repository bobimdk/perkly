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
  provider_name?: string | null;
  provider_logo?: string | null;
  category_slug?: string | null;
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

export async function fetchCheckIns(limit = 500): Promise<CheckIn[]> {
  const { data, error } = await supabase
    .from("perk_checkins")
    .select("id, provider_id, lat, lng, created_at, providers(name, logo_url, offers(categories(slug)))")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    provider_id: row.provider_id,
    lat: Number(row.lat),
    lng: Number(row.lng),
    created_at: row.created_at,
    provider_name: row.providers?.name ?? null,
    provider_logo: row.providers?.logo_url ?? null,
    category_slug: row.providers?.offers?.[0]?.categories?.slug ?? null,
  }));
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

// ====================== FRIENDS / PROFILES ======================

export type ProfileLite = {
  id: string;

const sb: any = sb;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  company_name?: string | null;
  role_title?: string | null;
  headline?: string | null;
  location?: string | null;
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  other?: ProfileLite | null;
};

export async function fetchProfileByUsername(username: string) {
  const { data, error } = await sb
    .from("profiles" as any)
    .select("id, username, first_name, last_name, email, avatar_url, headline, bio, cover_url, location, company_name, role_title")
    .eq("username" as any, username)
    .maybeSingle();
  if (error) throw error;
  return data as any;
}

export async function fetchProfileById(id: string) {
  const { data, error } = await sb
    .from("profiles" as any)
    .select("id, username, first_name, last_name, email, avatar_url, headline, bio, cover_url, location, company_name, role_title")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as any;
}

export async function searchProfiles(query: string, excludeUserId?: string) {
  let q = sb
    .from("profiles" as any)
    .select("id, username, first_name, last_name, email, avatar_url, company_name, role_title, headline")
    .limit(30);
  if (query.trim()) {
    const term = `%${query.trim()}%`;
    q = q.or(
      `first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},username.ilike.${term},company_name.ilike.${term},role_title.ilike.${term}`,
    );
  } else {
    q = q.order("created_at", { ascending: false } as any);
  }
  const { data, error } = await q;
  if (error) throw error;
  let list = (data ?? []) as any[];
  if (excludeUserId) list = list.filter((p) => p.id !== excludeUserId);
  return list as ProfileLite[];
}

async function attachOtherProfiles(rows: any[], me: string) {
  const ids = rows.map((r) => (r.requester_id === me ? r.addressee_id : r.requester_id));
  if (ids.length === 0) return rows as Friendship[];
  const { data: profs } = await sb
    .from("profiles" as any)
    .select("id, username, first_name, last_name, email, avatar_url, company_name, role_title, headline")
    .in("id", ids);
  const map = new Map<string, ProfileLite>();
  (profs ?? []).forEach((p: any) => map.set(p.id, p));
  return rows.map((r) => ({
    ...r,
    other: map.get(r.requester_id === me ? r.addressee_id : r.requester_id) ?? null,
  })) as Friendship[];
}

export async function fetchFriends(me: string) {
  const { data, error } = await sb
    .from("friendships" as any)
    .select("*")
    .eq("status", "accepted")
    .or(`requester_id.eq.${me},addressee_id.eq.${me}`);
  if (error) throw error;
  return attachOtherProfiles((data as any[]) ?? [], me);
}

export async function fetchIncomingRequests(me: string) {
  const { data, error } = await sb
    .from("friendships" as any)
    .select("*")
    .eq("status", "pending")
    .eq("addressee_id", me);
  if (error) throw error;
  return attachOtherProfiles((data as any[]) ?? [], me);
}

export async function fetchOutgoingRequests(me: string) {
  const { data, error } = await sb
    .from("friendships" as any)
    .select("*")
    .eq("status", "pending")
    .eq("requester_id", me);
  if (error) throw error;
  return attachOtherProfiles((data as any[]) ?? [], me);
}

export async function sendFriendRequest(toUserId: string) {
  const { data: u } = await supabase.auth.getUser(); if(false){const _=sb;}.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");
  const { error } = await sb
    .from("friendships" as any)
    .insert({ requester_id: u.user.id, addressee_id: toUserId });
  if (error) throw error;
}

export async function respondFriendRequest(friendshipId: string, accept: boolean) {
  const { error } = await sb
    .from("friendships" as any)
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", friendshipId);
  if (error) throw error;
}

export async function removeFriend(friendshipId: string) {
  const { error } = await sb.from("friendships" as any).delete().eq("id", friendshipId);
  if (error) throw error;
}

export async function getFriendshipBetween(me: string, other: string) {
  const { data } = await sb
    .from("friendships" as any)
    .select("*")
    .or(
      `and(requester_id.eq.${me},addressee_id.eq.${other}),and(requester_id.eq.${other},addressee_id.eq.${me})`,
    )
    .maybeSingle();
  return data as any;
}

export async function countConnections(userId: string) {
  const { count } = await sb
    .from("friendships" as any)
    .select("id", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  return count ?? 0;
}
