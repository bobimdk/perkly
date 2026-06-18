import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listDrops } from "@/lib/phase5";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/drops/")({
  component: DropsIndex,
});

function DropsIndex() {
  const q = useQuery({ queryKey: ["drops"], queryFn: listDrops });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Limited time</p>
      <h1 className="mt-1 font-display text-4xl font-bold sm:text-5xl">Seasonal Drops</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Curated collections of perks that match the moment — only available for a limited window.
      </p>

      {q.isLoading ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {(q.data ?? []).map((d) => {
            const days = Math.max(0, Math.ceil((new Date(d.ends_at).getTime() - Date.now()) / 86400000));
            return (
              <Link
                key={d.id}
                to="/drops/$slug"
                params={{ slug: d.slug }}
                className="group relative overflow-hidden rounded-3xl border border-border shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-64">
                  {d.cover_image ? (
                    <img src={d.cover_image} alt={d.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full" style={{ background: d.theme_color ?? "#f59e0b" }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-foreground">
                    {days}d left
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="font-display text-2xl font-bold">{d.title}</h3>
                    <p className="mt-1 text-sm opacity-90">{d.subtitle}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
