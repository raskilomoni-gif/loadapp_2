/*
# Storage policies for id-documents bucket

1. Security
- Public read bucket (so public URLs work for ID photos and license scans)
- Authenticated users can upload/update/delete their own files (folder = their user_id)
- Anon users can read (bucket is public for public URL access)

2. Notes
- Files are stored under paths like `{user_id}/id-photo.jpg` and `{user_id}/license-{trip_id}.jpg`
- Upload policies check that the first path segment matches auth.uid()
*/

-- Allow public read access to id-documents bucket
DROP POLICY IF EXISTS "public_read_id_documents" ON storage.objects;
CREATE POLICY "public_read_id_documents"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'id-documents');

-- Allow authenticated users to upload to their own folder
DROP POLICY IF EXISTS "auth_upload_own_id_documents" ON storage.objects;
CREATE POLICY "auth_upload_own_id_documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'id-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own files
DROP POLICY IF EXISTS "auth_update_own_id_documents" ON storage.objects;
CREATE POLICY "auth_update_own_id_documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'id-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'id-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own files
DROP POLICY IF EXISTS "auth_delete_own_id_documents" ON storage.objects;
CREATE POLICY "auth_delete_own_id_documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'id-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
