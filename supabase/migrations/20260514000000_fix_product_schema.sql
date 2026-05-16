-- Add missing columns to product_images
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS position INT DEFAULT 0;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT false;

-- Create product_color_variants table
CREATE TABLE IF NOT EXISTS public.product_color_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  name_tr TEXT,
  hex_color TEXT,
  stock_quantity INT DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  is_main BOOLEAN DEFAULT false,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create product_sizes table
CREATE TABLE IF NOT EXISTS public.product_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size_label TEXT NOT NULL,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add color_variant_id to product_images
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS color_variant_id UUID REFERENCES public.product_color_variants(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.product_color_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "color_variants public read" ON public.product_color_variants FOR SELECT USING (true);
CREATE POLICY "color_variants admin all" ON public.product_color_variants FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "sizes public read" ON public.product_sizes FOR SELECT USING (true);
CREATE POLICY "sizes admin all" ON public.product_sizes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Storage configuration (Note: This might require superuser or specific permissions depending on Supabase setup)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Allow public access to read
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- Allow authenticated admins to upload/update/delete
CREATE POLICY "Admin Full Access"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'product-images' AND
  (SELECT public.has_role(auth.uid(), 'admin'))
)
WITH CHECK (
  bucket_id = 'product-images' AND
  (SELECT public.has_role(auth.uid(), 'admin'))
);
