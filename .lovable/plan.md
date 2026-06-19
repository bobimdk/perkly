# Bug Fix Plan — 3 Phases

## Phase 1 — Input & UX fixes (quick wins)

**Goal:** Fix the broken form inputs and the password toggle. Pure frontend.

1. **Price field leading-zero bug** (employee package builder + employer company setup)
   - Find all `<Input type="number">` price fields bound to ALL/EUR state.
   - Switch from numeric state defaulting to `0` to string-backed state (default `""`), with a numeric placeholder like `0`.
   - Parse to number only on submit. This lets the user clear the field and type freely.
   - Apply to both the offer/package price inputs and the employer's company setup price input.

2. **Show Password toggle**
   - In `src/routes/auth.tsx` (and `reset-password.tsx` if applicable), add an eye/eye-off icon button inside the password `<Input>` that toggles `type="password" ↔ "text"`.
   - Use `lucide-react`'s `Eye` / `EyeOff`.

## Phase 2 — Map & Password Recovery

**Goal:** Fix data/infra issues affecting real users.

3. **Map markers in the middle of a lake**
   - Query `perk_checkins` + `providers` for the two offending lat/lng rows (likely default `41.3275, 19.8189` Tirana center fallback, or swapped lat/lng).
   - Add validation when inserting check-ins / provider locations: reject `(0,0)`, reject swapped coords, and snap to provider's real address geocode if available.
   - Update existing bad rows to the provider's real coordinates (or remove them if no address).

4. **Password recovery email not delivered**
   - Check email infrastructure status via `email_domain--check_email_domain_status`.
   - If no email domain is configured: prompt the user to set up the email domain (this is why Supabase's default auth emails are unreliable in preview).
   - After domain is ready, run `email_domain--scaffold_auth_email_templates` so reset emails route through Lovable's queued email system with proper branding and deliverability.

## Phase 3 — Albanian translations

**Goal:** Cover the missing Albanian strings on package/details pages.

5. **Missing Albanian translations**
   - Audit pages: marketplace offer detail (`marketplace.$slug.tsx`), employee package builder, employer approval cards, activity card, provider dashboard.
   - Extract every hardcoded English string into `dictionaries.en` + `dictionaries.sq` in `src/lib/i18n.tsx`.
   - Replace inline strings with `t("key")` calls.
   - Verify by toggling language and walking through each affected screen.

---

### Notes
- Phases are independent — each can ship on its own.
- Phase 2's email fix requires you to confirm setting up an email sending domain (needed for production-grade auth emails).
- Phase 3 is the largest in surface area but lowest risk.

Reply with **"approve phase 1"** (or 2 / 3 / all) to start.