-- Update handle_new_user to grant roles and AUTO-CONFIRM all emails for testing
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  -- AUTO-CONFIRM every user for easier testing
  UPDATE auth.users SET email_confirmed_at = now(), confirmed_at = now() WHERE id = NEW.id;

  -- Grant admin role if the email is the test admin email
  IF NEW.email = 'admin@royalbrands.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  END IF;
  
  RETURN NEW;
END; $$;
