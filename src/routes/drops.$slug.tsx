import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock } from "lucide-react";
import { getDropBySlug } from "@/lib/phase5";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/drops/$slug")({
  component: DropDetail,
});

function DropDetail() {
  const { slug } = Route.useParams();
  const { formatPrice } = useI18n();
  const dropQ = useQuery({ queryKey: ["drop", slug], queryFn: () => getDropBySlug(slug) });
  const drop = dropQ.data;

  const offersQ = useQuery({
    queryKey: ["drop-offers", drop?.id],
    queryFn: async () => {
      const ids = drop?.featured_offer_ids ?? [];
      if (ids.length === 0) {
        // Fallback: show 6 random published
        const { data } = await supabase
          .from("offers")
          .select("id, title, slug, cover_url, price_all, city, providers(name)")
          .eq("status", "published")
          .limit(6);
        return data ?? [];
      }
      const { data } = await supabase
        .from("offers")
        .select("id, title, slug, cover_url, price_all, city, providers(name)")
        .in("id", ids);
      return data ?? [];
    },
    enabled: !!drop,
  });

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  if (dropQ.isLoading) {
    return <Skeleton className="mx-auto my-12 h-96 max-w-5xl rounded-3xl" />;
  }
  if (!drop) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Drop not found</h1>
      </div>
    );
  }

  const ms = Math.max(0, new Date(drop.ends_at).getTime() - Date.now());
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  const secs = Math.floor((ms % 60000) / 1000);

  return (
    <div>
      <div
        className="relative overflow-hidden border-b border-border"
        style={{ background: `linear-gradient(135deg, ${drop.theme_color ?? "#f59e0b"}22, transparent)` }}
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <Link to="/drops" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All drops
          </Link>
          <p className="mt-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">Seasonal drop</p>
          <h1 className="mt-2 font-display text-5xl font-bold">{drop.title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{drop.subtitle}</p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 font-mono text-sm" data-tick={tick}>
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-bold">{days}d {hours.toString().padStart(2, "0")}h {mins.toString().padStart(2, "0")}m {secs.toString().padStart(2, "0")}s</span>
            <span className="text-muted-foreground">left</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl font-bold">Featured perks</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(offersQ.data ?? []).map((o: any) => (
            <Link
              key={o.id}
              to="/marketplace/$slug"
              params={{ slug: o.slug }}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="h-44 overflow-hidden bg-muted">
                {o.cover_url && (
                  <img src={o.cover_url} alt={o.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                )}
              </div>
              <div className="p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{o.providers?.name}</p>
                <h3 className="mt-1 font-display text-base font-semibold">{o.title}</h3>
                <p className="mt-2 font-display text-lg font-bold text-primary">{formatPrice(Number(o.price_all))}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
