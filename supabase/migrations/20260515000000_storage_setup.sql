-- Create the storage bucket for product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read access to all files in the bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'product-images' );

-- Allow authenticated users (admin) to upload files
CREATE POLICY "Admin Upload Access" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK ( bucket_id = 'product-images' );

-- Allow authenticated users to update their files
CREATE POLICY "Admin Update Access" 
ON storage.objects FOR UPDATE 
TO authenticated
USING ( bucket_id = 'product-images' );

-- Allow authenticated users to delete files
CREATE POLICY "Admin Delete Access" 
ON storage.objects FOR DELETE 
TO authenticated
USING ( bucket_id = 'product-images' );