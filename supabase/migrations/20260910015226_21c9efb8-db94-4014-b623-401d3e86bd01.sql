CREATE POLICY "Atleta envia os proprios videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'athlete-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Atleta le os proprios videos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'athlete-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Atleta apaga os proprios videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'athlete-videos' AND (storage.foldername(name))[1] = auth.uid()::text);