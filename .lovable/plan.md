
This is a large 9-part request. Below is what I'll do, grouped so it's reviewable.

## 1. Albanian-only Employer & Provider dashboards
- Rewrite `src/routes/_authenticated/employer.tsx` and `src/routes/_authenticated/provider.tsx` so every visible string (headings, labels, buttons, placeholders, statuses, table headers, toasts, empty states, form fields) is in Albanian.
- Do **not** wire them through `useI18n()` — per the request these two views become Albanian-only regardless of the language switch in the navbar. The marketing site and Employee dashboard keep the existing SQ/EN toggle.

## 2. Click-anywhere-to-dismiss toasts
- Configure the global `<Toaster />` (Sonner) in `src/routes/__root.tsx` with `closeButton={false}` and `toastOptions={{ onClick: (t) => sonnerToast.dismiss(t.id) }}` plus `style={{ cursor: 'pointer' }}`. One change covers every toast in the app.

## 3. Provider dashboard improvements
**Prefill new offer from business profile** — In `provider.tsx`, when the "New offer" dialog opens, initialise its form state from the loaded `providers` row (name → offer title prefix, description, contact, city, address). Provider can still edit each field.

**"Analiza e Biznesit" section** — New section under the offers list:
- Query 1: `favorites` joined to `offers` filtered to this provider's offers → count per offer.
- Query 2: `transactions` filtered to this provider → count per offer (engagement).
- Render top offers with a simple horizontal bar chart (CSS bars sized by % of max) and a list with counts. All labels Albanian.

## 4. Real interactive map picker for provider address
- Replace the current "Locate from address" text-only flow with a Leaflet picker (Leaflet is already in the project for `/map`).
- New component `src/components/provider/location-picker.tsx`: opens a `<Dialog>` containing a Leaflet map centred on the provider's current coords or Piramida e Tiranës. Click anywhere → drop a draggable marker. Reverse-geocode via Nominatim (`https://nominatim.openstreetmap.org/reverse`) to populate the address text. "Konfirmo vendndodhjen" saves `{lat, lng, address}` back to the provider form.

## 5. Employer → Employee invite flow (full path)
Schema work (single migration):
- New table `public.company_invites(id, company_id, employer_id, email, employee_id nullable, status 'pending'|'accepted'|'rejected'|'cancelled', created_at, decided_at)` with grants + RLS.
- RLS: employer can insert/select/update their own invites; the invited user (matched by `auth.email() = email` or `employee_id = auth.uid()`) can select + update their pending ones.
- Trigger on insert → write a `notifications` row to the invited employee (lookup by email in `profiles`).
- SECURITY DEFINER function `public.accept_company_invite(_invite_id)`:
  - asserts invite is pending and the caller is the matching user,
  - sets `status='accepted'`, `decided_at=now()`, `employee_id=auth.uid()`,
  - upserts `company_employees(company_id, user_id, status='active')`,
  - notifies the employer.
- Mirror `reject_company_invite(_invite_id)`.

App work:
- Employer dashboard: "Invite" form posts into `company_invites` (replaces whatever direct insert exists). Show pending/accepted/rejected list, refreshed via realtime.
- Employee dashboard: new "Ftesa" card listing pending invites with Accept / Reject buttons calling the RPCs.
- Enable Realtime on `company_invites`, `company_employees`, `notifications`.

## 6. Real-time pending status
- Where the employer renders the invite/request lists, add a `useEffect` subscribing to `postgres_changes` on `company_invites` (and existing `benefit_requests`) filtered to this company, calling `queryClient.invalidateQueries` on any change. Same on the employee side.
- After any accept/reject mutation, also call `invalidateQueries` immediately so the label flips before the realtime echo arrives.

## 7. Notifications bell popover
- Replace the current bell button (in `dashboard-shell.tsx` or wherever it lives) with a shadcn `<Popover>` containing a scrollable list.
- Query `notifications` for the current user, newest first; subscribe to realtime inserts.
- Each row: title, type badge, body, relative timestamp, click to mark read + (if href) navigate.
- Empty state inside the popup: **"Nuk keni njoftime."**

## 8. Remove-employee dialog wording
- In employer dashboard, the confirm dialog currently interpolates `window.location.origin` or similar. Replace with: **`A jeni i sigurt që dëshironi të hiqni ${employee.full_name} nga biznesi juaj?`** using the row's stored name (fallback to email).

## 9. Favourites system end-to-end
- `favorites` table already exists. Add `getFavorites`, `addFavorite(offerId)`, `removeFavorite(offerId)` helpers in `src/lib/marketplace.ts`.
- New `src/components/marketplace/favorite-toggle.tsx`: heart icon that toggles via the helpers; works for both signed-in (writes) and signed-out (prompts sign-in).
- Add it to every offer card (`offer-card.tsx`) and the offer detail page (`marketplace.$slug.tsx`) and any provider tile that represents a bookable service.
- Employee dashboard: new **"Të preferuarat"** section listing favourited offers in cards (name, provider business name, short description, "Hiq nga të preferuarat" button). Empty state: **"Nuk keni asnjë të preferuar ende."**

## Technical notes (for the curious)
- All migrations grouped into one approval step. RLS is mandatory on every new table; policies scope to `auth.uid()` and the matching email.
- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE` for `company_invites`, `company_employees`, `notifications` in the same migration. Subscriptions live inside `useEffect` with cleanup, per the realtime guideline.
- No new secrets needed; Nominatim is keyless.
- Toast click-dismiss is a single root-level config change, not per-call.
- I will **not** touch `client.ts`, `types.ts`, or other auto-generated files.

## Order of execution
1. Run the schema migration (invites + RPCs + realtime publication) — needs your approval before anything else.
2. After it's applied, ship the app code changes in one batch: Albanian rewrites, toast config, provider map + analytics + prefill, employer invite flow + real-time + remove-dialog fix, employee invites + favourites, notification bell popover, favourite toggles in marketplace.

Reply **approve** to run the migration and proceed, or tell me what to adjust (scope cuts, additional fields, English fallback for any string, etc.).
