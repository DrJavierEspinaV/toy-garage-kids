-- V2.0 Migración aplicada 20261023115055; no ejecutar de nuevo en este proyecto.
BEGIN;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS public_whatsapp_opt_in boolean NOT NULL DEFAULT false;
ALTER TABLE public.storefronts ADD COLUMN IF NOT EXISTS contact_whatsapp text NOT NULL DEFAULT '';
GRANT UPDATE(contact_whatsapp,public_whatsapp_opt_in) ON public.stores TO authenticated;
-- La cuenta adulta decide explicitamente si su numero es visible en el catalogo.
-- Sin consentimiento, el numero privado se mantiene exclusivamente en stores.
CREATE OR REPLACE FUNCTION private.tgk_sync_storefront()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_phone text;
BEGIN
 v_phone := regexp_replace(coalesce(NEW.contact_whatsapp,''),'[^0-9]','','g');
 IF NEW.public_whatsapp_opt_in AND (NEW.contact_whatsapp IS NULL OR length(v_phone)<8 OR length(v_phone)>15) THEN
  RAISE EXCEPTION 'Para mostrar WhatsApp, ingresa un numero valido con codigo de pais (8-15 digitos)';
 END IF;
 INSERT INTO public.storefronts(
  store_id,slug,display_name,logo_url,tagline,is_published,radar_area_id,radar_opt_in,contact_whatsapp,updated_at)
 VALUES(
  NEW.id,NEW.slug,NEW.display_name,NEW.logo_url,NEW.tagline,NEW.is_published,
  CASE WHEN NEW.radar_opt_in AND NEW.is_published THEN NEW.radar_area_id ELSE NULL END,
  (NEW.radar_opt_in AND NEW.is_published AND NEW.radar_area_id IS NOT NULL),
  CASE WHEN NEW.public_whatsapp_opt_in AND NEW.is_published THEN v_phone ELSE '' END,
  now())
 ON CONFLICT(store_id) DO UPDATE SET
  slug=excluded.slug,display_name=excluded.display_name,logo_url=excluded.logo_url,
  tagline=excluded.tagline,is_published=excluded.is_published,
  radar_area_id=excluded.radar_area_id,radar_opt_in=excluded.radar_opt_in,
  contact_whatsapp=excluded.contact_whatsapp,updated_at=now();
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.tgk_sync_storefront() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS tgk_stores_storefront_sync ON public.stores;
CREATE TRIGGER tgk_stores_storefront_sync
AFTER INSERT OR UPDATE OF slug,display_name,logo_url,tagline,is_published,radar_area_id,radar_opt_in,contact_whatsapp,public_whatsapp_opt_in
ON public.stores FOR EACH ROW EXECUTE FUNCTION private.tgk_sync_storefront();
UPDATE public.stores SET public_whatsapp_opt_in=public_whatsapp_opt_in;
COMMIT;