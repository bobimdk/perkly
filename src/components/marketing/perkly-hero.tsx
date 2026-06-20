import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";

const FONT_STACK = "'Hanken Grotesk', system-ui, sans-serif";

type Card = {
  name: string;
  letter: string;
  count: number;
  tint: string;
  letterColor: string;
  top: string;
  delay: string;
};

const CARDS: Card[] = [
  { name: "Fitness", letter: "F", count: 42, tint: "#fde7c4", letterColor: "#a85d06", top: "34%", delay: "0s" },
  { name: "Wellness", letter: "W", count: 36, tint: "#fbe1c0", letterColor: "#9a6a2f", top: "62%", delay: "-2.1s" },
  { name: "Travel", letter: "T", count: 19, tint: "#fde7c4", letterColor: "#b5651f", top: "48%", delay: "-4.2s" },
  { name: "Learning", letter: "L", count: 28, tint: "#f9e7c8", letterColor: "#c77f12", top: "26%", delay: "-6.3s" },
  { name: "Food", letter: "O", count: 54, tint: "#fde3c0", letterColor: "#a85d06", top: "70%", delay: "-8.5s" },
  { name: "Tech", letter: "C", count: 23, tint: "#fbe6c2", letterColor: "#9a6a2f", top: "40%", delay: "-10.6s" },
  { name: "Healthcare", letter: "H", count: 31, tint: "#fde7c4", letterColor: "#b5651f", top: "56%", delay: "-12.7s" },
  { name: "Entertainment", letter: "E", count: 17, tint: "#f9e7c8", letterColor: "#c77f12", top: "32%", delay: "-14.8s" },
];

function MagneticButton({
  children,
  primary,
  to,
  href,
  style,
}: {
  children: React.ReactNode;
  primary?: boolean;
  to?: string;
  href?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const onMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "translate(0,0)";
  };
  const base: CSSProperties = {
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    transition: "transform .25s cubic-bezier(.2,.7,.2,1)",
    fontFamily: FONT_STACK,
    display: "inline-block",
    textDecoration: "none",
  };
  const variant: CSSProperties = primary
    ? {
        background: "linear-gradient(160deg,#fbbf24,#d97706)",
        color: "#fff",
        padding: "16px 28px",
        border: "none",
        boxShadow: "0 14px 34px rgba(217,119,6,.32)",
      }
    : {
        background: "#fff",
        color: "#21180a",
        padding: "16px 26px",
        border: "1px solid #e8d4a4",
      };
  const merged = { ...base, ...variant, ...style };
  if (to) {
    return (
      <Link ref={ref as any} to={to} onMouseMove={onMove as any} onMouseLeave={onLeave} style={merged}>
        {children}
      </Link>
    );
  }
  return (
    <a ref={ref} href={href ?? "#"} onMouseMove={onMove} onMouseLeave={onLeave} style={merged}>
      {children}
    </a>
  );
}

function useCountUp(target: number, duration = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

export function PerklyHero() {
  const [revealed, setRevealed] = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const budget = useCountUp(28500);

  useEffect(() => {
    const r = requestAnimationFrame(() => setRevealed(true));
    const b = setTimeout(() => setBarWidth(57), 260);
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(r);
      clearTimeout(b);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const revealStyle = (delay = 0): CSSProperties => ({
    opacity: revealed ? 1 : 0,
    transform: revealed ? "translateY(0)" : "translateY(30px)",
    transition: `opacity .8s cubic-bezier(.2,.7,.2,1) ${delay}ms, transform .8s cubic-bezier(.2,.7,.2,1) ${delay}ms`,
  });

  return (
    <section
      className="perkly-hero"
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#ffffff",
        fontFamily: FONT_STACK,
      }}
    >
      <style>{`
        .perkly-hero { padding: 56px 20px 56px; min-height: 520px; }
        .perkly-hero h1.perkly-h1 { font-size: 42px !important; }
        .perkly-hero .perkly-card-a, .perkly-hero .perkly-card-b { display: none; }
        @media (min-width: 768px) {
          .perkly-hero { padding: 92px 36px 76px; min-height: 580px; }
          .perkly-hero h1.perkly-h1 { font-size: 82px !important; }
          .perkly-hero .perkly-card-a, .perkly-hero .perkly-card-b { display: block; }
        }
        @keyframes flyLR {
          0%   { opacity: 0; transform: translate(-50%,-50%) translate3d(-740px,0,-820px); }
          13%  { opacity: 1; }
          84%  { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%,-50%) translate3d(740px,0,-220px); }
        }
        @keyframes floatA {
          0%,100% { transform: translateY(0) rotate(-3deg); }
          50%     { transform: translateY(-16px) rotate(-3deg); }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(0) rotate(4deg); }
          50%     { transform: translateY(-20px) rotate(4deg); }
        }
      `}</style>

      {/* 3D flying cards */}
      <div
        className="cardflow"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          perspective: 1100,
          transformStyle: "preserve-3d",
          zIndex: 0,
        }}
      >
        {CARDS.map((c) => (
          <div
            key={c.name}
            className="flowcard"
            style={{
              position: "absolute",
              width: 226,
              left: "30%",
              top: c.top,
              transformStyle: "preserve-3d",
              opacity: 0,
              animation: "flyLR 17s linear infinite",
              animationDelay: c.delay,
            }}
          >
            <div
              className="tile"
              style={{
                background: "#fff",
                border: "1px solid #f0e3c6",
                borderRadius: 16,
                padding: 16,
                boxShadow: "0 20px 44px rgba(120,70,10,.10)",
                display: "flex",
                alignItems: "center",
                gap: 11,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  background: c.tint,
                  color: c.letterColor,
                  fontWeight: 800,
                  fontSize: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {c.letter}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#21180a", lineHeight: 1.2 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "#a8915f", marginTop: 2 }}>{c.count} offers</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* fade overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          background:
            "linear-gradient(90deg,rgba(255,255,255,.95) 34%,rgba(255,255,255,.55) 62%,rgba(255,255,255,.2))",
        }}
      />

      {/* content */}
      <div style={{ position: "relative", maxWidth: 1220, margin: "0 auto", zIndex: 2 }}>
        <div style={{ maxWidth: 680 }}>
          <div
            style={{
              ...revealStyle(0),
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "#fef3da",
              color: "#a85d06",
              fontSize: 13,
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: 999,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 999, background: "#f59e0b", display: "inline-block" }} />
            Albania-first · AI-powered benefits
          </div>

          <h1
            style={{
              ...revealStyle(80),
              fontWeight: 800,
              fontSize: 82,
              lineHeight: 0.98,
              letterSpacing: "-0.04em",
              color: "#21180a",
              margin: "26px 0 0",
            }}
          >
            The benefits platform that <span style={{ color: "#d97706" }}>pays off.</span>
          </h1>

          <p
            style={{
              ...revealStyle(160),
              fontSize: 20,
              lineHeight: 1.55,
              color: "#5c4d2c",
              maxWidth: 500,
              margin: "24px 0 0",
            }}
          >
            A curated marketplace of perks your team actually wants — funded by employers, orchestrated by AI, settled in seconds.
          </p>

          <div style={{ ...revealStyle(240), display: "flex", gap: 13, marginTop: 32, flexWrap: "wrap" }}>
            <MagneticButton primary>Get started free</MagneticButton>
            <MagneticButton>Book a demo</MagneticButton>
          </div>
        </div>
      </div>

      {/* Card A */}
      <div
        style={{
          position: "absolute",
          top: 90,
          right: 46,
          width: 230,
          zIndex: 2,
          background: "#fff",
          border: "1px solid #f0e3c6",
          borderRadius: 18,
          padding: 18,
          boxShadow: "0 24px 50px rgba(120,70,10,.14)",
          transform: `translateY(${-scrollY * 0.05}px)`,
          animation: "floatA 7s ease-in-out infinite",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: "#a8915f" }}>Remaining budget</div>
        <div style={{ fontWeight: 800, fontSize: 30, color: "#21180a", margin: "6px 0 12px" }}>
          {budget.toLocaleString("en-US")}
        </div>
        <div style={{ background: "#f5ecd8", borderRadius: 999, height: 8, overflow: "hidden" }}>
          <div
            style={{
              width: `${barWidth}%`,
              height: "100%",
              background: "linear-gradient(90deg,#f59e0b,#fcd34d)",
              transition: "width 1.1s cubic-bezier(.2,.7,.2,1)",
              borderRadius: 999,
            }}
          />
        </div>
        <div style={{ fontSize: 11, color: "#a8915f", marginTop: 8 }}>of 50,000 ALL</div>
      </div>

      {/* Card B */}
      <div
        style={{
          position: "absolute",
          top: 300,
          right: 160,
          width: 210,
          zIndex: 2,
          background: "#21180a",
          color: "#f6ecd8",
          borderRadius: 18,
          padding: 16,
          boxShadow: "0 24px 50px rgba(0,0,0,.18)",
          transform: `translateY(${-scrollY * 0.1}px)`,
          animation: "floatB 8s ease-in-out infinite",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: "linear-gradient(160deg,#fbbf24,#d97706)",
              color: "#21180a",
              fontWeight: 700,
              fontSize: 11,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            AI
          </span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Concierge</span>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.45, color: "#d8c4a0", marginTop: 10 }}>
          Bundled a wellness reset for <strong style={{ color: "#fcd980", fontWeight: 700 }}>8,400 ALL</strong> ✓
        </div>
      </div>
    </section>
  );
}
