# Perkly — 5-Phase Build Plan

A modern employee benefits marketplace (Albania-first, global-ready) connecting Employees, Employers, Providers, and Admins. Built on TanStack Start + Lovable Cloud (Supabase) + Lovable AI Gateway.

---

## Phase 1 — Foundation, Landing & Auth

**Goal:** Investor-ready public face + working auth + role system + design system.

**Build:**
- Design system in `src/styles.css`: warm cream/amber palette (oklch tokens), Oxanium (headings), Merriweather (body), Fira Code (numbers) loaded via `<link>` in `__root.tsx`.
- Landing page (`/`) — sticky nav, hero with animated 3D benefits card, How It Works (3-step), Categories grid, AI Features showcase, Testimonials, Footer. Intersection-Observer scroll reveals; reduced motion on mobile.
- Enable Lovable Cloud. Auth pages: `/auth` (sign up + login + role picker: employee/employer/provider/admin), `/forgot-password`, `/reset-password`.
- Profiles table + `user_roles` table with `app_role` enum + `has_role()` security-definer function (per role best practices).
- Language switcher (SQ/EN) and currency toggle (ALL/EUR) scaffolding with i18n context + stored preference on profile.
- `_authenticated` layout (managed) for role-aware redirects post-login.

**Deliverable:** Visitors land, see polished marketing site, can sign up/log in, get routed by role to a placeholder dashboard.

---

## Phase 2 — Marketplace, Provider Tools & Seed Data

**Goal:** A browsable, real marketplace powered by 20+ Albanian providers.

**Build:**
- DB schema: `providers`, `categories`, `offers` (images, price ALL/EUR, availability, capacity, status), `offer_images`, `reviews`, `favorites`.
- Public marketplace feed `/marketplace` — Airbnb/LinkedIn-style cards: Trending / New / Recommended / Limited-Time tabs, full-text search w/ autocomplete, multi-select filters (category, budget, location, provider, rating), sort options, saved searches.
- Deal detail page `/marketplace/$offerId` — gallery, description, provider, reviews, included perks, Save / Add-to-Package buttons. Hero image wired to `og:image`.
- Provider dashboard `/provider` — create/edit/delete offers (full form w/ drag-drop image upload to Cloud storage), manage availability, capacity, view offer status (pending moderation).
- Admin moderation queue for offers + category management.
- Seed migration: 20+ Albanian providers (Elite Fitness Tirana, Prime Wellness, Travel Albania, Vodafone Albania, One Albania, restaurants, clinics) with realistic offers, images, ALL pricing, categories.

**Deliverable:** Anyone can browse a real marketplace; providers can list offers; admin can moderate.

---

## Phase 3 — Employer ↔ Employee Connection, Budgets, Package Builder, Approval & Simulated Payments

**Goal:** Core end-to-end workflow that wins the demo.

**Build:**
- Schema: `companies`, `company_employees` (status: pending/active), `employee_budgets` (monthly allocation, used, remaining), `packages`, `package_items`, `benefit_requests`, `transactions` (with provider split rows), `auto_approval_rules`, `notifications`.
- Employer dashboard `/employer`: overview cards, Add Employee (single form), Bulk CSV upload, employee list w/ editable budgets, Approval Center table (approve/reject), Auto-Approval Rules builder (threshold / category / employee).
- Employee-matching workflow: employer adds employee by name+email+phone → system matches against existing user → creates `notification` with [Confirm]/[Reject] → on confirm, link company + activate budget.
- Employee dashboard `/employee`: Budget Widget (Available / Used / Remaining starts at 0 ALL), Active Benefits, Transaction History, Company Info, Notifications bell + dropdown + `/notifications` page.
- Smart Package Builder — combine offers, see total + per-provider split, "Submit for Approval".
- Approval flow → simulated payment engine: on approve, generate `transaction` + per-provider split rows, mark providers paid, log to history.
- Provider analytics: views / saves / requests / revenue charts.

**Deliverable:** Full loop — employer onboards employee → employee builds package → employer approves → providers "paid" → all parties see it.

---

## Phase 4 — AI Concierge, Gamification & Engagement

**Goal:** Habit-forming, demo-dazzling features powered by Lovable AI Gateway.

**Build:**
- AI Benefit Concierge — floating chat orb (subtle 3D pulse), streaming chat via TanStack server route + Lovable AI Gateway (`google/gemini-3-flash-preview`). Tools: search offers, build package, recommend by budget/goal. Renders markdown + offer cards inline.
- AI Smart Bundling ("month of wellness" → cross-vendor package within budget).
- AI Benefit Forecast widget ("You'll likely leave 8,500 ALL unused…").
- Benefit Twin ("People in your role loved this combo").
- Employer AI Insights (most-requested category, underused budget, recommendations) w/ charts.
- Gamification schema: `points_ledger`, `streaks`, `levels`, `badges`, `user_badges`, `quests`, `challenges`, `challenge_participants`, `mystery_boxes`, `box_rewards`.
- Perkly Levels (Explorer → Legend) with badge showcase, daily/weekly quests, streak rewards.
- Team Challenges + leaderboards (Walk 100km, Wellness Month, Learning Sprint).
- Mystery Reward Boxes — spend points, 3D flip reveal animation, confetti on win.
- Birthday & anniversary auto-rewards (scheduled job via server fn).

**Deliverable:** Platform feels alive and personalized; AI gives real recommendations on seeded data.

---

## Phase 5 — Social, Discovery, Admin Polish & Internationalization

**Goal:** Community, geo discovery, admin completeness, demo polish.

**Build:**
- Team Benefit Circles — create/join groups (Runners, Gym Lovers, Travelers), realtime chat (Supabase Realtime), shared deals, group challenges, shared XP.
- Gift Perks to Colleague — gifting UI w/ amount + message, budget transfer transaction.
- Team Deals (unlock together) — progress tracker, price tier drops as N colleagues join.
- Benefits Near Me — interactive map (Leaflet + OpenStreetMap tiles, no key needed) with provider pins, filters.
- Seasonal Drops — admin creates campaigns (Summer Benefits, Winter Wellness…), countdown timers, featured-offer collections, public landing pages.
- Perk Pulse Live Heatmap — anonymized real-time map of provider check-ins (QR "tap in" simulation).
- Year In Benefits — personalized animated recap page (benefits used, saved, top category, wellness score).
- Admin Dashboard `/admin` completion: user management w/ filters + suspend/export, platform analytics (revenue trends, top categories, users by role, monthly growth), system settings (currencies, languages, feature flags), admin notifications broadcaster.
- Full i18n pass: SQ + EN translations across every screen; live ALL↔EUR conversion (free FX API) with cached rates.
- Performance & polish: Intersection-Observer everywhere, deviceMemory/connection downgrade, lazy-load 3D libs, 60fps mobile audit, SEO meta per route, OG images on leaf routes.

**Deliverable:** Investor-ready MVP — every flow in the brief works end-to-end on seeded data, demo-able in 5 minutes.

---

## Technical Notes
- Stack: TanStack Start + React 19 + TS + Tailwind v4 + Lovable Cloud (Supabase) + Lovable AI Gateway.
- Every public-schema table gets explicit GRANTs + RLS + policies scoped via `has_role()`.
- Roles in separate `user_roles` table — never on profiles.
- Server logic: `createServerFn` for app-internal; server routes under `src/routes/api/` only for AI chat streaming + webhooks.
- Simulated payments only — no Stripe.
- Mock data seeded via SQL migrations, not runtime code.
