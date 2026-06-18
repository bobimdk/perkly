import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { listCircles } from "@/lib/phase5";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/circles/")({
  component: CirclesIndex,
});

function CirclesIndex() {
  const q = useQuery({ queryKey: ["circles"], queryFn: listCircles });
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Community</p>
        <h1 className="mt-1 font-display text-4xl font-bold sm:text-5xl">Benefit Circles</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Join interest-based circles, share deals, chat in real time, and unlock group perks together.
        </p>
      </div>
      {q.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(q.data ?? []).map((c) => (
            <Link
              key={c.id}
              to="/circles/$slug"
              params={{ slug: c.slug }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 transition-opacity group-hover:opacity-40"
                style={{ background: c.cover_color ?? "#f59e0b" }}
              />
              <div className="relative">
                <div className="text-4xl">{c.icon}</div>
                <h3 className="mt-4 font-display text-xl font-bold">{c.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {c.member_count} members
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
