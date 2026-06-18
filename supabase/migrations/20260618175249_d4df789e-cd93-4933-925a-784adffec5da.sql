
CREATE POLICY "Marketplace images viewable by authenticated" ON storage.objects FOR SELECT TO authenticated USING (bucket_id IN ('offer-images','provider-assets'));
CREATE POLICY "Owners upload to own folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id IN ('offer-images','provider-assets')
  AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Owners update own files" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id IN ('offer-images','provider-assets')
  AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Owners or admins delete files" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id IN ('offer-images','provider-assets')
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin'))
);
