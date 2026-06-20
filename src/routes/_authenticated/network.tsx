import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, UserCheck, X, Loader2, Briefcase, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useAuth } from "@/lib/auth-context";
import {
  searchProfiles,
  fetchFriends,
  fetchIncomingRequests,
  fetchOutgoingRequests,
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
  type ProfileLite,
} from "@/lib/phase5";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/network")({
  component: NetworkPage,
});

function NetworkPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");

  const friendsQ = useQuery({
    queryKey: ["friends", user?.id],
    queryFn: () => fetchFriends(user!.id),
    enabled: !!user,
  });
  const incomingQ = useQuery({
    queryKey: ["friends-incoming", user?.id],
    queryFn: () => fetchIncomingRequests(user!.id),
    enabled: !!user,
  });
  const outgoingQ = useQuery({
    queryKey: ["friends-outgoing", user?.id],
    queryFn: () => fetchOutgoingRequests(user!.id),
    enabled: !!user,
  });
  const searchQ = useQuery({
    queryKey: ["profiles-search", query, user?.id],
    queryFn: () => searchProfiles(query, user!.id),
    enabled: !!user,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["friends"] });
    qc.invalidateQueries({ queryKey: ["friends-incoming"] });
    qc.invalidateQueries({ queryKey: ["friends-outgoing"] });
  };

  const pendingIds = new Set([
    ...(outgoingQ.data ?? []).map((f) => f.other?.id),
    ...(incomingQ.data ?? []).map((f) => f.other?.id),
  ]);
  const friendIds = new Set((friendsQ.data ?? []).map((f) => f.other?.id));

  const connect = async (p: ProfileLite) => {
    try { await sendFriendRequest(p.id); toast.success(`Kërkesa u dërgua ${p.first_name ?? p.username}`); refresh(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <DashboardShell title="Rrjeti im">
      <Tabs defaultValue="discover" className="space-y-6">
        <TabsList>
          <TabsTrigger value="discover">
            <Search className="mr-2 h-4 w-4" /> Zbulo
          </TabsTrigger>
          <TabsTrigger value="friends">
            <Users className="mr-2 h-4 w-4" /> Shokët ({friendsQ.data?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="requests">
            <UserPlus className="mr-2 h-4 w-4" /> Kërkesa ({incomingQ.data?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Kërko emër, kompani, role…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {searchQ.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(searchQ.data ?? []).map((p) => (
                <PersonCard
                  key={p.id}
                  p={p}
                  action={
                    friendIds.has(p.id) ? (
                      <Button size="sm" variant="outline" disabled><UserCheck className="mr-2 h-4 w-4" />Shokë</Button>
                    ) : pendingIds.has(p.id) ? (
                      <Button size="sm" variant="outline" disabled>Pritet</Button>
                    ) : (
                      <Button size="sm" onClick={() => connect(p)}><UserPlus className="mr-2 h-4 w-4" /> Lidhu</Button>
                    )
                  }
                />
              ))}
              {searchQ.data && searchQ.data.length === 0 ? (
                <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Nuk u gjet asnjë rezultat.</p>
              ) : null}
            </div>
          )}
        </TabsContent>

        <TabsContent value="friends" className="space-y-4">
          {friendsQ.data && friendsQ.data.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Ende nuk keni shokë. Filloni nga skeda "Zbulo".</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(friendsQ.data ?? []).map((f) =>
                f.other ? (
                  <PersonCard
                    key={f.id}
                    p={f.other}
                    action={
                      <Button size="sm" variant="ghost" onClick={async () => { await removeFriend(f.id); refresh(); }}>
                        <X className="mr-2 h-4 w-4" /> Hiq
                      </Button>
                    }
                  />
                ) : null,
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <section>
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Kërkesa hyrëse
            </h3>
            {incomingQ.data && incomingQ.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">Asnjë kërkesë.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(incomingQ.data ?? []).map((f) =>
                  f.other ? (
                    <PersonCard
                      key={f.id}
                      p={f.other}
                      action={
                        <div className="flex gap-2">
                          <Button size="sm" onClick={async () => { await respondFriendRequest(f.id, true); refresh(); }}>
                            Prano
                          </Button>
                          <Button size="sm" variant="outline" onClick={async () => { await respondFriendRequest(f.id, false); refresh(); }}>
                            Refuzo
                          </Button>
                        </div>
                      }
                    />
                  ) : null,
                )}
              </div>
            )}
          </section>
          {outgoingQ.data && outgoingQ.data.length > 0 ? (
            <section>
              <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Kërkesa dalëse
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {outgoingQ.data.map((f) =>
                  f.other ? (
                    <PersonCard
                      key={f.id}
                      p={f.other}
                      action={
                        <Button size="sm" variant="ghost" onClick={async () => { await removeFriend(f.id); refresh(); }}>
                          Anulo
                        </Button>
                      }
                    />
                  ) : null,
                )}
              </div>
            </section>
          ) : null}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function PersonCard({ p, action }: { p: ProfileLite; action: React.ReactNode }) {
  const initials = (p.first_name?.[0] ?? p.username?.[0] ?? "U").toUpperCase();
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <Link
        to="/u/$username"
        params={{ username: p.username ?? "" }}
        className="flex items-center gap-3 group"
      >
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow font-display text-base font-bold text-primary-foreground">
          {p.avatar_url ? (
            <img src={p.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold group-hover:underline">
            {p.first_name} {p.last_name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {p.headline || p.role_title || p.email}
          </p>
          {p.company_name ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Briefcase className="h-3 w-3" /> {p.company_name}
            </p>
          ) : null}
        </div>
      </Link>
      <div className="flex justify-end">{action}</div>
    </div>
  );
}
