import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  getCircleBySlug,
  fetchCircleMessages,
  postCircleMessage,
  postCircleVoiceMessage,
  getVoiceSignedUrl,
  isCircleMember,
  joinCircle,
  leaveCircle,
  type CircleMessage,
} from "@/lib/phase5";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/circles/$slug")({
  component: CirclePage,
});


const AVATAR_COLORS = ["#e36f8a", "#5b87c4", "#c08a2e", "#9b6cd6", "#2ea58a"];
function colorFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initialOf(m: any) {
  const s = m?.sender;
  return ((s?.first_name?.[0] ?? s?.username?.[0] ?? "U") as string).toUpperCase();
}
function nameOf(m: any) {
  const s = m?.sender;
  if (!s) return "User";
  return [s.first_name, s.last_name].filter(Boolean).join(" ") || s.username || "User";
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function FloatHearts({ hearts }: { hearts: { id: number; x: number; y: number }[] }) {
  return (
    <>
      {hearts.map((h) => (
        <span key={h.id} className="bc-fly-heart" style={{ left: h.x, top: h.y }}>
          ❤️
        </span>
      ))}
    </>
  );
}

function ReactionBar() {
  return (
    <div className="bc-reactions">
      {["❤️", "👍", "😂", "🔥"].map((r) => (
        <button key={r} type="button" className="bc-react">{r}</button>
      ))}
    </div>
  );
}

function fmtDur(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function VoiceBubble({ path, durationMs, sent }: { path: string; durationMs: number | null; sent: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const ensureUrl = async () => {
    if (url) return url;
    try {
      const u = await getVoiceSignedUrl(path);
      setUrl(u);
      return u;
    } catch {
      toast.error("Couldn't load voice note");
      return null;
    }
  };

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const u = await ensureUrl();
    if (!u) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(u);
      audioRef.current.addEventListener("ended", () => { setPlaying(false); setProgress(0); });
      audioRef.current.addEventListener("timeupdate", () => {
        const a = audioRef.current!;
        if (a.duration) setProgress(a.currentTime / a.duration);
      });
    }
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { await audioRef.current.play(); setPlaying(true); }
  };

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const bars = 22;
  return (
    <button type="button" onClick={toggle} className={`bc-voice ${sent ? "bc-voice-sent" : "bc-voice-recv"}`}>
      <span className="bc-voice-play">{playing ? "⏸" : "▶"}</span>
      <span className="bc-voice-bars">
        {Array.from({ length: bars }).map((_, i) => (
          <span
            key={i}
            className="bc-voice-bar"
            style={{
              height: `${6 + ((i * 7) % 14)}px`,
              opacity: i / bars <= progress ? 1 : 0.45,
            }}
          />
        ))}
      </span>
      <span className="bc-voice-dur">{fmtDur(durationMs ?? 0)}</span>
    </button>
  );
}

function CirclePage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [joining, setJoining] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);

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

  // Voice recording
  const [recording, setRecording] = useState(false);
  const [recElapsed, setRecElapsed] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const recChunks = useRef<Blob[]>([]);
  const recStartedAt = useRef<number>(0);
  const recTimer = useRef<number | null>(null);

  const startRecording = async () => {
    if (!circle || !user || recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm", "audio/mp4", "audio/ogg"].find((t) =>
        (window as any).MediaRecorder?.isTypeSupported?.(t),
      );
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recChunks.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && recChunks.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recChunks.current, { type: mr.mimeType || "audio/webm" });
        const dur = Date.now() - recStartedAt.current;
        if (recTimer.current) { window.clearInterval(recTimer.current); recTimer.current = null; }
        setRecElapsed(0);
        if (blob.size < 800 || dur < 400) { toast.error("Recording too short"); return; }
        try {
          setSending(true);
          await postCircleVoiceMessage(circle.id, user.id, blob, dur);
        } catch (e: any) {
          toast.error(e.message ?? "Couldn't send voice note");
        } finally {
          setSending(false);
        }
      };
      recRef.current = mr;
      recStartedAt.current = Date.now();
      mr.start();
      setRecording(true);
      recTimer.current = window.setInterval(() => {
        setRecElapsed(Date.now() - recStartedAt.current);
      }, 200) as unknown as number;
    } catch {
      toast.error("Microphone permission denied");
    }
  };

  const stopRecording = (cancel = false) => {
    const mr = recRef.current;
    if (!mr) return;
    if (cancel) {
      mr.ondataavailable = null as any;
      mr.onstop = () => mr.stream.getTracks().forEach((t) => t.stop());
    }
    if (mr.state !== "inactive") mr.stop();
    recRef.current = null;
    setRecording(false);
    if (recTimer.current) { window.clearInterval(recTimer.current); recTimer.current = null; }
    setRecElapsed(0);
  };

  useEffect(() => () => { if (recRef.current?.state === "recording") recRef.current.stop(); }, []);



  const join = async () => {
    if (!circle || !user) return;
    setJoining(true);
    try {
      await joinCircle(circle.id, user.id);
      await qc.invalidateQueries({ queryKey: ["circle-member"] });
      await qc.invalidateQueries({ queryKey: ["circle", slug] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setJoining(false);
    }
  };
  const leave = async () => {
    if (!circle || !user) return;
    await leaveCircle(circle.id, user.id);
    await qc.invalidateQueries({ queryKey: ["circle-member"] });
    await qc.invalidateQueries({ queryKey: ["circle", slug] });
    navigate({ to: "/circles" });
  };

  const popHeart = (e: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const id = Date.now() + Math.random();
    setHearts((h) => [...h, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 1100);
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

  // Pre-join screen
  if (!user || !memberQ.data) {
    return (
      <div className="bc-page">
        <style>{BC_CSS}</style>
        <div className="bc-card-shell" style={{ maxWidth: 720 }}>
          <div className="bc-chat" style={{ borderTop: "none" }}>
            <div ref={wrapRef as any}>
              <Link to="/circles" className="bc-back">← All circles</Link>
              <header className="bc-chat-head" style={{ marginTop: 14 }}>
                <div className="bc-chat-avatar"><span>{circle.icon ?? "✨"}</span></div>
                <div className="bc-chat-meta">
                  <div className="bc-chat-title">{circle.name}</div>
                  <div className="bc-presence"><span className="bc-dot" /> {circle.member_count} members</div>
                </div>
              </header>
              <p className="bc-pre">{circle.description}</p>
              <p className="bc-pre" style={{ color: "#8a7d68", fontSize: 13, marginTop: 4 }}>
                {user ? "Join this circle to read and chat with the community." : "Sign in and join to chat."}
              </p>
              <div style={{ marginTop: 18 }}>
                {user ? (
                  <button type="button" className="bc-join" onClick={join} disabled={joining}>
                    {joining ? "Joining…" : "Join circle"}
                  </button>
                ) : (
                  <Link to="/auth" className="bc-join" style={{ textDecoration: "none", display: "inline-block" }}>
                    Sign in to join
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const msgs = msgsQ.data ?? [];

  return (
    <div className="bc-page">
      <style>{BC_CSS}</style>
      <div className="bc-card-shell" style={{ maxWidth: 860 }}>
        <div ref={wrapRef} className="bc-chat" style={{ borderTop: "none" }}>
          <div style={{ marginBottom: 8 }}>
            <Link to="/circles" className="bc-back">← All circles</Link>
          </div>
          <header className="bc-chat-head">
            <div className="bc-chat-avatar"><span>{circle.icon ?? "✨"}</span></div>
            <div className="bc-chat-meta">
              <div className="bc-chat-title">{circle.name}</div>
              <div className="bc-presence">
                <span className="bc-dot" /> {circle.member_count} members
              </div>
            </div>
            <button type="button" className="bc-leave" onClick={leave}>Leave</button>
          </header>

          <div ref={scrollRef} className="bc-msgs" style={{ maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
            {msgs.length === 0 ? (
              <p style={{ textAlign: "center", color: "#8a7d68", padding: "48px 0", fontSize: 14 }}>
                Bëhu i pari që përshëndet 👋
              </p>
            ) : (
              msgs.map((m: any, idx) => {
                const isMe = m.user_id === user.id;
                if (isMe) {
                  return (
                    <div key={m.id} className="bc-row bc-row-r" style={{ animationDelay: `${Math.min(idx * 0.04, 0.3)}s` }}>
                      <div className="bc-bubble-wrap">
                        <ReactionBar />
                        <div className="bc-bubble bc-bubble-sent" onClick={popHeart}>
                          {m.kind === "voice" && m.audio_url ? (
                            <VoiceBubble path={m.audio_url} durationMs={m.duration_ms} sent />
                          ) : (
                            m.body
                          )}
                          <div className="bc-time bc-time-sent">
                            {fmtTime(m.created_at)}
                            <span className="bc-seen" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                const color = colorFor(m.user_id);
                const username = m.sender?.username as string | undefined;
                return (
                  <div key={m.id} className="bc-row bc-row-l" style={{ animationDelay: `${Math.min(idx * 0.04, 0.3)}s` }}>
                    {username ? (
                      <Link to={"/u/$username" as any} params={{ username } as any} className="bc-mini-av" aria-label={nameOf(m)}>
                        <div className="bc-mini-ring" />
                        {m.sender?.avatar_url ? (
                          <img src={m.sender.avatar_url} alt="" className="bc-mini-img" />
                        ) : (
                          <span className="bc-mini-inner" style={{ color }}>{initialOf(m)}</span>
                        )}
                      </Link>
                    ) : (
                      <div className="bc-mini-av">
                        <div className="bc-mini-ring" />
                        <span className="bc-mini-inner" style={{ color }}>{initialOf(m)}</span>
                      </div>
                    )}
                    <div className="bc-bubble-wrap">
                      <ReactionBar />
                      <div className="bc-bubble bc-bubble-recv" onClick={popHeart}>
                        {username ? (
                          <Link
                            to={"/u/$username" as any}
                            params={{ username } as any}
                            className="bc-sender-name"
                          >
                            {nameOf(m)}
                          </Link>
                        ) : (
                          <span className="bc-sender-name">{nameOf(m)}</span>
                        )}
                        {m.kind === "voice" && m.audio_url ? (
                          <VoiceBubble path={m.audio_url} durationMs={m.duration_ms} sent={false} />
                        ) : (
                          <div>{m.body}</div>
                        )}
                        <div className="bc-time">{fmtTime(m.created_at)}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            className="bc-composer"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            {recording ? (
              <>
                <button type="button" className="bc-mic bc-rec-cancel" onClick={() => stopRecording(true)} aria-label="cancel">✕</button>
                <div className="bc-rec-live">
                  <span className="bc-rec-pulse" />
                  <span className="bc-rec-time">{fmtDur(recElapsed)}</span>
                  <span className="bc-rec-hint">Recording… tap ➤ to send</span>
                </div>
                <button type="button" className="bc-send" onClick={() => stopRecording(false)} disabled={sending} aria-label="send voice">➤</button>
              </>
            ) : (
              <>
                <button type="button" className="bc-emoji-btn" aria-label="emoji">😊</button>
                <input
                  className="bc-input"
                  placeholder="Write a message…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={500}
                />
                {draft.trim() ? (
                  <button type="submit" className="bc-send" disabled={sending} aria-label="send">➤</button>
                ) : (
                  <button type="button" className="bc-mic bc-mic-btn" onClick={startRecording} aria-label="record voice">🎤</button>
                )}
              </>
            )}
          </form>


          <FloatHearts hearts={hearts} />
        </div>
      </div>
    </div>
  );
}

const BC_CSS = `
.bc-page { background:#ffffff; padding: 28px 16px 64px; }
.bc-card-shell { max-width: 860px; margin: 0 auto; background:#fff; border:1px solid #eadfca; border-radius:22px; overflow:hidden; }

@keyframes bc-msgIn { from {opacity:0; transform:translateY(12px)} to {opacity:1; transform:none} }
@keyframes bc-wv { 0%,100%{height:5px} 50%{height:17px} }
@keyframes bc-pulseA { 0%{box-shadow:0 0 0 0 rgba(217,119,6,.5)} 100%{box-shadow:0 0 0 7px rgba(217,119,6,0)} }
@keyframes bc-fly { 0%{opacity:1; transform:translateY(0) scale(1)} 100%{opacity:0; transform:translateY(-80px) scale(1.4)} }

.bc-back { color:#8a7d68; font-size:13px; text-decoration:none; font-weight:600; }
.bc-back:hover { color:#21180a; }
.bc-pre { color:#21180a; font-size:15px; margin: 14px 0 0; }

.bc-join { background: linear-gradient(160deg,#fbbf24,#d97706); color:#fff; font-weight:700; font-size:14px; padding:10px 24px; border:none; border-radius:999px; box-shadow:0 6px 14px rgba(217,119,6,.26); cursor:pointer; transition: transform .25s ease, box-shadow .25s ease; }
.bc-join:hover { transform: translateY(-2px); box-shadow:0 10px 22px rgba(217,119,6,.36); }
.bc-join:disabled { opacity:.6; cursor:not-allowed; }

.bc-chat { background:#fdfaf3; padding:26px 34px 30px; position:relative; }
.bc-chat-head { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
.bc-chat-avatar { width:46px; height:46px; border-radius:50%; background:linear-gradient(160deg,#fbbf24,#d97706); padding:2px; display:grid; place-items:center; }
.bc-chat-avatar > span { width:100%; height:100%; border-radius:50%; background:#fdebcf; display:grid; place-items:center; font-size:23px; }
.bc-chat-meta { flex:1; min-width:0; }
.bc-chat-title { font-weight:800; font-size:18px; color:#21180a; }
.bc-presence { color:#c08a2e; font-weight:700; font-size:12px; display:flex; align-items:center; gap:6px; }
.bc-dot { width:8px; height:8px; border-radius:50%; background:#d97706; animation: bc-pulseA 1.8s infinite; }
.bc-leave { background:#fff; border:1px solid #eadcc0; color:#8a7d68; font-weight:700; font-size:13px; padding:8px 16px; border-radius:999px; cursor:pointer; transition: all .2s ease; }
.bc-leave:hover { background:#21180a; color:#fff; border-color:#21180a; }

.bc-msgs { display:flex; flex-direction:column; gap:13px; }
.bc-row { display:flex; align-items:flex-end; gap:8px; animation: bc-msgIn .55s both; }
.bc-row-r { justify-content:flex-end; }

.bc-mini-av { position:relative; width:30px; height:30px; flex:none; display:block; text-decoration:none; }
.bc-mini-ring { position:absolute; inset:0; border-radius:50%; background:linear-gradient(160deg,#fbbf24,#d97706); }
.bc-mini-inner { position:absolute; inset:2px; border-radius:50%; background:#fff; display:grid; place-items:center; font-weight:800; font-size:12px; }
.bc-mini-img { position:absolute; inset:2px; border-radius:50%; object-fit:cover; width:calc(100% - 4px); height:calc(100% - 4px); }

.bc-bubble-wrap { position:relative; max-width:75%; }
.bc-reactions { position:absolute; bottom:calc(100% + 6px); left:0; display:flex; gap:2px; background:#fff; border:1px solid #f1e6cd; border-radius:999px; padding:4px 8px; box-shadow:0 6px 14px rgba(33,24,10,.08); opacity:0; transform:translateY(4px); transition: opacity .2s ease, transform .2s ease; pointer-events:none; z-index:5; }
.bc-row-r .bc-reactions { left:auto; right:0; }
.bc-bubble-wrap:hover .bc-reactions { opacity:1; transform:translateY(0); pointer-events:auto; }
.bc-react { background:none; border:none; cursor:pointer; font-size:14px; padding:2px 4px; transition: transform .15s ease; }
.bc-react:hover { transform: scale(1.3); }

.bc-bubble { padding:10px 14px; font-size:14px; cursor:pointer; }
.bc-bubble-recv { background:#fff; border:1px solid #f3ead8; border-radius:16px 16px 16px 5px; box-shadow:0 2px 6px rgba(33,24,10,.04); color:#21180a; }
.bc-bubble-sent { background: linear-gradient(160deg,#fbbf24,#d97706); border-radius:16px 16px 5px 16px; box-shadow:0 6px 16px rgba(217,119,6,.26); color:#fff; }
.bc-sender-name { display:block; font-weight:700; font-size:11px; color:#c08a2e; margin-bottom:2px; text-decoration:none; }
.bc-sender-name:hover { text-decoration:underline; }
.bc-time { font-size:10px; color:#b3a587; margin-top:4px; }
.bc-time-sent { color:rgba(255,255,255,.85); display:flex; align-items:center; gap:6px; justify-content:flex-end; }
.bc-seen { width:10px; height:10px; border-radius:50%; background:#f8b4c4; display:inline-block; }

.bc-composer { margin-top:18px; background:#fff; border:1px solid #eadcc0; border-radius:999px; padding:7px 8px 7px 18px; display:flex; align-items:center; gap:8px; }
.bc-emoji-btn, .bc-mic { background:none; border:none; cursor:pointer; font-size:18px; padding:4px; color:#c08a2e; }
.bc-input { flex:1; border:none; outline:none; background:transparent; font-size:14px; color:#21180a; }
.bc-input::placeholder { color:#b3a587; }
.bc-send { width:38px; height:38px; border-radius:50%; border:none; background:linear-gradient(160deg,#fbbf24,#d97706); color:#fff; font-size:14px; cursor:pointer; box-shadow:0 6px 14px rgba(217,119,6,.32); display:grid; place-items:center; transition: transform .2s ease; }
.bc-send:hover { transform: rotate(8deg) scale(1.08); }
.bc-send:disabled { opacity:.5; cursor:not-allowed; transform:none; }

.bc-fly-heart { position:absolute; pointer-events:none; font-size:18px; animation: bc-fly 1.1s ease-out forwards; z-index:50; }
`;
