-- Create storage policies for crm-documents bucket to allow authenticated users to access deal attachments

-- Allow authenticated users to view deal documents
CREATE POLICY "Authenticated users can view deal documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'crm-documents' AND (storage.foldername(name))[1] = 'deals');

-- Allow authenticated users to upload deal documents
CREATE POLICY "Authenticated users can upload deal documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'crm-documents' AND (storage.foldername(name))[1] = 'deals');

-- Allow users to delete their own uploaded documents (optional)
CREATE POLICY "Users can delete deal documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'crm-documents' AND (storage.foldername(name))[1] = 'deals');