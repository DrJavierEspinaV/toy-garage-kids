-- Toy Garage Kids V1.6 · fase 1: infraestructura multifamiliar segura
-- Aplicar una sola vez sobre el proyecto Supabase de Toy Garage Kids.
-- Diseñada para NO romper index.html/admin.html de la tienda fundadora.
BEGIN;

DO $$
BEGIN
  IF (SELECT count(*) FROM public.admins) <> 1 THEN
    RAISE EXCEPTION 'Protección de migración: se esperaba un único administrador fundador';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' AND length(slug) <= 80),
  display_name text NOT NULL CHECK (length(btrim(display_name)) BETWEEN 2 AND 90),
  logo_url text NOT NULL DEFAULT '',
  tagline text NOT NULL DEFAULT '',
  contact_whatsapp text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT false,
  radar_opt_in boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stores FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.stores TO authenticated;
DROP POLICY IF EXISTS tgk_stores_owner_read ON public.stores;
CREATE POLICY tgk_stores_owner_read ON public.stores
  FOR SELECT TO authenticated USING (owner_user_id = (SELECT auth.uid()));
-- Sin INSERT, UPDATE ni DELETE desde clientes: alta de nuevas familias aún no habilitada.

INSERT INTO public.stores
  (id,owner_user_id,slug,display_name,logo_url,tagline,contact_whatsapp,is_published,radar_opt_in)
SELECT
  'd4549710-8c53-4901-bbee-f70fdb060f03'::uuid, a.user_id, 'cristobal-isidora',
  'Toy Garage Kids — Cristóbal e Isidora', './assets/toy-garage-kids-logo.webp',
  COALESCE(s.tagline,''), COALESCE(s.whatsapp,''), true, false
FROM public.admins a LEFT JOIN public.store_settings s ON s.id = 1
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.store_members (
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','editor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(store_id,user_id)
);
CREATE INDEX IF NOT EXISTS tgk_store_members_user_idx ON public.store_members(user_id);
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_members FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.store_members TO authenticated;
DROP POLICY IF EXISTS tgk_store_members_self_read ON public.store_members;
CREATE POLICY tgk_store_members_self_read ON public.store_members
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
-- Sin mutaciones de membresía desde el navegador hasta desarrollar invitaciones seguras.

INSERT INTO public.store_members(store_id,user_id,role)
SELECT id,owner_user_id,'owner' FROM public.stores WHERE id='d4549710-8c53-4901-bbee-f70fdb060f03'::uuid
ON CONFLICT (store_id,user_id) DO NOTHING;

ALTER TABLE public.toys ADD COLUMN IF NOT EXISTS store_id uuid;
UPDATE public.toys SET store_id='d4549710-8c53-4901-bbee-f70fdb060f03'::uuid WHERE store_id IS NULL;
ALTER TABLE public.toys ALTER COLUMN store_id SET DEFAULT 'd4549710-8c53-4901-bbee-f70fdb060f03'::uuid;
ALTER TABLE public.toys ALTER COLUMN store_id SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='toys_store_id_fkey' AND conrelid='public.toys'::regclass) THEN
    ALTER TABLE public.toys ADD CONSTRAINT toys_store_id_fkey FOREIGN KEY(store_id) REFERENCES public.stores(id) ON DELETE RESTRICT;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS tgk_toys_store_created_idx ON public.toys(store_id,created_at DESC);

-- Una consulta pública de la tienda histórica sigue mostrando SOLAMENTE juguetes de la tienda fundadora.
DROP POLICY IF EXISTS tgk_toys_public_read ON public.toys;
CREATE POLICY tgk_toys_public_read ON public.toys FOR SELECT TO anon,authenticated
  USING (store_id = 'd4549710-8c53-4901-bbee-f70fdb060f03'::uuid AND status <> 'hidden');

-- Los dueños solo ven/crean/editan/eliminan inventario de SU propia tienda.
DROP POLICY IF EXISTS tgk_toys_admin_insert ON public.toys;
DROP POLICY IF EXISTS tgk_toys_admin_update ON public.toys;
DROP POLICY IF EXISTS tgk_toys_admin_delete ON public.toys;
DROP POLICY IF EXISTS tgk_toys_owner_select ON public.toys;
DROP POLICY IF EXISTS tgk_toys_owner_insert ON public.toys;
DROP POLICY IF EXISTS tgk_toys_owner_update ON public.toys;
DROP POLICY IF EXISTS tgk_toys_owner_delete ON public.toys;

CREATE POLICY tgk_toys_owner_select ON public.toys FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.stores s WHERE s.id=toys.store_id AND s.owner_user_id=(SELECT auth.uid())));
CREATE POLICY tgk_toys_owner_insert ON public.toys FOR INSERT TO authenticated
  WITH CHECK (EXISTS(SELECT 1 FROM public.stores s WHERE s.id=toys.store_id AND s.owner_user_id=(SELECT auth.uid())));
CREATE POLICY tgk_toys_owner_update ON public.toys FOR UPDATE TO authenticated
  USING (EXISTS(SELECT 1 FROM public.stores s WHERE s.id=toys.store_id AND s.owner_user_id=(SELECT auth.uid())))
  WITH CHECK (EXISTS(SELECT 1 FROM public.stores s WHERE s.id=toys.store_id AND s.owner_user_id=(SELECT auth.uid())));
CREATE POLICY tgk_toys_owner_delete ON public.toys FOR DELETE TO authenticated
  USING (EXISTS(SELECT 1 FROM public.stores s WHERE s.id=toys.store_id AND s.owner_user_id=(SELECT auth.uid())));

-- Mantener public.store_settings(id=1) para los clientes existentes.
-- Este trigger replica ediciones futuras del fundador a su perfil sin exponer operaciones privilegiadas vía API.
CREATE OR REPLACE FUNCTION private.tgk_sync_founder_settings()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $body$
BEGIN
  UPDATE public.stores
  SET tagline = NEW.tagline,
      contact_whatsapp = NEW.whatsapp,
      updated_at = now()
  WHERE id = 'd4549710-8c53-4901-bbee-f70fdb060f03'::uuid;
  RETURN NEW;
END;
$body$;
REVOKE ALL ON FUNCTION private.tgk_sync_founder_settings() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS tgk_sync_founder_settings ON public.store_settings;
CREATE TRIGGER tgk_sync_founder_settings
AFTER INSERT OR UPDATE OF tagline,whatsapp ON public.store_settings
FOR EACH ROW EXECUTE FUNCTION private.tgk_sync_founder_settings();

COMMIT;