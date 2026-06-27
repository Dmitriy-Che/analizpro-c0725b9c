
CREATE POLICY "Admins manage payment-qr" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'payment-qr' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'payment-qr' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone reads payment-qr" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'payment-qr');
