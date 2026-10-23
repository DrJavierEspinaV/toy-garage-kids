-- MIGRACIÓN YA APLICADA EN SUPABASE · tgk_v23_shared_toy_identity_theme_and_product_kind (20261023145525)
-- Para entornos nuevos, aplicar una sola vez; no reejecutar sobre producción.
BEGIN;
ALTER TABLE public.stores
 ADD COLUMN IF NOT EXISTS theme_preset text NOT NULL DEFAULT 'galaxia';
ALTER TABLE public.stores
 DROP CONSTRAINT IF EXISTS tgk_stores_theme_preset_check;
ALTER TABLE public.stores
 ADD CONSTRAINT tgk_stores_theme_preset_check
 CHECK (theme_preset IN ('galaxia','caramelo','menta','sol','oceano'));
ALTER TABLE public.storefronts
 ADD COLUMN IF NOT EXISTS theme_preset text NOT NULL DEFAULT 'galaxia';
ALTER TABLE public.storefronts
 DROP CONSTRAINT IF EXISTS tgk_storefronts_theme_preset_check;
ALTER TABLE public.storefronts
 ADD CONSTRAINT tgk_storefronts_theme_preset_check
 CHECK (theme_preset IN ('galaxia','caramelo','menta','sol','oceano'));
ALTER TABLE public.toys
 ADD COLUMN IF NOT EXISTS product_kind text NOT NULL DEFAULT 'reutilizado';
ALTER TABLE public.toys
 DROP CONSTRAINT IF EXISTS tgk_toys_product_kind_check;
ALTER TABLE public.toys
 ADD CONSTRAINT tgk_toys_product_kind_check
 CHECK (product_kind IN ('reutilizado','creacion'));
-- Los colores se limitan a temas infantiles predefinidos, no a CSS arbitrario.
GRANT UPDATE(theme_preset) ON public.stores TO authenticated;
CREATE OR REPLACE FUNCTION private.tgk_sync_storefront()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_phone text;
BEGIN
 v_phone:=regexp_replace(coalesce(NEW.contact_whatsapp,''),'[^0-9]','','g');
 IF NEW.public_whatsapp_opt_in AND (length(v_phone)<8 OR length(v_phone)>15) THEN
  RAISE EXCEPTION 'Para mostrar WhatsApp, ingresa un número válido con código de país';
 END IF;
 INSERT INTO public.storefronts(
  store_id,slug,display_name,logo_url,tagline,is_published,
  radar_area_id,radar_opt_in,contact_whatsapp,theme_preset,updated_at
 ) VALUES (
  NEW.id,NEW.slug,NEW.display_name,NEW.logo_url,NEW.tagline,NEW.is_published,
  CASE WHEN NEW.radar_opt_in AND NEW.is_published THEN NEW.radar_area_id ELSE NULL END,
  (NEW.radar_opt_in AND NEW.is_published AND NEW.radar_area_id IS NOT NULL),
  CASE WHEN NEW.public_whatsapp_opt_in AND NEW.is_published THEN v_phone ELSE '' END,
  NEW.theme_preset,now()
 )
 ON CONFLICT(store_id) DO UPDATE SET
  slug=excluded.slug,display_name=excluded.display_name,
  logo_url=excluded.logo_url,tagline=excluded.tagline,
  is_published=excluded.is_published,radar_area_id=excluded.radar_area_id,
  radar_opt_in=excluded.radar_opt_in,
  contact_whatsapp=excluded.contact_whatsapp,
  theme_preset=excluded.theme_preset,updated_at=now();
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.tgk_sync_storefront() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS tgk_stores_storefront_sync ON public.stores;
CREATE TRIGGER tgk_stores_storefront_sync
AFTER INSERT OR UPDATE OF slug,display_name,logo_url,tagline,is_published,
 radar_area_id,radar_opt_in,contact_whatsapp,public_whatsapp_opt_in,theme_preset
ON public.stores FOR EACH ROW EXECUTE FUNCTION private.tgk_sync_storefront();
-- Reconciliar filas sin cambiar ajustes existentes.
UPDATE public.stores SET theme_preset=theme_preset;
COMMIT;