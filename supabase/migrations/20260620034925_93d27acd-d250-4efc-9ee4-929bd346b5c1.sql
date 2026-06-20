
DROP POLICY IF EXISTS "voice notes read auth" ON storage.objects;
CREATE POLICY "voice notes read auth" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'voice-notes');

DROP POLICY IF EXISTS "voice notes insert own" ON storage.objects;
CREATE POLICY "voice notes insert own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "voice notes delete own" ON storage.objects;
CREATE POLICY "voice notes delete own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);
