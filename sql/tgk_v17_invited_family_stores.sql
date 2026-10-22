-- Script aplicado en Supabase (20261022120934). No ejecutar dos veces.

-- TGK V1.7 / Pilot multi-family shop / adult-controlled invites
BEGIN;

ALTER TABLE public.stores
  ADD CONSTRAINT tgk_stores_one_owner UNIQUE (owner_user_id);

CREATE TABLE public.storefronts (
 store_id uuid PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
 slug text NOT NULL UNIQUE,
 display_name text NOT NULL,
 logo_url text NOT NULL DEFAULT '',
 tagline text NOT NULL DEFAULT '',
 is_published boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.storefronts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.storefronts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.storefronts TO anon, authenticated;
CREATE POLICY tgk_storefronts_published_read ON public.storefronts FOR SELECT TO anon, authenticated
USING (is_published = true);

CREATE OR REPLACE FUNCTION private.tgk_sync_storefront()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 INSERT INTO public.storefronts(store_id,slug,display_name,logo_url,tagline,is_published,updated_at)
 VALUES(NEW.id,NEW.slug,NEW.display_name,NEW.logo_url,NEW.tagline,NEW.is_published,now())
 ON CONFLICT(store_id) DO UPDATE SET slug=excluded.slug,display_name=excluded.display_name,
   logo_url=excluded.logo_url,tagline=excluded.tagline,is_published=excluded.is_published,updated_at=now();
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.tgk_sync_storefront() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER tgk_stores_storefront_sync AFTER INSERT OR UPDATE OF slug,display_name,logo_url,tagline,is_published
ON public.stores FOR EACH ROW EXECUTE FUNCTION private.tgk_sync_storefront();
INSERT INTO public.storefronts(store_id,slug,display_name,logo_url,tagline,is_published)
 SELECT id,slug,display_name,logo_url,tagline,is_published FROM public.stores;

-- Existing founder protected; future owners can edit their own store, but never change its owner/slug by UPDATE.
GRANT UPDATE(display_name,logo_url,tagline,is_published) ON public.stores TO authenticated;
CREATE POLICY tgk_stores_owner_update ON public.stores FOR UPDATE TO authenticated
USING(owner_user_id = (SELECT auth.uid()))
WITH CHECK(owner_user_id = (SELECT auth.uid()));

CREATE TABLE private.tgk_family_invites (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text NOT NULL CHECK(length(email) BETWEEN 5 AND 254),
 code_hash text NOT NULL UNIQUE,
 issued_by uuid NOT NULL REFERENCES auth.users(id),
 expires_at timestamptz NOT NULL DEFAULT(now()+interval '14 days'),
 redeemed_by uuid REFERENCES auth.users(id),
 redeemed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON private.tgk_family_invites FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.tgk_issue_family_invite(p_email text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_email text; v_code text;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT private.is_tgk_admin() THEN
   RAISE EXCEPTION 'Solo el administrador fundador puede invitar familias' USING ERRCODE='42501';
 END IF;
 v_email:=lower(btrim(p_email));
 IF v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' OR length(v_email)>254 THEN
   RAISE EXCEPTION 'Ingresa un correo electrónico válido';
 END IF;
 v_code:=encode(extensions.gen_random_bytes(20),'hex');
 INSERT INTO private.tgk_family_invites(email,code_hash,issued_by)
 VALUES(v_email,encode(extensions.digest(v_code,'sha256'),'hex'),auth.uid());
 RETURN v_code;
END; $$;
REVOKE ALL ON FUNCTION public.tgk_issue_family_invite(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tgk_issue_family_invite(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.tgk_redeem_family_invite(p_code text,p_slug text,p_name text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid; v_email text; v_id uuid; v_invite uuid; v_slug text; v_name text;
BEGIN
 v_uid:=auth.uid();
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión'; END IF;
 SELECT lower(email) INTO v_email FROM auth.users WHERE id=v_uid AND email_confirmed_at IS NOT NULL;
 IF v_email IS NULL THEN RAISE EXCEPTION 'Verifica tu correo antes de crear una tienda'; END IF;
 IF EXISTS (SELECT 1 FROM public.stores WHERE owner_user_id=v_uid) THEN
    RAISE EXCEPTION 'Esta cuenta ya administra una tienda';
 END IF;
 v_slug:=lower(btrim(p_slug));v_name:=btrim(p_name);
 IF length(v_slug)<3 OR length(v_slug)>48 OR v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
   RAISE EXCEPTION 'Identificador inválido (3-48 caracteres, letras, números y guiones)';
 END IF;
 IF length(v_name)<2 OR length(v_name)>90 THEN RAISE EXCEPTION 'Nombre de tienda inválido'; END IF;
 SELECT id INTO v_invite FROM private.tgk_family_invites
 WHERE code_hash=encode(extensions.digest(lower(btrim(p_code)),'sha256'),'hex')
   AND email=v_email AND redeemed_at IS NULL AND expires_at>now()
 FOR UPDATE;
 IF v_invite IS NULL THEN RAISE EXCEPTION 'Invitación inválida, vencida o destinada a otra cuenta'; END IF;
 INSERT INTO public.stores(owner_user_id,slug,display_name,is_published,radar_opt_in)
 VALUES(v_uid,v_slug,v_name,false,false) RETURNING id INTO v_id;
 INSERT INTO public.store_members(store_id,user_id,role) VALUES(v_id,v_uid,'owner');
 UPDATE private.tgk_family_invites SET redeemed_by=v_uid,redeemed_at=now() WHERE id=v_invite;
 RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.tgk_redeem_family_invite(text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tgk_redeem_family_invite(text,text,text) TO authenticated;

DROP POLICY IF EXISTS tgk_toys_public_anon_read ON public.toys;
DROP POLICY IF EXISTS tgk_toys_authenticated_read ON public.toys;
CREATE POLICY tgk_toys_public_anon_read ON public.toys FOR SELECT TO anon
USING (status <> 'hidden' AND EXISTS (
 SELECT 1 FROM public.storefronts sf WHERE sf.store_id=toys.store_id AND sf.is_published=true));
CREATE POLICY tgk_toys_authenticated_read ON public.toys FOR SELECT TO authenticated
USING (
 (status <> 'hidden' AND EXISTS (
   SELECT 1 FROM public.storefronts sf WHERE sf.store_id=toys.store_id AND sf.is_published=true))
 OR EXISTS (SELECT 1 FROM public.stores s
   WHERE s.id=toys.store_id AND s.owner_user_id=(SELECT auth.uid()))
);

-- Existing toy-photos is for founder only. Family uploads use a new, isolated bucket.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('family-media','family-media',true,4000000,ARRAY['image/jpeg']) ON CONFLICT(id) DO NOTHING;
CREATE POLICY tgk_family_media_owner_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
 bucket_id='family-media'
 AND name ~ '^[0-9a-f-]{36}/(toys|logo)/[0-9a-zA-Z._/-]+[.]jpg$'
 AND EXISTS (SELECT 1 FROM public.stores s WHERE s.id::text=split_part(name,'/',1)
   AND s.owner_user_id=(SELECT auth.uid()))
);
CREATE POLICY tgk_family_media_owner_select ON storage.objects FOR SELECT TO authenticated
USING (bucket_id='family-media' AND EXISTS (SELECT 1 FROM public.stores s
 WHERE s.id::text=split_part(name,'/',1) AND s.owner_user_id=(SELECT auth.uid())));
CREATE POLICY tgk_family_media_owner_delete ON storage.objects FOR DELETE TO authenticated
USING (bucket_id='family-media' AND EXISTS (SELECT 1 FROM public.stores s
 WHERE s.id::text=split_part(name,'/',1) AND s.owner_user_id=(SELECT auth.uid())));

COMMIT;
