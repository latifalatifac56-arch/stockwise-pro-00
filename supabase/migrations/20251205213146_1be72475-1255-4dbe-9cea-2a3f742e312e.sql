-- Create a storage bucket for article images
INSERT INTO storage.buckets (id, name, public)
VALUES ('articles', 'articles', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload article images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'articles' AND auth.uid() IS NOT NULL);

-- Allow everyone to view article images
CREATE POLICY "Everyone can view article images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'articles');

-- Allow managers and admins to delete article images
CREATE POLICY "Managers and admins can delete article images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'articles' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

-- Allow managers and admins to update article images
CREATE POLICY "Managers and admins can update article images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'articles' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));