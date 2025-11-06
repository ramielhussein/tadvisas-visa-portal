-- Allow authenticated users to view unassigned leads
CREATE POLICY "Authenticated users can view unassigned leads"
ON leads
FOR SELECT
TO authenticated
USING (assigned_to IS NULL);