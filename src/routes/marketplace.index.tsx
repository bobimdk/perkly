import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, Zap, Flame, Clock, Star, Sparkles } from "lucide-react";
import { MarketingNav, MarketingFooter } from "@/components/marketing/marketing-shell";
import { OfferCard } from "@/components/marketplace/offer-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { fetchCategories, fetchOffers, fetchUserFavoriteIds, toggleFavorite, type OfferFilter } from "@/lib/marketplace";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/marketplace/")({
  head: () => ({
    meta: [
      { title: "Marketplace · Perkly" },
      { name: "description", content: "Explore curated employee benefits across wellness, fitness, food, travel and more." },
      { property: "og:title", content: "Perkly marketplace" },
      { property: "og:description", content: "The benefits employees actually want — discover deals across Albania." },
    ],
  }),
  component: MarketplacePage,
});

function MarketplacePage() {
  const { lang, t } = useI18n();
  const { user } = useAuth();
  const [tab, setTab] = useState<OfferFilter["tab"]>("trending");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [filterOpen, setFilterOpen] = useState(false);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [draft, setDraft] = useState({ minPrice: "", maxPrice: "", city: "" });

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const filter: OfferFilter = useMemo(
    () => ({
      tab,
      search: debounced || undefined,
      categorySlug: category,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      city: city || undefined,
    }),
    [tab, debounced, category, minPrice, maxPrice, city],
  );

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const offersQuery = useQuery({
    queryKey: ["offers", filter],
    queryFn: () => fetchOffers(filter),
  });
  const favoritesQuery = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: () => (user ? fetchUserFavoriteIds(user.id) : Promise.resolve(new Set<string>())),
    enabled: !!user,
  });

  const { sponsored, regular } = useMemo(() => {
    const rows = offersQuery.data ?? [];
    const sponsoredRows = rows.filter((o) => o.providers?.is_sponsored);
    const regularRows = rows.filter((o) => !o.providers?.is_sponsored);
    return { sponsored: sponsoredRows, regular: regularRows };
  }, [offersQuery.data]);

  const onFavorite = async (id: string) => {
    if (!user) {
      toast.info(t("mk.signInSave"));
      return;
    }
    const liked = await toggleFavorite(id, user.id);
    toast.success(liked ? t("mk.saved") : t("mk.removedFav"));
    favoritesQuery.refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero */}
      <section className="border-b border-border/60 bg-gradient-to-br from-primary/8 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="font-mono text-[11px] uppercase tracking-widest text-primary">{t("mkt.kicker")}</p>
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-5xl">
            {t("mkt.title.a")} <span className="text-gradient-amber">{t("mkt.title.b")}</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {t("mkt.sub")}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("mkt.search")}
                className="h-12 rounded-xl pl-10 text-sm shadow-sm"
              />
            </div>
            <Sheet
              open={filterOpen}
              onOpenChange={(o) => {
                setFilterOpen(o);
                if (o) setDraft({ minPrice, maxPrice, city });
              }}
            >
              <SheetTrigger asChild>
                <Button variant="outline" className="h-12 rounded-xl shadow-sm">
                  <SlidersHorizontal className="mr-2 h-4 w-4" /> {t("mkt.filters")}
                  {(minPrice || maxPrice || city) && (
                    <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">●</span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>{t("mkt.filters")}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Min (ALL)</Label>
                      <Input type="number" min={0} value={draft.minPrice}
                        onChange={(e) => setDraft({ ...draft, minPrice: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Max (ALL)</Label>
                      <Input type="number" min={0} value={draft.maxPrice}
                        onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{lang === "sq" ? "Qyteti" : "City"}</Label>
                    <Input value={draft.city} placeholder={lang === "sq" ? "p.sh. Tiranë" : "e.g. Tirana"}
                      onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
                  </div>
                </div>
                <SheetFooter className="mt-6 flex-row justify-between gap-2 sm:justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setDraft({ minPrice: "", maxPrice: "", city: "" });
                      setMinPrice("");
                      setMaxPrice("");
                      setCity("");
                      setFilterOpen(false);
                    }}
                  >
                    {lang === "sq" ? "Pastro" : "Clear"}
                  </Button>
                  <Button
                    onClick={() => {
                      setMinPrice(draft.minPrice);
                      setMaxPrice(draft.maxPrice);
                      setCity(draft.city);
                      setFilterOpen(false);
                    }}
                  >
                    {lang === "sq" ? "Apliko" : "Apply"}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          {/* Categories */}
          <div className="mt-6 flex flex-wrap gap-2">
            <CategoryPill active={!category} onClick={() => setCategory(undefined)}>{t("mkt.all")}</CategoryPill>
            {(categoriesQuery.data ?? []).map((c) => (
              <CategoryPill key={c.id} active={category === c.slug} onClick={() => setCategory(c.slug)}>
                {lang === "sq" ? c.name_sq : c.name_en}
              </CategoryPill>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsored section */}
      {sponsored.length > 0 && !offersQuery.isLoading ? (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="font-display text-xl font-bold">{t("mkt.sponsored.title")}</h2>
            <span className="text-sm text-muted-foreground">— {t("mkt.sponsored.sub")}</span>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sponsored.map((o) => (
              <OfferCard
                key={o.id}
                offer={o}
                isFavorite={favoritesQuery.data?.has(o.id)}
                onToggleFavorite={onFavorite}
                highlighted
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Tabs + grid */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as OfferFilter["tab"])}>
          <TabsList className="h-11 rounded-xl bg-muted/60 p-1">
            <TabsTrigger value="trending" className="rounded-lg px-4"><Flame className="mr-1.5 h-3.5 w-3.5" /> {t("mkt.tab.trending")}</TabsTrigger>
            <TabsTrigger value="new" className="rounded-lg px-4"><Zap className="mr-1.5 h-3.5 w-3.5" /> {t("mkt.tab.new")}</TabsTrigger>
            <TabsTrigger value="recommended" className="rounded-lg px-4"><Star className="mr-1.5 h-3.5 w-3.5" /> {t("mkt.tab.recommended")}</TabsTrigger>
            <TabsTrigger value="limited" className="rounded-lg px-4"><Clock className="mr-1.5 h-3.5 w-3.5" /> {t("mkt.tab.limited")}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {offersQuery.isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[360px] rounded-2xl" />)
            : regular.map((o) => (
                <OfferCard
                  key={o.id}
                  offer={o}
                  isFavorite={favoritesQuery.data?.has(o.id)}
                  onToggleFavorite={onFavorite}
                />
              ))}
        </div>

        {!offersQuery.isLoading && regular.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <p className="font-display text-lg font-semibold">{t("mkt.empty.title")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("mkt.empty.sub")}</p>
          </div>
        ) : null}
      </section>

      <MarketingFooter />
    </div>
  );
}

function CategoryPill({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
