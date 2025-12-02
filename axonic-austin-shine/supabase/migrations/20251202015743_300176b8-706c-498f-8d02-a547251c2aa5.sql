-- Create branding_settings table for persistent branding configuration
CREATE TABLE IF NOT EXISTS public.branding_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  company_name TEXT NOT NULL DEFAULT 'Axonic Motorworks',
  tagline TEXT NOT NULL DEFAULT 'Veteran-Owned Auto Body & Paint Excellence',
  location TEXT NOT NULL DEFAULT 'Austin, Texas',
  address TEXT NOT NULL DEFAULT '15600 Marsha Street, Building 1 Unit 1A, Austin, TX',
  phone TEXT NOT NULL DEFAULT '210-823-1595',
  email TEXT NOT NULL DEFAULT 'sales@axonicmoto.com',
  website TEXT NOT NULL DEFAULT 'www.axonicmoto.com',
  primary_color TEXT NOT NULL DEFAULT '#1a365d',
  secondary_color TEXT NOT NULL DEFAULT '#718096',
  accent_color TEXT NOT NULL DEFAULT '#ef4444'
);

-- Enable RLS
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for branding settings
CREATE POLICY "Anyone can view branding settings"
  ON public.branding_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage branding settings"
  ON public.branding_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default branding settings
INSERT INTO public.branding_settings (
  company_name,
  tagline,
  location,
  address,
  phone,
  email,
  website,
  primary_color,
  secondary_color,
  accent_color
) VALUES (
  'Axonic Motorworks',
  'Veteran-Owned Auto Body & Paint Excellence',
  'Austin, Texas',
  '15600 Marsha Street, Building 1 Unit 1A, Austin, TX',
  '210-823-1595',
  'sales@axonicmoto.com',
  'www.axonicmoto.com',
  '#1a365d',
  '#718096',
  '#ef4444'
);

-- Create trigger to update updated_at
CREATE TRIGGER update_branding_settings_updated_at
  BEFORE UPDATE ON public.branding_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();