
ALTER TABLE public.circle_messages
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS duration_ms integer;

ALTER TABLE public.circle_messages
  ALTER COLUMN body DROP NOT NULL;
