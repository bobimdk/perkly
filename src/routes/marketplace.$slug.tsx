import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Heart, MapPin, Star, Clock, Users, CheckCircle2, ShoppingBag } from "lucide-react";
import { MarketingNav, MarketingFooter } from "@/components/marketing/marketing-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchOfferBySlug, fetchOfferImages, fetchReviewsForOffer, toggleFavorite, fetchUserFavoriteIds } from "@/lib/marketplace";
import { addOfferToDraft } from "@/lib/perkly";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/marketplace/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} · Perkly` },
      { property: "og:title", content: `${params.slug} on Perkly` },
    ],
  }),
  component: OfferDetailPage,
});

function OfferDetailPage() {
  const { slug } = Route.useParams();
  const { formatPrice, lang } = useI18n();
  const { user } = useAuth();
  const [activeImg, setActiveImg] = useState(0);

  const offerQuery = useQuery({ queryKey: ["offer", slug], queryFn: () => fetchOfferBySlug(slug) });
  const imagesQuery = useQuery({
    queryKey: ["offer-images", offerQuery.data?.id],
    queryFn: () => fetchOfferImages(offerQuery.data!.id),
    enabled: !!offerQuery.data?.id,
  });
  const reviewsQuery = useQuery({
    queryKey: ["offer-reviews", offerQuery.data?.id],
    queryFn: () => fetchReviewsForOffer(offerQuery.data!.id),
    enabled: !!offerQuery.data?.id,
  });
  const favoritesQuery = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: () => (user ? fetchUserFavoriteIds(user.id) : Promise.resolve(new Set<string>())),
    enabled: !!user,
  });

  if (offerQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MarketingNav />
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <Skeleton className="h-[420px] rounded-3xl" />
          <Skeleton className="mt-6 h-12 w-2/3" />
        </div>
      </div>
    );
  }

  const offer = offerQuery.data;
  if (!offer) throw notFound();

  const images = imagesQuery.data ?? [];
  const cover = images[activeImg]?.url ?? offer.cover_url;
  const isFav = favoritesQuery.data?.has(offer.id);
  const categoryName = offer.categories ? (lang === "sq" ? offer.categories.name_sq : offer.categories.name_en) : null;

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to marketplace
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          {/* Left: media + content */}
          <div>
            <div className="overflow-hidden rounded-3xl bg-muted">
              {cover ? (
                <img src={cover} alt={offer.title} className="aspect-[16/10] w-full object-cover" />
              ) : null}
            </div>
            {images.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                      activeImg === i ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-2">
                {categoryName ? (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{categoryName}</span>
                ) : null}
                {offer.is_limited_time ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                    <Clock className="h-3 w-3" /> Limited time
                  </span>
                ) : null}
              </div>
              <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{offer.title}</h1>
              {offer.subtitle ? <p className="mt-2 text-base text-muted-foreground">{offer.subtitle}</p> : null}

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {offer.city ? (
                  <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {offer.city}</span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  {offer.rating_avg ? offer.rating_avg.toFixed(1) : "New"} · {offer.rating_count} reviews
                </span>
                {offer.remaining != null ? (
                  <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> {offer.remaining} spots left</span>
                ) : null}
              </div>

              <div className="mt-8 space-y-4">
                <h2 className="font-display text-xl font-semibold">About this perk</h2>
                <p className="leading-relaxed text-foreground/80">{offer.description}</p>
              </div>

              {/* Reviews */}
              <div className="mt-12">
                <h2 className="font-display text-xl font-semibold">Reviews</h2>
                {reviewsQuery.isLoading ? (
                  <Skeleton className="mt-4 h-24 rounded-xl" />
                ) : (reviewsQuery.data ?? []).length === 0 ? (
                  <p className="mt-4 rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
                    No reviews yet. Be the first to share your experience after you redeem this perk.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {(reviewsQuery.data ?? []).map((r) => (
                      <li key={r.id} className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-warning text-warning" : "text-muted"}`} />
                          ))}
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {r.comment ? <p className="mt-2 text-sm text-foreground/80">{r.comment}</p> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Right: sticky purchase card */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-end justify-between">
                <div>
                  {offer.original_price_all && offer.original_price_all > offer.price_all ? (
                    <p className="text-sm text-muted-foreground line-through">{formatPrice(offer.original_price_all)}</p>
                  ) : null}
                  <p className="font-display text-3xl font-bold text-primary">{formatPrice(offer.price_all)}</p>
                </div>
                {offer.discount_percent && offer.discount_percent > 0 ? (
                  <span className="rounded-full bg-success px-3 py-1 text-sm font-bold text-success-foreground">
                    -{offer.discount_percent}%
                  </span>
                ) : null}
              </div>

              <Button
                size="lg"
                className="mt-6 w-full rounded-xl shadow-sm"
                onClick={async () => {
                  if (!user) return toast.info("Sign in to build your package");
                  try {
                    await addOfferToDraft(user.id, { id: offer.id, provider_id: offer.provider_id, price_all: Number(offer.price_all) });
                    toast.success("Added to your package");
                    import("@/lib/gamification").then((m) => m.progressQuest(user.id, "daily_add_item").catch(() => {}));
                  } catch (e) { toast.error((e as Error).message); }
                }}
              >
                <ShoppingBag className="mr-2 h-4 w-4" /> Add to my package
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="mt-3 w-full rounded-xl"
                onClick={async () => {
                  if (!user) return toast.info("Sign in to save offers");
                  const liked = await toggleFavorite(offer.id, user.id);
                  toast.success(liked ? "Saved" : "Removed from favorites");
                  favoritesQuery.refetch();
                }}
              >
                <Heart className={`mr-2 h-4 w-4 ${isFav ? "fill-destructive text-destructive" : ""}`} />
                {isFav ? "Saved" : "Save for later"}
              </Button>

              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-success" /> Instant approval via your employer's rules</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-success" /> No upfront cost — paid from your monthly budget</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-success" /> Confirmation by email and in-app</li>
              </ul>
            </div>

            {offer.providers ? (
              <div className="mt-4 rounded-3xl border border-border bg-card p-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Provider</p>
                <div className="mt-2 flex items-center gap-3">
                  {offer.providers.logo_url ? (
                    <img src={offer.providers.logo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : null}
                  <div>
                    <p className="font-display text-base font-semibold">{offer.providers.name}</p>
                    {offer.providers.city ? <p className="text-xs text-muted-foreground">{offer.providers.city}</p> : null}
                  </div>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
