import { supabase } from "@/integrations/supabase/client";

export type OfferRow = {
  id: string;
  provider_id: string;
  category_id: string | null;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  price_all: number;
  price_eur: number;
  original_price_all: number | null;
  discount_percent: number | null;
  capacity: number | null;
  remaining: number | null;
  available_from: string | null;
  available_to: string | null;
  is_limited_time: boolean;
  is_featured: boolean;
  is_trending: boolean;
  status: "draft" | "pending" | "published" | "archived" | "rejected";
  cover_url: string | null;
  city: string | null;
  rating_avg: number;
  rating_count: number;
  views_count: number;
  favorites_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  providers?: { id: string; name: string; slug: string; logo_url: string | null; rating_avg: number; city: string | null; is_sponsored?: boolean | null } | null;
  categories?: { id: string; slug: string; name_sq: string; name_en: string; icon: string | null } | null;
};

export type Category = {
  id: string; slug: string; name_sq: string; name_en: string; icon: string | null; sort_order: number;
};

export type ProviderRow = {
  id: string; owner_id: string | null; slug: string; name: string; tagline: string | null;
  description: string | null; logo_url: string | null; cover_url: string | null; website: string | null;
  email: string | null; phone: string | null; city: string | null; address: string | null;
  lat: number | null; lng: number | null;
  status: "pending" | "active" | "suspended";
  rating_avg: number; rating_count: number; created_at: string; updated_at: string;
};

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,slug,name_sq,name_en,icon,sort_order")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export type OfferFilter = {
  tab?: "trending" | "new" | "recommended" | "limited";
  search?: string;
  categorySlug?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
};

export async function fetchOffers(filter: OfferFilter = {}): Promise<OfferRow[]> {
  let q = supabase
    .from("offers")
    .select("*, providers(id,name,slug,logo_url,rating_avg,city,is_sponsored), categories(id,slug,name_sq,name_en,icon)")
    .eq("status", "published");

  if (filter.search) q = q.ilike("title", `%${filter.search}%`);
  if (filter.city) q = q.eq("city", filter.city);
  if (filter.minPrice != null) q = q.gte("price_all", filter.minPrice);
  if (filter.maxPrice != null) q = q.lte("price_all", filter.maxPrice);

  if (filter.tab === "trending") q = q.eq("is_trending", true).order("favorites_count", { ascending: false });
  else if (filter.tab === "new") q = q.order("published_at", { ascending: false });
  else if (filter.tab === "limited") q = q.eq("is_limited_time", true).order("remaining", { ascending: true });
  else if (filter.tab === "recommended") q = q.eq("is_featured", true).order("rating_avg", { ascending: false });
  else q = q.order("published_at", { ascending: false });

  q = q.limit(60);

  const { data, error } = await q;
  if (error) throw error;

  let rows = (data ?? []) as unknown as OfferRow[];
  if (filter.categorySlug) {
    rows = rows.filter((r) => r.categories?.slug === filter.categorySlug);
  }
  return rows;
}

export async function fetchOfferBySlug(slug: string): Promise<OfferRow | null> {
  const { data, error } = await supabase
    .from("offers")
    .select("*, providers(id,name,slug,logo_url,rating_avg,city,is_sponsored), categories(id,slug,name_sq,name_en,icon)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as OfferRow | null;
}

export async function fetchOfferImages(offerId: string) {
  const { data, error } = await supabase
    .from("offer_images")
    .select("id,url,alt,sort_order")
    .eq("offer_id", offerId)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function fetchReviewsForOffer(offerId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id,user_id,rating,comment,created_at")
    .eq("offer_id", offerId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function toggleFavorite(offerId: string, userId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("offer_id", offerId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
    return false;
  }
  await supabase.from("favorites").insert({ offer_id: offerId, user_id: userId });
  return true;
}

export async function fetchUserFavoriteIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase.from("favorites").select("offer_id").eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.offer_id));
}

export async function fetchMyProviders(userId: string): Promise<ProviderRow[]> {
  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProviderRow[];
}

export async function fetchProviderOffers(providerId: string): Promise<OfferRow[]> {
  const { data, error } = await supabase
    .from("offers")
    .select("*, categories(id,slug,name_sq,name_en,icon)")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OfferRow[];
}

export async function fetchPendingOffers(): Promise<OfferRow[]> {
  const { data, error } = await supabase
    .from("offers")
    .select("*, providers(id,name,slug,logo_url,rating_avg,city,is_sponsored), categories(id,slug,name_sq,name_en,icon)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OfferRow[];
}
