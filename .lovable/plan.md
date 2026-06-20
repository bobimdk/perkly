# Bug Fix Plan

This is a batch of focused fixes. I'll group them by area and ship them together. No database schema changes are needed — the existing `gifts.amount_all` and `employee_budgets.used_all` columns already cover the gift flow (the bug is a client field-name mismatch, not a missing column).

## Provider dashboard (`src/routes/_authenticated/provider.tsx`)

1. **Stale business info when switching providers** — the "Edit business" and "New offer" dialogs read from a `useState` initialized once. Switch them to re-sync via `useEffect` whenever the selected provider id changes (and reset on dialog open).
2. **"All" offers tab incomplete** — `fetchProviderOffers` only filters by `provider_id`, but the UI tab filter currently excludes drafts/pending. Make the "All" tab show every status; keep other tabs filtered.
3. **English version missing** — the dashboard is hard-coded Albanian. Re-wire labels through `useI18n()` with `sq`/`en` entries in `src/lib/i18n.tsx` so the language switch works.
4. **Providers shouldn't browse/buy/favourite** — hide the Marketplace / Map / Circles / Drops nav entries and the favourite hearts when the signed-in user has only the `provider` role. Done in `dashboard-shell.tsx` + `favorite-toggle.tsx` (return null for providers).

## Employer dashboard (`src/routes/_authenticated/employer.tsx`)

5. **Employers shouldn't buy/favourite** — same role-gated hiding as providers (employers keep Marketplace read access for browsing the catalog if needed, but no purchase/favourite buttons). Hide `FavoriteToggle` + any "Buy"/"Add to package" CTAs when role is `employer`.

## Employee dashboard (`src/routes/_authenticated/employee.tsx`)

6. **QR code crushed** — `activity-card.tsx` forces the QR into a fixed 16:9 with `aspect-square` on a flex child, which squashes on narrow screens. Switch to a stacked layout on mobile (`flex-col sm:flex-row`) and give the QR a fixed max width.
7. **Gift dialog — first digit can't be deleted** — `gift-dialog.tsx` uses `Number(value) || 0` which forces `0` back. Store the raw string and only parse on submit; allow empty input.
8. **Gift flow — `used_amount` column doesn't exist** — `send_gift` RPC writes to `employee_budgets.used_amount`, but the column is `used_all`. Update the client to call the RPC (server-side is already correct via `submit_benefit_request`), or fix the direct client insert to use `used_all`. I'll switch the gift call to the `send_gift` RPC and update the RPC in a single migration to use `used_all`.

> Schema note: this is the ONE migration needed — `CREATE OR REPLACE FUNCTION public.send_gift` with `used_all` instead of `used_amount`. No new tables.

## Marketing / landing (`src/components/marketing/*`, `perkly-hero.tsx`)

9. **Footer links dead** — replace `href="#"` placeholders with real route links (`/marketplace`, `/circles`, `/drops`, `/map`, `/auth`, `/#how`). Group: Company → About/Contact (anchor to `/#how`), Product → marketplace/circles/drops/map, Legal → stub `/legal/privacy` etc. with simple pages OR scroll-to-section.
10. **"Get started free" / "Book a demo" buttons dead** — wire them to `/auth` and `/#how` (or a `mailto:` for demo) in `perkly-hero.tsx`.
11. **Hero stacks badly on mobile** — apply the responsive-layout pattern: grid wrappers, `min-w-0`, smaller padding (`px-5 py-12 sm:px-9 sm:py-[92px]`), reduce hero `min-height` on mobile, stack CTA column.
12. **Mobile nav has no links** — `marketing-shell.tsx` hides nav at `<md`. Add a hamburger `Sheet` with the same links + auth buttons.

## Map (`src/routes/map.tsx`)

13. **Map not responsive** — the Leaflet container + business list use a fixed 2-column grid. Switch to `grid-cols-1 lg:grid-cols-[1fr_360px]`, make the map container `h-[50vh] lg:h-[calc(100vh-12rem)]`, and let business cards stack.

## Offers / Marketplace

14. **Filter button doesn't work** — in `marketplace.index.tsx` the filter trigger opens a sheet but state isn't wired to the query. Connect the form state through `useNavigate` search params and re-fetch.

## AI Concierge (`src/routes/api/concierge.ts` + `concierge-orb.tsx`)

15. **AI doesn't show EUR / doesn't speak Albanian** — extend the system prompt to: (a) detect user language from i18n (`lang` passed in request body) and reply in Albanian when `lang === 'sq'`; (b) always quote prices as `X ALL (~Y EUR)` using the FX rate from `fx_rates` table (pass current rate in request body).

---

## Order of operations

1. Run the `send_gift` migration (separate approval step).
2. Once approved, ship all client/code changes in one batch:
   - i18n keys for provider dashboard
   - `provider.tsx`, `employer.tsx`, `employee.tsx`, `activity-card.tsx`, `gift-dialog.tsx`
   - `dashboard-shell.tsx`, `favorite-toggle.tsx` (role gating)
   - `marketing-shell.tsx` (hamburger + working footer)
   - `perkly-hero.tsx` (responsive + button links)
   - `map.tsx` (responsive grid)
   - `marketplace.index.tsx` (filter wiring)
   - `concierge.ts` (system prompt: SQ + EUR conversion)

Shall I proceed?
