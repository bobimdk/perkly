import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/circles/")({
  component: CirclesIndex,
});

type Circle = {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  members: number;
  tint: string;
};

const CIRCLES: Circle[] = [
  { slug: "runners-of-tirana", name: "Runners of Tirana", emoji: "🏃", description: "Weekly runs, race tips, and gear deals", members: 38, tint: "#fde3d3" },
  { slug: "mindful-minds", name: "Mindful Minds", emoji: "🧘", description: "Meditation, therapy, and balance", members: 24, tint: "#eef3ec" },
  { slug: "foodies", name: "Foodies", emoji: "🍽️", description: "Best lunch spots near the office", members: 31, tint: "#fde0c4" },
  { slug: "gym-lovers", name: "Gym Lovers", emoji: "💪", description: "Form check, splits, and gym perks", members: 46, tint: "#f6ecd0" },
  { slug: "travelers", name: "Travelers", emoji: "✈️", description: "Weekend trips and travel hacks", members: 19, tint: "#f3e6cf" },
];

const AVATAR_COLORS = ["#e36f8a", "#5b87c4", "#c08a2e"];

function useInView<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current || inView) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [inView, threshold]);
  return { ref, inView };
}

function CountUp({ target, run }: { target: number; run: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    const start = performance.now();
    const dur = Math.max(600, target * 26);
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target]);
  return <>{n}</>;
}

function CircleCard({ c, index }: { c: Circle; index: number }) {
  const { ref, inView } = useInView<HTMLAnchorElement>();
  return (
    <Link
      to="/circles/$slug"
      params={{ slug: c.slug }}
      ref={ref as any}
      className={`bc-card bc-reveal ${inView ? "bc-in" : ""}`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <div className="bc-glow" />
      <div className="bc-emblem">
        <div className="bc-ring" />
        <div className="bc-white" />
        <div className="bc-tint" style={{ background: c.tint }}>
          <span className="bc-emoji">{c.emoji}</span>
        </div>
      </div>
      <div className="bc-name">{c.name}</div>
      <div className="bc-desc">{c.description}</div>
      <div className="bc-avatars">
        {AVATAR_COLORS.slice(0, 2).map((bg, i) => (
          <span key={i} className="bc-av" style={{ background: bg }} />
        ))}
        <span className="bc-av bc-count">
          +<CountUp target={c.members} run={inView} />
        </span>
      </div>
      <button type="button" className="bc-join" onClick={(e) => e.preventDefault()}>
        Join
      </button>
    </Link>
  );
}




function CirclesIndex() {
  const head = useInView<HTMLDivElement>();
  return (
    <div className="bc-page">
      <style>{BC_CSS}</style>
      <div className="bc-card-shell">
        <section className="bc-grid-block">
          <div ref={head.ref} className={`bc-head bc-reveal ${head.inView ? "bc-in" : ""}`}>
            <p className="bc-eyebrow">Community</p>
            <h2 className="bc-h2">Benefit Circles</h2>
          </div>
          <div className="bc-grid">
            {CIRCLES.map((c, i) => (
              <CircleCard key={c.slug} c={c} index={i} />
            ))}
          </div>
        </section>
        
      </div>
    </div>
  );
}

const BC_CSS = `
.bc-page { background:#ffffff; padding: 28px 16px 64px; }
.bc-card-shell { max-width: 1200px; margin: 0 auto; background:#fff; border:1px solid #eadfca; border-radius:22px; overflow:hidden; }

@keyframes bc-spin { to { transform: rotate(360deg) } }
@keyframes bc-msgIn { from {opacity:0; transform:translateY(12px)} to {opacity:1; transform:none} }
@keyframes bc-blink { 0%,80%,100%{opacity:.3; transform:translateY(0)} 40%{opacity:1; transform:translateY(-3px)} }
@keyframes bc-wv { 0%,100%{height:5px} 50%{height:17px} }
@keyframes bc-pulseA { 0%{box-shadow:0 0 0 0 rgba(217,119,6,.5)} 100%{box-shadow:0 0 0 7px rgba(217,119,6,0)} }
@keyframes bc-fly { 0%{opacity:1; transform:translateY(0) scale(1)} 100%{opacity:0; transform:translateY(-80px) scale(1.4)} }

.bc-reveal { opacity:0; transform:translateY(26px); transition: opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1); }
.bc-in { opacity:1; transform:none; }

/* Grid block */
.bc-grid-block { padding: 34px; }
.bc-eyebrow { font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#d97706; font-weight:700; margin:0; }
.bc-h2 { font-weight:800; font-size:30px; letter-spacing:-.025em; color:#21180a; margin:6px 0 24px; }
.bc-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:14px; }
@media (max-width: 900px) { .bc-grid { grid-template-columns:repeat(2,1fr); } }
@media (max-width: 520px) { .bc-grid { grid-template-columns:1fr; } }

.bc-card { position:relative; padding:6px; text-align:center; cursor:pointer; text-decoration:none; color:inherit; display:flex; flex-direction:column; align-items:center; transition: transform .45s cubic-bezier(.2,.7,.2,1); border-radius:18px; }
.bc-card:hover { transform: translateY(-8px); }
.bc-glow { position:absolute; inset:0; border-radius:18px; background: radial-gradient(circle at 50% 30%, rgba(217,119,6,.22), transparent 70%); filter:blur(8px); opacity:0; transition: opacity .45s ease; pointer-events:none; }
.bc-card:hover .bc-glow { opacity:1; }

.bc-emblem { position:relative; width:108px; height:108px; margin: 8px auto 14px; }
.bc-ring { position:absolute; inset:0; border-radius:50%; background: conic-gradient(from 0deg,#fbbf24,#fde7c4,#d97706,#f59e0b,#fbbf24); animation: bc-spin 7s linear infinite; }
.bc-card:hover .bc-ring { animation-duration: 2.6s; }
.bc-white { position:absolute; inset:4px; border-radius:50%; background:#fff; }
.bc-tint { position:absolute; inset:12px; border-radius:50%; display:grid; place-items:center; }
.bc-emoji { font-size:38px; line-height:1; }

.bc-name { font-weight:700; font-size:16px; color:#21180a; position:relative; }
.bc-desc { font-size:13px; color:#8a7d68; min-height:36px; margin-top:4px; padding: 0 4px; position:relative; }

.bc-avatars { display:flex; justify-content:center; margin-top:10px; position:relative; }
.bc-av { width:24px; height:24px; border-radius:50%; border:2px solid #fff; margin-left:-8px; }
.bc-av:first-child { margin-left:0; }
.bc-count { background:#fdebcf !important; color:#b06a14; font-weight:800; font-size:11px; display:grid; place-items:center; min-width:30px; padding:0 6px; width:auto; }

.bc-join { margin-top:12px; background: linear-gradient(160deg,#fbbf24,#d97706); color:#fff; font-weight:700; font-size:13px; padding:8px 20px; border:none; border-radius:999px; box-shadow:0 6px 14px rgba(217,119,6,.26); cursor:pointer; transition: transform .25s ease, box-shadow .25s ease; position:relative; }
.bc-card:hover .bc-join { transform: translateY(-2px); box-shadow:0 10px 22px rgba(217,119,6,.36); }

/* Chat */
.bc-chat { background:#fdfaf3; border-top:1px solid #f1e6cd; padding:26px 34px 30px; position:relative; }
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

.bc-mini-av { position:relative; width:30px; height:30px; flex:none; }
.bc-mini-ring { position:absolute; inset:0; border-radius:50%; background:linear-gradient(160deg,#fbbf24,#d97706); }
.bc-mini-inner { position:absolute; inset:2px; border-radius:50%; background:#fff; display:grid; place-items:center; font-weight:800; font-size:12px; }

.bc-bubble-wrap { position:relative; max-width:75%; }
.bc-reactions { position:absolute; bottom:calc(100% + 6px); left:0; display:flex; gap:2px; background:#fff; border:1px solid #f1e6cd; border-radius:999px; padding:4px 8px; box-shadow:0 6px 14px rgba(33,24,10,.08); opacity:0; transform:translateY(4px); transition: opacity .2s ease, transform .2s ease; pointer-events:none; z-index:5; }
.bc-row-r .bc-reactions { left:auto; right:0; }
.bc-bubble-wrap:hover .bc-reactions { opacity:1; transform:translateY(0); pointer-events:auto; }
.bc-react { background:none; border:none; cursor:pointer; font-size:14px; padding:2px 4px; transition: transform .15s ease; }
.bc-react:hover { transform: scale(1.3); }

.bc-bubble { padding:10px 14px; font-size:14px; cursor:pointer; }
.bc-bubble-recv { background:#fff; border:1px solid #f3ead8; border-radius:16px 16px 16px 5px; box-shadow:0 2px 6px rgba(33,24,10,.04); color:#21180a; }
.bc-bubble-sent { background: linear-gradient(160deg,#fbbf24,#d97706); border-radius:16px 16px 5px 16px; box-shadow:0 6px 16px rgba(217,119,6,.26); color:#fff; }
.bc-time { font-size:10px; color:#b3a587; margin-top:4px; }
.bc-time-sent { color:rgba(255,255,255,.85); display:flex; align-items:center; gap:6px; justify-content:flex-end; }
.bc-seen { width:10px; height:10px; border-radius:50%; background:#f8b4c4; display:inline-block; }

.bc-voice { display:flex; align-items:center; gap:10px; min-width:210px; }
.bc-play { width:30px; height:30px; border-radius:50%; border:none; background: linear-gradient(160deg,#fbbf24,#d97706); color:#fff; font-size:11px; cursor:pointer; display:grid; place-items:center; }
.bc-wave { display:flex; align-items:center; gap:3px; height:20px; flex:1; }
.bc-bar { display:inline-block; width:3px; border-radius:2px; height:5px; animation: bc-wv 1s ease-in-out infinite; }
.bc-vtime { font-size:11px; color:#b3a587; }

.bc-typing { background:#fff; border:1px solid #f3ead8; border-radius:16px 16px 16px 5px; padding:10px 14px; display:flex; gap:4px; }
.bc-typing span { width:6px; height:6px; border-radius:50%; background:#e0b878; animation: bc-blink 1.2s infinite; }
.bc-typing span:nth-child(2) { animation-delay:.2s; }
.bc-typing span:nth-child(3) { animation-delay:.4s; }

.bc-composer { margin-top:18px; background:#fff; border:1px solid #eadcc0; border-radius:999px; padding:7px 8px 7px 18px; display:flex; align-items:center; gap:8px; }
.bc-emoji-btn, .bc-mic { background:none; border:none; cursor:pointer; font-size:18px; padding:4px; color:#c08a2e; }
.bc-input { flex:1; border:none; outline:none; background:transparent; font-size:14px; color:#21180a; }
.bc-input::placeholder { color:#b3a587; }
.bc-send { width:38px; height:38px; border-radius:50%; border:none; background:linear-gradient(160deg,#fbbf24,#d97706); color:#fff; font-size:14px; cursor:pointer; box-shadow:0 6px 14px rgba(217,119,6,.32); display:grid; place-items:center; transition: transform .2s ease; }
.bc-send:hover { transform: rotate(8deg) scale(1.08); }

.bc-fly-heart { position:absolute; pointer-events:none; font-size:18px; animation: bc-fly 1.1s ease-out forwards; z-index:50; }
`;
