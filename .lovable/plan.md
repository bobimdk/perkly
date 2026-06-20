# Plan — 6 features

I'll ship this in 3 batches (each batch = one migration + UI). Confirm and I'll start with Batch 1.

## Batch 1 — Database foundation (one migration)

Adds the schema everything else depends on:

- **profiles**: add `username` (unique, slug), `headline`, `bio`, `cover_url`, `location`, `company_name`, `role_title`. Backfill `username` from email prefix.
- **providers**: add `is_sponsored boolean default false`, `sponsored_until timestamptz`.
- **friendships**: `id, requester_id, addressee_id, status('pending'|'accepted'|'declined'), created_at, updated_at`. Unique pair. RLS: both parties can read; requester inserts; either can update status; either can delete.
- **Rename Drops → Packages in UI only**. Keep table `seasonal_drops` as-is (already have a `packages` table for something else — I'll verify and namespace correctly during build).
- GRANTs + RLS + update triggers on every new/changed table.

## Batch 2 — Profiles, Friends, Gift-to-friend, Navbar

- **`/u/$username` profile page**: LinkedIn-style layout per your reference — cover banner, large circular avatar, name + headline, location, connections count, company chip on the right, action buttons (Connect / Message / Gift if friend). Pulls from `profiles` + counts from `friendships`.
- **`/network` page** (employees only): search users by name/company/role, send friend requests, accept/decline incoming, list current friends. ~LinkedIn People-You-May-Know grid.
- **Navbar (desktop + mobile hamburger)**: add **"Add Friends"** link for employees pointing to `/network`, with a small badge for pending requests.
- **Gift dialog rewrite**: remove email field. Show clickable friend list (avatar + name + company). Click a friend → amount popup → confirm transfers from sender's `employee_budgets` to recipient's via existing `send_gift` RPC (will adapt RPC to accept `recipient_user_id` instead of email).
- **Circles chat fix**: show sender username above bubble, make it a Link to `/u/$username`. Cleaner bubble design (rounded, alt alignment for self vs others, avatar, timestamp).
- **Drops → Packages**: rename route `/drops` → `/packages`, all UI labels, nav entries. Add redirect from old path.

## Batch 3 — Sponsored businesses

- **Marketplace**: ⭐ "Sponsored" badge on provider cards. Sponsored providers' offers pinned to top of "Recommended" rail.
- **Map**: distinct pin icon (gold star) for `is_sponsored` providers, with "Sponsored" tag in the popup.
- **Provider dashboard**: a "Promote business" card. For now an admin-only toggle (no Stripe yet) — provider sees status + can request promotion; admin flips `is_sponsored`. Confirm if you want self-serve paid promotion (Stripe) instead — that's a bigger add.

## Technical notes (skip if non-technical)

- Google Maps custom marker icons via `google.maps.Marker` `icon` prop (gold star SVG).
- Friend search uses `profiles` full-text on `display_name || company_name || role_title`.
- Profile route: `src/routes/u.$username.tsx` with loader fetching profile + counts.
- Gift RPC signature change is backward-compatible (add new param, keep email path deprecated).

## Questions before I start

1. **Promotion flow**: admin toggle only for now, or wire Stripe checkout so providers self-serve?
2. **Friend gift**: completely remove the email gift path, or keep both?
3. Go ahead with all 3 batches in order?
