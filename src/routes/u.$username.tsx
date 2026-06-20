import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, UserPlus, UserCheck, Mail, Briefcase, Loader2, Clock, Gift, Pencil, GraduationCap, Sparkles, Heart, Languages, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MarketingNav, MarketingFooter } from "@/components/marketing/marketing-shell";
import {
  fetchProfileByUsername,
  fetchProfileById,
  countConnections,
  getFriendshipBetween,
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
  sendGift,
  fetchExperiences,
  fetchEducation,
  fetchMutualConnections,
  fetchGiftsReceived,
  fetchActivity,
} from "@/lib/phase5";

import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/u/$username")({
  component: ProfilePage,
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const { formatPrice } = useI18n();
  const qc = useQueryClient();

  const profileQ = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      // Accept either a username or a UUID slug
      if (UUID_RE.test(username)) {
        const byId = await fetchProfileById(username);
        if (byId) return byId;
      }
      const byName = await fetchProfileByUsername(username);
      if (byName) return byName;
      // Fallback: try id even if not matching uuid format
      try { return await fetchProfileById(username); } catch { return null; }
    },
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

  const experiencesQ = useQuery({
    queryKey: ["experiences", profile?.id],
    queryFn: () => fetchExperiences(profile!.id),
    enabled: !!profile,
  });
  const educationQ = useQuery({
    queryKey: ["education", profile?.id],
    queryFn: () => fetchEducation(profile!.id),
    enabled: !!profile,
  });
  const mutualsQ = useQuery({
    queryKey: ["mutuals", user?.id, profile?.id],
    queryFn: () => fetchMutualConnections(user!.id, profile!.id),
    enabled: !!user && !!profile && user?.id !== profile.id,
  });
  const giftsQ = useQuery({
    queryKey: ["gifts-received", profile?.id],
    queryFn: () => fetchGiftsReceived(profile!.id, 6),
    enabled: !!profile,
  });
  const activityQ = useQuery({
    queryKey: ["activity", profile?.id],
    queryFn: () => fetchActivity(profile!.id, 10),
    enabled: !!profile,
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
    try { await sendFriendRequest(profile.id); toast.success("Request sent"); refresh(); }
    catch (e: any) { toast.error(e.message); }
  };
  const accept = async () => { if (!fs) return; await respondFriendRequest(fs.id, true); toast.success("Accepted"); refresh(); };
  const decline = async () => { if (!fs) return; await respondFriendRequest(fs.id, false); refresh(); };
  const unfriend = async () => { if (!fs) return; await removeFriend(fs.id); refresh(); };

  // Gift state
  const [giftOpen, setGiftOpen] = useState(false);
  const [amount, setAmount] = useState("1000");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const sendMoney = async () => {
    if (!profile) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setSending(true);
    try {
      await sendGift(profile.id, amt, message);
      toast.success(`Sent ${formatPrice(amt)} to ${profile.first_name ?? profile.username ?? "your friend"}!`);
      setGiftOpen(false);
      setMessage("");
      setAmount("1000");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

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
          <h1 className="font-display text-2xl font-bold">Profile not found</h1>
          <Link to="/network" className="mt-4 inline-block text-primary underline">Search the network</Link>
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
          <div
            className="relative h-40 sm:h-56"
            style={{
              background: profile.cover_url
                ? `url(${profile.cover_url}) center/cover`
                : "linear-gradient(135deg, hsl(var(--primary) / 0.35), hsl(var(--primary-glow) / 0.25))",
            }}
          />
          <div className="relative px-4 pb-6 sm:px-8">
            <div className="-mt-20 grid h-36 w-36 place-items-center rounded-full border-4 border-card bg-gradient-to-br from-primary to-primary-glow font-display text-5xl font-bold text-primary-foreground shadow-lg sm:h-44 sm:w-44">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={fullName} className="h-full w-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>

            <div className="mt-4 grid gap-6 sm:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-bold sm:text-3xl">{fullName}</h1>
                {profile.headline || profile.role_title ? (
                  <p className="mt-1 text-base text-foreground">
                    {profile.headline || `${profile.role_title}${profile.company_name ? ` at ${profile.company_name}` : ""}`}
                  </p>
                ) : null}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {profile.location ? (
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.location}</span>
                  ) : null}
                  {profile.email && (isOwn || status === "accepted") ? (
                    <>
                      <span aria-hidden>·</span>
                      <a href={`mailto:${profile.email}`} className="font-semibold text-primary hover:underline">Contact info</a>
                    </>
                  ) : null}
                </div>
                <Link to="/network" className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
                  {connQ.data ?? 0} {(connQ.data ?? 0) === 1 ? "connection" : "connections"}
                </Link>

                <div className="mt-4 flex flex-wrap gap-2">
                  {isOwn ? (
                    <Button asChild variant="outline" size="sm" className="rounded-full">
                      <Link to="/settings/profile"><Pencil className="mr-2 h-4 w-4" /> Edit profile</Link>
                    </Button>
                  ) : !user ? (
                    <Button asChild size="sm" className="rounded-full"><Link to="/auth">Sign in to connect</Link></Button>
                  ) : status === "none" ? (
                    <Button size="sm" className="rounded-full" onClick={connect}><UserPlus className="mr-2 h-4 w-4" /> Connect</Button>
                  ) : status === "pending_out" ? (
                    <Button size="sm" variant="outline" className="rounded-full" disabled><Clock className="mr-2 h-4 w-4" /> Pending</Button>
                  ) : status === "pending_in" ? (
                    <>
                      <Button size="sm" className="rounded-full" onClick={accept}><UserCheck className="mr-2 h-4 w-4" /> Accept</Button>
                      <Button size="sm" variant="outline" className="rounded-full" onClick={decline}>Decline</Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" className="rounded-full" onClick={() => setGiftOpen(true)}>
                        <Gift className="mr-2 h-4 w-4" /> Send money
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-full" onClick={unfriend}>Remove connection</Button>
                    </>
                  )}
                </div>
              </div>

              {profile.company_name ? (
                <div className="flex items-center gap-2 self-start rounded-lg border border-border bg-background px-3 py-2">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded bg-muted">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">{profile.company_name}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            {profile.bio ? (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-display text-lg font-semibold">About</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-foreground">{profile.bio}</p>
              </section>
            ) : null}

            {(experiencesQ.data?.length ?? 0) > 0 ? (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-display text-lg font-semibold">Experience</h2>
                <ul className="mt-3 space-y-4">
                  {experiencesQ.data!.map((x) => (
                    <li key={x.id} className="flex gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-muted"><Briefcase className="h-5 w-5 text-muted-foreground" /></div>
                      <div className="min-w-0">
                        <p className="font-semibold leading-tight">{x.title}</p>
                        {x.company ? <p className="text-sm text-muted-foreground">{x.company}{x.location ? ` · ${x.location}` : ""}</p> : null}
                        <p className="text-xs text-muted-foreground">{[x.start_date, x.end_date || "Present"].filter(Boolean).join(" — ")}</p>
                        {x.description ? <p className="mt-1 text-sm">{x.description}</p> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {(educationQ.data?.length ?? 0) > 0 ? (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-display text-lg font-semibold">Education</h2>
                <ul className="mt-3 space-y-4">
                  {educationQ.data!.map((x) => (
                    <li key={x.id} className="flex gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-muted"><GraduationCap className="h-5 w-5 text-muted-foreground" /></div>
                      <div className="min-w-0">
                        <p className="font-semibold leading-tight">{x.school}</p>
                        {(x.degree || x.field) ? <p className="text-sm text-muted-foreground">{[x.degree, x.field].filter(Boolean).join(", ")}</p> : null}
                        {(x.start_year || x.end_year) ? <p className="text-xs text-muted-foreground">{x.start_year ?? "?"} — {x.end_year ?? "Present"}</p> : null}
                        {x.description ? <p className="mt-1 text-sm">{x.description}</p> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {(profile.skills?.length || profile.interests?.length || profile.languages?.length) ? (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-display text-lg font-semibold">Skills & Interests</h2>
                {profile.skills?.length ? (
                  <div className="mt-3">
                    <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><Sparkles className="h-3 w-3" /> Skills</p>
                    <div className="flex flex-wrap gap-1.5">{profile.skills.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
                  </div>
                ) : null}
                {profile.interests?.length ? (
                  <div className="mt-3">
                    <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><Heart className="h-3 w-3" /> Interests</p>
                    <div className="flex flex-wrap gap-1.5">{profile.interests.map((s: string) => <Badge key={s} variant="outline">{s}</Badge>)}</div>
                  </div>
                ) : null}
                {profile.languages?.length ? (
                  <div className="mt-3">
                    <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><Languages className="h-3 w-3" /> Languages</p>
                    <div className="flex flex-wrap gap-1.5">{profile.languages.map((s: string) => <Badge key={s} variant="outline">{s}</Badge>)}</div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {(activityQ.data?.length ?? 0) > 0 ? (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-display text-lg font-semibold">Recent activity</h2>
                <ul className="mt-3 space-y-3">
                  {activityQ.data!.map((a, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <p className="font-medium">{a.title}</p>
                        {a.detail ? <p className="text-xs text-muted-foreground">{a.detail}</p> : null}
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{new Date(a.at).toLocaleDateString()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display text-lg font-semibold">Details</h2>
              <div className="mt-3 space-y-2 text-sm">
                {profile.company_name ? (
                  <p className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" /> {profile.company_name}</p>
                ) : null}
                {profile.role_title ? <p className="text-muted-foreground">{profile.role_title}</p> : null}
                {profile.email && (isOwn || status === "accepted") ? (
                  <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {profile.email}</p>
                ) : null}
              </div>
            </section>

            {!isOwn && user && (mutualsQ.data?.count ?? 0) > 0 ? (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Users className="h-4 w-4" /> Mutual connections</h2>
                <p className="mt-1 text-sm text-muted-foreground">{mutualsQ.data!.count} shared</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {mutualsQ.data!.sample.map((m) => (
                    <Link key={m.id} to="/u/$username" params={{ username: m.username || m.id }} className="group flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1 text-xs hover:bg-muted">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-[10px] font-bold text-primary-foreground">
                        {(m.first_name?.[0] ?? m.username?.[0] ?? "?").toUpperCase()}
                      </span>
                      <span className="max-w-[8rem] truncate group-hover:underline">{m.first_name || m.username}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {(giftsQ.data?.length ?? 0) > 0 ? (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Gift className="h-4 w-4" /> Gifts received</h2>
                <ul className="mt-3 space-y-3">
                  {giftsQ.data!.map((g) => (
                    <li key={g.id} className="rounded-lg border border-border bg-background p-2.5">
                      <p className="text-sm font-semibold">{formatPrice(Number(g.amount_all))} <span className="font-normal text-muted-foreground">from {g.sender?.first_name || g.sender?.username || "a friend"}</span></p>
                      {g.message ? <p className="mt-0.5 text-xs italic text-muted-foreground">“{g.message}”</p> : null}
                      <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">{new Date(g.created_at).toLocaleDateString()}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </aside>
        </div>
      </main>

      <Dialog open={giftOpen} onOpenChange={setGiftOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send money to {fullName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Amount (ALL)</label>
              <Input type="number" min={100} step={100} value={amount} onChange={(e) => setAmount(e.target.value)} />
              <p className="mt-1 text-xs text-muted-foreground">{formatPrice(Number(amount) || 0)} will be transferred from your budget.</p>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Message</label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Happy birthday! 🎂" rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setGiftOpen(false)}>Cancel</Button>
              <Button onClick={sendMoney} disabled={sending || !amount || Number(amount) <= 0}>
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
                Send gift
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <MarketingFooter />
    </div>
  );
}
