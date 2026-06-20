import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, UserPlus, UserCheck, Mail, Briefcase, Loader2, Clock, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingNav, MarketingFooter } from "@/components/marketing/marketing-shell";
import {
  fetchProfileByUsername,
  countConnections,
  getFriendshipBetween,
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
} from "@/lib/phase5";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/u/$username")({
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const profileQ = useQuery({
    queryKey: ["profile", username],
    queryFn: () => fetchProfileByUsername(username),
  });
  const profile = profileQ.data;

  const connQ = useQuery({
    queryKey: ["connections", profile?.id],
    queryFn: () => countConnections(profile!.id),
    enabled: !!profile,
  });

  const friendshipQ = useQuery({
    queryKey: ["friendship", user?.id, profile?.id],
    queryFn: () => getFriendshipBetween(user!.id, profile!.id),
    enabled: !!user && !!profile && user?.id !== profile.id,
  });

  const isOwn = user?.id === profile?.id;
  const fs = friendshipQ.data;
  const status: "none" | "pending_out" | "pending_in" | "accepted" = !fs
    ? "none"
    : fs.status === "accepted"
      ? "accepted"
      : fs.requester_id === user?.id
        ? "pending_out"
        : "pending_in";

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["friendship"] });
    qc.invalidateQueries({ queryKey: ["connections"] });
  };

  const connect = async () => {
    if (!profile) return;
    try { await sendFriendRequest(profile.id); toast.success("Kërkesa u dërgua"); refresh(); }
    catch (e: any) { toast.error(e.message); }
  };
  const accept = async () => { if (!fs) return; await respondFriendRequest(fs.id, true); toast.success("Pranuar"); refresh(); };
  const decline = async () => { if (!fs) return; await respondFriendRequest(fs.id, false); refresh(); };
  const unfriend = async () => { if (!fs) return; await removeFriend(fs.id); refresh(); };

  if (profileQ.isLoading) {
    return (
      <div className="min-h-screen">
        <MarketingNav />
        <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-24">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <MarketingNav />
        <div className="mx-auto max-w-5xl px-4 py-24 text-center">
          <h1 className="font-display text-2xl font-bold">Profili nuk u gjet</h1>
          <Link to="/network" className="mt-4 inline-block text-primary underline">Kërko në rrjet</Link>
        </div>
      </div>
    );
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.username || "User";
  const initials = (profile.first_name?.[0] ?? profile.username?.[0] ?? "U").toUpperCase();

  return (
    <div className="min-h-screen bg-muted/30">
      <MarketingNav />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Cover */}
          <div
            className="relative h-40 sm:h-56"
            style={{
              background: profile.cover_url
                ? `url(${profile.cover_url}) center/cover`
                : "linear-gradient(135deg, hsl(var(--primary) / 0.25), hsl(var(--primary-glow) / 0.2))",
            }}
          />
          {/* Avatar overlapping */}
          <div className="relative px-4 pb-6 sm:px-8">
            <div className="-mt-16 grid h-28 w-28 place-items-center rounded-full border-4 border-card bg-gradient-to-br from-primary to-primary-glow font-display text-4xl font-bold text-primary-foreground shadow sm:h-32 sm:w-32">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={fullName} className="h-full w-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">{fullName}</h1>
                {profile.headline || profile.role_title ? (
                  <p className="mt-1 text-sm text-foreground">
                    {profile.headline || `${profile.role_title}${profile.company_name ? ` at ${profile.company_name}` : ""}`}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {profile.location ? (
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.location}</span>
                  ) : null}
                  <Link to="/network" className="font-semibold text-primary hover:underline">
                    {connQ.data ?? 0} {(connQ.data ?? 0) === 1 ? "connection" : "connections"}
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {isOwn ? (
                  <Button variant="outline" size="sm" disabled>Profili juaj</Button>
                ) : !user ? (
                  <Button asChild size="sm"><Link to="/auth">Hyni për të lidhur</Link></Button>
                ) : status === "none" ? (
                  <Button size="sm" onClick={connect}><UserPlus className="mr-2 h-4 w-4" /> Lidhu</Button>
                ) : status === "pending_out" ? (
                  <Button size="sm" variant="outline" disabled><Clock className="mr-2 h-4 w-4" /> Pritet</Button>
                ) : status === "pending_in" ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={accept}><UserCheck className="mr-2 h-4 w-4" /> Prano</Button>
                    <Button size="sm" variant="outline" onClick={decline}>Refuzo</Button>
                  </div>
                ) : (
                  <>
                    <Button size="sm" variant="outline"><Gift className="mr-2 h-4 w-4" /> Dhuro</Button>
                    <Button size="sm" variant="ghost" onClick={unfriend}>Hiq lidhjen</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {profile.bio ? (
            <div className="rounded-2xl border border-border bg-card p-5 md:col-span-2">
              <h2 className="font-display text-lg font-semibold">Rreth</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-foreground">{profile.bio}</p>
            </div>
          ) : null}
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Detaje</h2>
            {profile.company_name ? (
              <p className="flex items-center gap-2 text-sm"><Briefcase className="h-4 w-4 text-muted-foreground" /> {profile.company_name}</p>
            ) : null}
            {profile.role_title ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">{profile.role_title}</p>
            ) : null}
            {profile.email && (isOwn || status === "accepted") ? (
              <p className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> {profile.email}</p>
            ) : null}
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
