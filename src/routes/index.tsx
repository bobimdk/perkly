import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Perkly — Benefits that pay off" },
      {
        name: "description",
        content:
          "Albania-first, AI-powered employee benefits marketplace. Curated perks, instant payouts, ALL & EUR.",
      },
      { property: "og:title", content: "Perkly — Benefits that pay off" },
      {
        property: "og:description",
        content:
          "A curated marketplace of perks your team actually wants — funded by employers, orchestrated by AI.",
      },
    ],
  }),
  component: LandingPage,
});

// ---------- helpers ----------

function useCountUp(ref: React.RefObject<HTMLElement | null>, target: number, suffix = "") {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      const steps = 42;
      const dur = 28;
      let i = 0;
      const ease = (t: number) => 1 - Math.pow(1 - t, 3);
      const id = setInterval(() => {
        i++;
        const v = Math.round(target * ease(i / steps));
        el.textContent = v.toLocaleString("en-US") + suffix;
        if (i >= steps) {
          el.textContent = target.toLocaleString("en-US") + suffix;
          clearInterval(id);
        }
      }, dur);
    };
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && run()),
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, target, suffix]);
}

function useMagnetic(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    };
    const onLeave = () => {
      el.style.transform = "translate(0,0)";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [ref]);
}

// ---------- page ----------

function LandingPage() {
  // scroll progress + parallax
  const progressRef = useRef<HTMLDivElement>(null);
  const floatA = useRef<HTMLDivElement>(null);
  const floatB = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (y / max) * 100 : 0;
      if (progressRef.current) progressRef.current.style.width = pct + "%";
      if (floatA.current) floatA.current.style.setProperty("--py", `${-y * 0.05}px`);
      if (floatB.current) floatB.current.style.setProperty("--py", `${-y * 0.1}px`);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // animate bar after mount
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = setTimeout(() => {
      if (barRef.current) barRef.current.style.width = "57%";
    }, 260);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="perkly-landing">
      <style>{landingCss}</style>
      <div ref={progressRef} className="pk-progress" />
      <div className="pk-corner-label">WHITE 4 · SAAS</div>

      <Nav />

      <main>
        <Hero floatA={floatA} floatB={floatB} barRef={barRef} />
        <StatStrip />
        <Features />
        <AIBand />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}

// ---------- sections ----------

function Nav() {
  const btnRef = useRef<HTMLAnchorElement>(null);
  useMagnetic(btnRef);
  return (
    <header className="pk-nav">
      <div className="pk-nav-inner">
        <Link to="/" className="pk-logo">
          <span className="pk-logo-mark">P</span>
          <span className="pk-logo-word">Perkly</span>
        </Link>
        <nav className="pk-nav-links">
          <a href="#marketplace" className="pk-navlink">Marketplace</a>
          <a href="#intelligence" className="pk-navlink">Intelligence</a>
          <a href="#employers" className="pk-navlink">Employers</a>
          <a href="#pricing" className="pk-navlink">Pricing</a>
        </nav>
        <Link ref={btnRef} to="/auth" className="pk-btn pk-btn-primary pk-btn-sm">
          Get started
        </Link>
      </div>
    </header>
  );
}

function Hero({
  floatA,
  floatB,
  barRef,
}: {
  floatA: React.RefObject<HTMLDivElement | null>;
  floatB: React.RefObject<HTMLDivElement | null>;
  barRef: React.RefObject<HTMLDivElement | null>;
}) {
  const primary = useRef<HTMLAnchorElement>(null);
  const secondary = useRef<HTMLAnchorElement>(null);
  useMagnetic(primary);
  useMagnetic(secondary);

  const budgetRef = useRef<HTMLSpanElement>(null);
  useCountUp(budgetRef, 28500);

  return (
    <section className="pk-hero">
      <div className="cardflow" aria-hidden="true">
        {FLOW_CARDS.map((c) => (
          <div
            key={c.name}
            className="flowcard"
            style={{ left: "30%", top: c.top, animationDelay: c.delay }}
          >
            <div className="tile">
              <div className="tile-icon" style={{ background: c.tint, color: c.color }}>
                {c.letter}
              </div>
              <div className="tile-text">
                <div className="tile-name">{c.name}</div>
                <div className="tile-count">{c.count} offers</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="cardflow-overlay" aria-hidden="true" />

      <div className="pk-hero-content">
        <div className="reveal pk-badge">
          <span className="pk-badge-dot" />
          Albania-first · AI-powered benefits
        </div>
        <h1 className="reveal pk-h1">
          The benefits platform that <span className="pk-accent">pays off.</span>
        </h1>
        <p className="reveal pk-subhead">
          A curated marketplace of perks your team actually wants — funded by employers,
          orchestrated by AI, settled in seconds.
        </p>
        <div className="reveal pk-btn-row">
          <Link ref={primary} to="/auth" className="pk-btn pk-btn-primary">
            Get started free
          </Link>
          <a ref={secondary} href="#demo" className="pk-btn pk-btn-secondary">
            Book a demo
          </a>
        </div>
      </div>

      <div ref={floatA} className="pk-float pk-float-a">
        <div className="pk-float-label">Remaining budget</div>
        <div className="pk-float-num">
          <span ref={budgetRef}>0</span>
        </div>
        <div className="pk-bar-track">
          <div ref={barRef} className="pk-bar-fill" />
        </div>
        <div className="pk-float-foot">of 50,000 ALL</div>
      </div>

      <div ref={floatB} className="pk-float pk-float-b">
        <div className="pk-float-b-head">
          <span className="pk-ai-chip">AI</span>
          <span>Concierge</span>
        </div>
        <div className="pk-float-b-body">
          Bundled a wellness reset for <span className="pk-amount">8,400 ALL</span> ✓
        </div>
      </div>
    </section>
  );
}

function StatStrip() {
  const refs = [useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null), useRef<HTMLSpanElement>(null)];
  useCountUp(refs[0], 240, "+");
  useCountUp(refs[1], 62);
  useCountUp(refs[2], 38);
  useCountUp(refs[3], 97, "%");
  const labels = ["Curated offers", "Companies", "Vendor partners", "Recommend"];
  return (
    <section className="pk-wrap">
      <div className="reveal pk-stats">
        {refs.map((r, i) => (
          <div key={i} className="pk-stat">
            <div className="pk-stat-num"><span ref={r}>0</span></div>
            <div className="pk-stat-label">{labels[i]}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { l: "M", tint: "#fde7c4", t: "Curated marketplace", d: "Vetted gyms, spas, courses and escapes — no clutter, only perks worth offering." },
    { l: "B", tint: "#fbe1c0", t: "Budget guardrails", d: "Set monthly limits and category caps once. Freedom for staff, control for finance." },
    { l: "$", tint: "#f9e7c8", t: "Instant payouts", d: "A simulated payout reaches the provider the moment a package is approved." },
    { l: "AI", tint: "#fde3c0", t: "Smart bundling", d: "Give the AI a goal — it builds the package across vendors, inside budget." },
    { l: "%", tint: "#fbe6c2", t: "Live insights", d: "See demand spikes and unused budget before they cost you a thing." },
    { l: "A", tint: "#fdebc8", t: "Set up in a day", d: "ALL & EUR, Albanian & English, ready out of the box for Albanian teams." },
  ];
  return (
    <section id="employers" className="pk-wrap pk-features">
      <div className="reveal pk-features-head">
        <div className="pk-eyebrow">Why Perkly</div>
        <h2 className="pk-h2">Everything HR needs, nothing they don't.</h2>
      </div>
      <div className="pk-feature-grid">
        {items.map((it) => (
          <article key={it.t} className="reveal pk-feature-card">
            <div className="pk-feature-top">
              <div className="pk-feature-ico" style={{ background: it.tint }}>{it.l}</div>
              <span className="pk-feature-arrow">↗</span>
            </div>
            <h3 className="pk-feature-title">{it.t}</h3>
            <p className="pk-feature-desc">{it.d}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AIBand() {
  const btn = useRef<HTMLAnchorElement>(null);
  useMagnetic(btn);
  return (
    <section id="intelligence" className="pk-ai-band">
      <div className="pk-ai-glow" aria-hidden="true" />
      <div className="pk-ai-inner">
        <div className="reveal pk-ai-left">
          <div className="pk-eyebrow pk-eyebrow-amber">Intelligence</div>
          <h2 className="pk-ai-h2">Ask once. Get the perfect package.</h2>
          <p className="pk-ai-p">
            Describe a goal in plain language — the AI composes a bundle across vendors,
            inside budget, instantly.
          </p>
          <a ref={btn} href="#concierge" className="pk-btn pk-btn-primary">
            Meet the concierge →
          </a>
        </div>
        <div className="reveal pk-chat-card">
          <div className="pk-chat-head">
            <span className="pk-ai-chip pk-ai-chip-lg">AI</span>
            <span className="pk-chat-title">Benefit Concierge</span>
          </div>
          <div className="pk-bubble pk-bubble-user">
            Plan a learning sprint under 5,000 ALL
          </div>
          <div className="pk-bubble pk-bubble-ai">
            A 3-month Coursera library + a design workshop —{" "}
            <span className="pk-amount">4,800 ALL</span>. Enroll you?
          </div>
          <div className="pk-chips">
            <span className="pk-chip pk-chip-amber">Enroll ✓</span>
            <span className="pk-chip pk-chip-white">Alternatives</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  const btn = useRef<HTMLAnchorElement>(null);
  useMagnetic(btn);
  return (
    <section id="pricing" className="pk-wrap">
      <div className="reveal pk-cta">
        <div className="pk-cta-circle pk-cta-circle-a" aria-hidden="true" />
        <div className="pk-cta-circle pk-cta-circle-b" aria-hidden="true" />
        <h2 className="pk-cta-h2">Make benefits your edge.</h2>
        <p className="pk-cta-p">
          Set up in an afternoon. ALL & EUR, Albanian & English, ready out of the box.
        </p>
        <Link ref={btn} to="/auth" className="pk-btn pk-btn-white">
          Start free trial
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="pk-footer">
      <div className="pk-footer-inner">
        <div className="pk-logo">
          <span className="pk-logo-mark pk-logo-mark-sm">P</span>
          <span className="pk-logo-word pk-logo-word-sm">Perkly</span>
        </div>
        <div className="pk-footer-meta">Built in Tirana · hello@perkly.al</div>
      </div>
    </footer>
  );
}

// ---------- data ----------

const FLOW_CARDS = [
  { name: "Fitness",       letter: "F", count: 42, tint: "#fde7c4", color: "#a85d06", top: "34%", delay: "0s" },
  { name: "Wellness",      letter: "W", count: 36, tint: "#fbe1c0", color: "#9a6a2f", top: "62%", delay: "-2.1s" },
  { name: "Travel",        letter: "T", count: 19, tint: "#fde7c4", color: "#b5651f", top: "48%", delay: "-4.2s" },
  { name: "Learning",      letter: "L", count: 28, tint: "#f9e7c8", color: "#c77f12", top: "26%", delay: "-6.3s" },
  { name: "Food",          letter: "O", count: 54, tint: "#fde3c0", color: "#a85d06", top: "70%", delay: "-8.5s" },
  { name: "Tech",          letter: "C", count: 23, tint: "#fbe6c2", color: "#9a6a2f", top: "40%", delay: "-10.6s" },
  { name: "Healthcare",    letter: "H", count: 31, tint: "#fde7c4", color: "#b5651f", top: "56%", delay: "-12.7s" },
  { name: "Entertainment", letter: "E", count: 17, tint: "#f9e7c8", color: "#c77f12", top: "32%", delay: "-14.8s" },
];

// ---------- css ----------

const landingCss = `
.perkly-landing{
  font-family:"Hanken Grotesk", system-ui, sans-serif;
  background:#fff; color:#21180a;
  scroll-behavior:smooth;
}
.perkly-landing *, .perkly-landing *::before, .perkly-landing *::after{ box-sizing:border-box; }
.perkly-landing ::selection{ background:#f59e0b; color:#fff; }
.perkly-landing ::-webkit-scrollbar{ width:10px; }
.perkly-landing ::-webkit-scrollbar-track{ background:#fff; }
.perkly-landing ::-webkit-scrollbar-thumb{ background:#eaddc0; border-radius:8px; }

.pk-progress{
  position:fixed; top:0; left:0; height:3px; width:0%;
  background:#f59e0b; z-index:90; transition:width .1s linear;
}
.pk-corner-label{
  position:fixed; left:14px; bottom:12px; z-index:80;
  font:11px ui-monospace, "Fira Code", monospace; letter-spacing:.14em; color:#c2ad84;
}

.pk-wrap{ max-width:1220px; margin:0 auto; padding:0 36px; }

/* reveal */
.perkly-landing .reveal{ opacity:0; transform:translateY(30px); transition:opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1); }
.perkly-landing .reveal.is-visible{ opacity:1; transform:none; }

/* nav */
.pk-nav{ position:sticky; top:0; z-index:60; backdrop-filter:blur(12px); background:rgba(255,255,255,.85); border-bottom:1px solid #f3ead8; }
.pk-nav-inner{ max-width:1220px; margin:0 auto; padding:17px 36px; display:flex; align-items:center; justify-content:space-between; gap:24px; }
.pk-logo{ display:inline-flex; align-items:center; gap:10px; text-decoration:none; color:#21180a; }
.pk-logo-mark{ width:30px; height:30px; border-radius:9px; display:grid; place-items:center; color:#fff; font-weight:800; background:linear-gradient(160deg,#fbbf24,#d97706); }
.pk-logo-word{ font-weight:800; font-size:22px; letter-spacing:-.02em; }
.pk-nav-links{ display:flex; gap:32px; }
.pk-navlink{ position:relative; font-size:14px; font-weight:500; color:#6a5733; text-decoration:none; }
.pk-navlink::after{ content:""; position:absolute; left:0; bottom:-4px; height:2px; width:0; background:#f59e0b; transition:width .4s ease; }
.pk-navlink:hover::after{ width:100%; }

/* buttons */
.pk-btn{ display:inline-flex; align-items:center; justify-content:center; padding:16px 28px; border-radius:12px; font-weight:600; font-size:15px; text-decoration:none; cursor:pointer; border:0; transition:transform .25s cubic-bezier(.2,.7,.2,1), box-shadow .25s ease, background .25s ease; }
.pk-btn-sm{ padding:10px 18px; font-size:14px; border-radius:10px; box-shadow:0 8px 22px rgba(217,119,6,.28); }
.pk-btn-primary{ background:linear-gradient(160deg,#fbbf24,#d97706); color:#fff; box-shadow:0 14px 34px rgba(217,119,6,.32); }
.pk-btn-secondary{ background:#fff; color:#21180a; border:1px solid #e8d4a4; }
.pk-btn-white{ background:#fff; color:#d97706; }
.pk-btn-row{ display:flex; gap:13px; flex-wrap:wrap; margin-top:28px; }

/* hero */
.pk-hero{ position:relative; overflow:hidden; padding:92px 36px 76px; min-height:580px; }
.pk-hero-content{ position:relative; z-index:2; max-width:680px; }
.pk-badge{ display:inline-flex; align-items:center; gap:8px; background:#fef3da; color:#a85d06; font-size:13px; font-weight:600; padding:6px 14px; border-radius:999px; white-space:nowrap; }
.pk-badge-dot{ width:7px; height:7px; border-radius:50%; background:#d97706; }
.pk-h1{ font-weight:800; font-size:82px; line-height:.98; letter-spacing:-.04em; color:#21180a; margin:22px 0 18px; }
.pk-accent{ color:#d97706; }
.pk-subhead{ font-size:20px; line-height:1.55; color:#5c4d2c; max-width:500px; margin:0; }

/* cardflow */
.cardflow{ position:absolute; inset:0; overflow:hidden; pointer-events:none; perspective:1100px; transform-style:preserve-3d; z-index:0; }
.cardflow-overlay{ position:absolute; inset:0; pointer-events:none; z-index:1;
  background:linear-gradient(90deg, rgba(255,255,255,.95) 34%, rgba(255,255,255,.55) 62%, rgba(255,255,255,.2)); }
.flowcard{ position:absolute; width:226px; transform-style:preserve-3d; opacity:0;
  animation: flyLR 17s linear infinite; }
@keyframes flyLR{
  0%{ opacity:0; transform: translate(-50%,-50%) translate3d(-740px, 0, -820px); }
  13%{ opacity:1; }
  84%{ opacity:1; }
  100%{ opacity:0; transform: translate(-50%,-50%) translate3d(740px, 0, -220px); }
}
.tile{ display:flex; align-items:center; gap:11px; background:#fff; border:1px solid #f0e3c6; border-radius:16px; padding:16px; box-shadow:0 20px 44px rgba(120,70,10,.10); }
.tile-icon{ width:42px; height:42px; border-radius:11px; display:grid; place-items:center; font-weight:800; font-size:18px; text-transform:uppercase; flex-shrink:0; }
.tile-name{ font-size:15px; font-weight:700; color:#21180a; }
.tile-count{ font-size:12px; color:#a8915f; }

/* float cards */
.pk-float{ position:absolute; z-index:2; transform:translateY(var(--py,0)); }
.pk-float-a{ top:90px; right:46px; width:230px; background:#fff; border:1px solid #f0e3c6; border-radius:18px; padding:18px; box-shadow:0 24px 50px rgba(120,70,10,.14); animation:floatA 7s ease-in-out infinite; }
.pk-float-b{ top:300px; right:160px; width:210px; background:#21180a; color:#f6ecd8; border-radius:18px; padding:18px; animation:floatB 8s ease-in-out infinite; }
.pk-float-label{ font-size:12px; color:#a8915f; }
.pk-float-num{ font-size:30px; font-weight:800; margin:4px 0 10px; }
.pk-bar-track{ height:8px; background:#f5ecd8; border-radius:999px; overflow:hidden; }
.pk-bar-fill{ height:100%; width:0; background:linear-gradient(90deg,#f59e0b,#fcd34d); transition:width 1.1s cubic-bezier(.2,.7,.2,1); }
.pk-float-foot{ margin-top:6px; font-size:11px; color:#a8915f; }
.pk-float-b-head{ display:flex; align-items:center; gap:8px; font-weight:700; }
.pk-float-b-body{ margin-top:8px; font-size:14px; line-height:1.5; }
.pk-amount{ color:#fcd980; font-weight:700; }
.pk-ai-chip{ display:inline-grid; place-items:center; width:26px; height:26px; border-radius:8px; background:linear-gradient(160deg,#fbbf24,#d97706); color:#21180a; font-weight:800; font-size:12px; }
.pk-ai-chip-lg{ width:32px; height:32px; border-radius:9px; font-size:13px; }

@keyframes floatA{ 0%,100%{ transform:translateY(calc(var(--py,0px))) rotate(-3deg); } 50%{ transform:translateY(calc(var(--py,0px) - 16px)) rotate(-3deg); } }
@keyframes floatB{ 0%,100%{ transform:translateY(calc(var(--py,0px))) rotate(4deg); } 50%{ transform:translateY(calc(var(--py,0px) - 20px)) rotate(4deg); } }

/* stats */
.pk-stats{ display:grid; grid-template-columns:repeat(4, 1fr); gap:20px; background:#fdf8ec; border:1px solid #f3ead8; border-radius:20px; padding:30px; margin-top:24px; }
.pk-stat{ text-align:center; border-right:1px solid #efe1c2; }
.pk-stat:last-child{ border-right:0; }
.pk-stat-num{ font-weight:800; font-size:40px; color:#d97706; }
.pk-stat-label{ font-size:13px; font-weight:500; color:#6a5733; }

/* features */
.pk-features{ padding-top:96px; padding-bottom:24px; }
.pk-features-head{ max-width:620px; }
.pk-eyebrow{ font-size:13px; letter-spacing:.12em; text-transform:uppercase; color:#d97706; font-weight:700; }
.pk-eyebrow-amber{ color:#fcd980; }
.pk-h2{ font-weight:800; font-size:46px; letter-spacing:-.03em; line-height:1.05; margin:14px 0 0; }
.pk-feature-grid{ display:grid; grid-template-columns:repeat(3, 1fr); gap:18px; margin-top:36px; }
.pk-feature-card{ background:#fff; border:1px solid #f3ead8; border-radius:18px; padding:26px; transition:transform .4s ease, box-shadow .4s ease, border-color .4s ease; }
.pk-feature-card:hover{ transform:translateY(-7px); box-shadow:0 24px 50px rgba(120,70,10,.12); border-color:#f3c969; }
.pk-feature-top{ display:flex; align-items:center; justify-content:space-between; }
.pk-feature-ico{ width:46px; height:46px; border-radius:12px; display:grid; place-items:center; font-weight:800; color:#a85d06; }
.pk-feature-arrow{ color:#d97706; font-size:18px; transition:transform .4s ease; display:inline-block; }
.pk-feature-card:hover .pk-feature-arrow{ transform:translate(4px,-4px); }
.pk-feature-title{ font-size:19px; font-weight:700; margin:18px 0 6px; }
.pk-feature-desc{ font-size:14.5px; color:#6a5733; line-height:1.55; margin:0; }

/* ai band */
.pk-ai-band{ position:relative; background:#21180a; color:#f6ecd8; padding:84px 36px; overflow:hidden; margin-top:96px; }
.pk-ai-glow{ position:absolute; top:-120px; right:-120px; width:480px; height:480px; background:radial-gradient(circle, rgba(245,166,35,.24), transparent 64%); pointer-events:none; }
.pk-ai-inner{ position:relative; max-width:1100px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:54px; align-items:center; }
.pk-ai-h2{ font-weight:800; font-size:48px; color:#fce4ae; margin:14px 0 18px; letter-spacing:-.02em; line-height:1.05; }
.pk-ai-p{ font-size:17px; color:#d8c4a0; margin:0 0 28px; max-width:480px; }
.pk-chat-card{ background:#2a2010; border:1px solid rgba(245,166,35,.22); border-radius:22px; padding:24px; box-shadow:0 30px 70px rgba(0,0,0,.4); }
.pk-chat-head{ display:flex; align-items:center; gap:10px; margin-bottom:18px; }
.pk-chat-title{ color:#fce4ae; font-weight:700; }
.pk-bubble{ padding:12px 16px; font-size:14.5px; line-height:1.5; margin-bottom:10px; max-width:90%; }
.pk-bubble-user{ background:linear-gradient(160deg,#fbbf24,#d97706); color:#21180a; border-radius:14px 14px 4px 14px; margin-left:auto; font-weight:600; }
.pk-bubble-ai{ background:rgba(255,255,255,.05); color:#e3d2b2; border-radius:14px 14px 14px 4px; }
.pk-chips{ display:flex; gap:8px; margin-top:14px; }
.pk-chip{ padding:6px 12px; border-radius:999px; font-size:12.5px; font-weight:600; }
.pk-chip-amber{ background:rgba(245,158,11,.18); color:#fcd980; }
.pk-chip-white{ background:rgba(255,255,255,.08); color:#f6ecd8; }

/* cta */
.pk-cta{ position:relative; overflow:hidden; max-width:1220px; margin:96px auto 80px; border-radius:26px; background:linear-gradient(160deg,#f59e0b,#d97706); padding:72px 48px; text-align:center; color:#fff; }
.pk-cta-circle{ position:absolute; border-radius:50%; pointer-events:none; }
.pk-cta-circle-a{ top:-120px; right:-120px; width:340px; height:340px; background:rgba(255,255,255,.14); }
.pk-cta-circle-b{ bottom:-140px; left:-140px; width:360px; height:360px; background:rgba(255,255,255,.1); }
.pk-cta-h2{ font-weight:800; font-size:50px; letter-spacing:-.03em; margin:0 0 14px; position:relative; }
.pk-cta-p{ font-size:18px; color:rgba(255,255,255,.9); margin:0 0 28px; position:relative; }
.pk-cta .pk-btn{ position:relative; }

/* footer */
.pk-footer{ border-top:1px solid #f3ead8; padding:42px 36px; }
.pk-footer-inner{ max-width:1220px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:24px; flex-wrap:wrap; }
.pk-logo-mark-sm{ width:26px; height:26px; border-radius:8px; font-size:13px; }
.pk-logo-word-sm{ font-size:19px; }
.pk-footer-meta{ font-size:13px; color:#a8915f; }

@media (max-width: 900px){
  .pk-h1{ font-size:54px; }
  .pk-h2{ font-size:34px; }
  .pk-ai-h2, .pk-cta-h2{ font-size:36px; }
  .pk-stats{ grid-template-columns:repeat(2,1fr); }
  .pk-stat:nth-child(2){ border-right:0; }
  .pk-feature-grid{ grid-template-columns:1fr; }
  .pk-ai-inner{ grid-template-columns:1fr; }
  .pk-nav-links{ display:none; }
  .pk-float-a, .pk-float-b{ display:none; }
}
`;
