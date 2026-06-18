import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Users, Send, ArrowLeft, Loader2 } from "lucide-react";
import {
  getCircleBySlug,
  fetchCircleMessages,
  postCircleMessage,
  isCircleMember,
  joinCircle,
  leaveCircle,
  type CircleMessage,
} from "@/lib/phase5";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/circles/$slug")({
  component: CirclePage,
});

function CirclePage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const circleQ = useQuery({ queryKey: ["circle", slug], queryFn: () => getCircleBySlug(slug) });
  const circle = circleQ.data;

  const memberQ = useQuery({
    queryKey: ["circle-member", circle?.id, user?.id],
    queryFn: () => isCircleMember(circle!.id, user!.id),
    enabled: !!circle && !!user,
  });

  const msgsQ = useQuery({
    queryKey: ["circle-msgs", circle?.id],
    queryFn: () => fetchCircleMessages(circle!.id),
    enabled: !!circle && !!memberQ.data,
  });

  useEffect(() => {
    if (!circle?.id || !memberQ.data) return;
    const channel = supabase
      .channel(`circle:${circle.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "circle_messages", filter: `circle_id=eq.${circle.id}` },
        (payload) => {
          qc.setQueryData<CircleMessage[]>(["circle-msgs", circle.id], (old) => [
            ...(old ?? []),
            payload.new as CircleMessage,
          ]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [circle?.id, memberQ.data, qc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgsQ.data?.length]);

  const send = async () => {
    if (!draft.trim() || !circle || !user) return;
    setSending(true);
    try {
      await postCircleMessage(circle.id, user.id, draft.trim());
      setDraft("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const join = async () => {
    if (!circle || !user) return;
    await joinCircle(circle.id, user.id);
    qc.invalidateQueries({ queryKey: ["circle-member"] });
    qc.invalidateQueries({ queryKey: ["circle", slug] });
  };
  const leave = async () => {
    if (!circle || !user) return;
    await leaveCircle(circle.id, user.id);
    qc.invalidateQueries({ queryKey: ["circle-member"] });
    qc.invalidateQueries({ queryKey: ["circle", slug] });
  };

  if (circleQ.isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }
  if (!circle) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Circle not found</h1>
        <Link to="/circles" className="mt-4 inline-block text-primary underline">Back to circles</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link to="/circles" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All circles
      </Link>
      <div
        className="mt-4 overflow-hidden rounded-3xl border border-border p-8"
        style={{ background: `linear-gradient(135deg, ${circle.cover_color}22, transparent)` }}
      >
        <div className="flex items-start gap-4">
          <div className="text-5xl">{circle.icon}</div>
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold">{circle.name}</h1>
            <p className="mt-2 text-muted-foreground">{circle.description}</p>
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <Users className="h-3 w-3" /> {circle.member_count} members
            </div>
          </div>
          {user ? (
            memberQ.data ? (
              <Button variant="outline" size="sm" onClick={leave}>Leave</Button>
            ) : (
              <Button size="sm" onClick={join}>Join circle</Button>
            )
          ) : (
            <Button asChild size="sm"><Link to="/auth">Sign in to join</Link></Button>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 font-display font-semibold">Live chat</div>
        {!user || !memberQ.data ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {user ? "Join the circle to read and post messages." : "Sign in and join to chat."}
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="h-96 overflow-y-auto p-4">
              {(msgsQ.data ?? []).length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">Be the first to say hi 👋</p>
              ) : (
                <ul className="space-y-3">
                  {msgsQ.data!.map((m) => (
                    <li key={m.id} className={m.user_id === user.id ? "flex justify-end" : "flex"}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                          m.user_id === user.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {m.body}
                        <div className="mt-1 text-[10px] opacity-60">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <form
              className="flex items-center gap-2 border-t border-border p-3"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                maxLength={500}
              />
              <Button type="submit" size="icon" disabled={sending || !draft.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
