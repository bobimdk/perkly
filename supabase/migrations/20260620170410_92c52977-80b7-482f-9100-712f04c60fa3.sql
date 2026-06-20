
DROP FUNCTION IF EXISTS public.get_public_profile_by_id(uuid);
DROP FUNCTION IF EXISTS public.get_public_profile_by_username(text);

CREATE FUNCTION public.get_public_profile_by_id(_id uuid)
 RETURNS TABLE(id uuid, username text, first_name text, last_name text, avatar_url text, headline text, bio text, cover_url text, location text, company_name text, role_title text, skills text[], interests text[], languages text[], created_at timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT id, username, first_name, last_name, avatar_url, headline,
         bio, cover_url, location, company_name, role_title,
         skills, interests, languages, created_at
  FROM public.profiles WHERE id = _id
$function$;

CREATE FUNCTION public.get_public_profile_by_username(_username text)
 RETURNS TABLE(id uuid, username text, first_name text, last_name text, avatar_url text, headline text, bio text, cover_url text, location text, company_name text, role_title text, skills text[], interests text[], languages text[], created_at timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT id, username, first_name, last_name, avatar_url, headline,
         bio, cover_url, location, company_name, role_title,
         skills, interests, languages, created_at
  FROM public.profiles WHERE username = _username
$function$;
