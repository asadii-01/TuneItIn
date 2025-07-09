-- This script should be run in the Supabase Dashboard SQL Editor
-- or via the Supabase CLI after the main tables are created

-- Create storage buckets (run this in Supabase Dashboard)
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('audio-files', 'audio-files', true),
  ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for audio files
CREATE POLICY "Anyone can view audio files" ON storage.objects
  FOR SELECT USING (bucket_id = 'audio-files');

CREATE POLICY "Authenticated users can upload audio files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'audio-files' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own audio files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'audio-files' 
    AND auth.uid()::text = (string_to_array(name, '/'))[2]
  );

CREATE POLICY "Users can delete own audio files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'audio-files' 
    AND auth.uid()::text = (string_to_array(name, '/'))[2]
  );

-- Storage policies for images
CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'images' 
    AND auth.uid()::text = (string_to_array(name, '/'))[2]
  );

CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images' 
    AND auth.uid()::text = (string_to_array(name, '/'))[2]
  );
