-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update storage policies to ensure only authenticated users can delete
CREATE POLICY "Authenticated users can delete from kenya-album"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'kenya-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from id-oc-album"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'id-oc-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from id-ic-album"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'id-ic-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from ph-ic-album"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'ph-ic-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from ph-oc-album"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'ph-oc-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from et-ic-album"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'et-ic-album' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from et-oc-album"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'et-oc-album' AND auth.uid() IS NOT NULL);