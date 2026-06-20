
## Profile Page Upgrade

Transform `/u/$username` into a richer LinkedIn-style profile, and add a dedicated `/settings/profile` editor for the owner.

### 1. Database changes (one migration)

Extend `profiles` with structured fields:
- `skills text[]` (default `'{}'`)
- `interests text[]` (default `'{}'`)
- `languages text[]` (default `'{}'`)

Two new tables to support timeline sections:

`public.profile_experiences`
- `id uuid pk`, `user_id uuid → profiles.id`, `title text`, `company text`, `location text`, `start_date date`, `end_date date null` (null = present), `description text`, `created_at timestamptz`

`public.profile_education`
- `id uuid pk`, `user_id uuid → profiles.id`, `school text`, `degree text`, `field text`, `start_year int`, `end_year int null`, `description text`, `created_at timestamptz`

Both tables get GRANTs (`SELECT` to anon+authenticated, write to authenticated, ALL to service_role), RLS enabled, policies: public read; owner insert/update/delete (`auth.uid() = user_id`).

### 2. Profile page (`src/routes/u.$username.tsx`)

Rebuild as a sectioned layout (keeps existing cover/avatar/header):

- **Header** — keep current avatar, name, headline, location, connect/gift buttons. Add Edit button for owner (links to `/settings/profile`).
- **About** — existing bio block, full width.
- **Experience** — list of `profile_experiences` rows with company, title, date range, description.
- **Education** — list of `profile_education` rows.
- **Skills & Interests** — chip rows for `skills`, `interests`, `languages`.
- **Mutual connections** — for non-owner viewers, show count + up to 6 avatars of friends-in-common (query `friendships` accepted on both sides). Hidden when own profile or not signed in.
- **Gifts received showcase** — last ~6 gifts received from `gifts` table where `recipient_id = profile.id`; show sender avatar, amount, message, date. Public.
- **Activity feed** — combined recent: gifts sent/received, circles joined (`circle_members`), badges earned (`user_badges`). Sorted desc, limit 10.

All section text in English so the auto-translator handles other languages.

### 3. Settings page (`src/routes/_authenticated/settings.profile.tsx`)

New dedicated editor (auth-required). Sections:
- **Basics**: avatar upload, cover upload, first/last name, username, headline, location, bio.
- **Skills / Interests / Languages**: tag-input chips backed by the new `text[]` columns.
- **Experience**: list editor (add/edit/delete rows) for `profile_experiences`.
- **Education**: list editor for `profile_education`.

Each save goes through `supabase.from(...).upsert/update/delete` scoped to `auth.uid()`. On save, invalidate the `["profile", username]` query and toast success.

Add a "Settings" link to the profile owner header and a top-nav entry visible when signed in.

### 4. Helpers in `src/lib/phase5.ts`

Add:
- `fetchExperiences(userId)`, `upsertExperience(row)`, `deleteExperience(id)`
- `fetchEducation(userId)`, `upsertEducation(row)`, `deleteEducation(id)`
- `fetchMutualConnections(viewerId, profileId)` → `{ count, sample: Profile[] }`
- `fetchGiftsReceived(profileId, limit=6)` → joins sender profile
- `fetchActivity(profileId, limit=10)` → unions gifts + circle joins + badges

### Technical notes

- TanStack Query for all reads; `useSuspenseQuery` not required, keep `useQuery` to match existing pattern.
- Public profile reads stay anon-friendly via existing public SELECT policies on `profiles`; new tables get matching public SELECT.
- Settings route lives under `_authenticated/`, so the managed gate handles auth.
- No translation keys needed — auto-translate handles English source strings.

### Out of scope

- No endorsements/kudos, no badges section beyond activity feed, no privacy toggles (per answers), no inline editing on the profile page.
