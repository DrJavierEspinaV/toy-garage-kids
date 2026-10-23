-- Versión aplicada y verificada en Supabase: 20261023200904
-- Archivo de referencia para despliegues en un entorno nuevo. No reaplicar al mismo proyecto.
BEGIN;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS poster_copy jsonb NOT NULL DEFAULT
 '{"headline":"MIS JUGUETES BUSCAN NUEVAS AVENTURAS","story":"Han sido parte de momentos muy bonitos y ahora están listos para seguir jugando.","closing":"Quizás sus próximas aventuras están contigo.","cta":"Escanea el QR y conócelos."}'::jsonb;
ALTER TABLE public.storefronts ADD COLUMN IF NOT EXISTS poster_copy jsonb NOT NULL DEFAULT
 '{"headline":"MIS JUGUETES BUSCAN NUEVAS AVENTURAS","story":"Han sido parte de momentos muy bonitos y ahora están listos para seguir jugando.","closing":"Quizás sus próximas aventuras están contigo.","cta":"Escanea el QR y conócelos."}'::jsonb;
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS tgk_poster_copy_valid;
ALTER TABLE public.stores ADD CONSTRAINT tgk_poster_copy_valid CHECK (
 jsonb_typeof(poster_copy)='object'
 AND jsonb_typeof(poster_copy->'headline')='string'
 AND jsonb_typeof(poster_copy->'story')='string'
 AND jsonb_typeof(poster_copy->'closing')='string'
 AND jsonb_typeof(poster_copy->'cta')='string'
 AND length(btrim(poster_copy->>'headline')) BETWEEN 10 AND 75
 AND length(btrim(poster_copy->>'story')) BETWEEN 10 AND 180
 AND length(btrim(poster_copy->>'closing')) BETWEEN 10 AND 100
 AND length(btrim(poster_copy->>'cta')) BETWEEN 10 AND 85
);
GRANT UPDATE(poster_copy) ON public.stores TO authenticated;
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
  radar_area_id,radar_opt_in,contact_whatsapp,theme_preset,poster_copy,updated_at
 ) VALUES (
  NEW.id,NEW.slug,NEW.display_name,NEW.logo_url,NEW.tagline,NEW.is_published,
  CASE WHEN NEW.radar_opt_in AND NEW.is_published THEN NEW.radar_area_id ELSE NULL END,
  (NEW.radar_opt_in AND NEW.is_published AND NEW.radar_area_id IS NOT NULL),
  CASE WHEN NEW.public_whatsapp_opt_in AND NEW.is_published THEN v_phone ELSE '' END,
  NEW.theme_preset,NEW.poster_copy,now()
 )
 ON CONFLICT(store_id) DO UPDATE SET
  slug=excluded.slug,display_name=excluded.display_name,
  logo_url=excluded.logo_url,tagline=excluded.tagline,
  is_published=excluded.is_published,radar_area_id=excluded.radar_area_id,
  radar_opt_in=excluded.radar_opt_in,
  contact_whatsapp=excluded.contact_whatsapp,theme_preset=excluded.theme_preset,
  poster_copy=excluded.poster_copy,updated_at=now();
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.tgk_sync_storefront() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS tgk_stores_storefront_sync ON public.stores;
CREATE TRIGGER tgk_stores_storefront_sync
AFTER INSERT OR UPDATE OF slug,display_name,logo_url,tagline,is_published,
 radar_area_id,radar_opt_in,contact_whatsapp,public_whatsapp_opt_in,theme_preset,poster_copy
ON public.stores FOR EACH ROW EXECUTE FUNCTION private.tgk_sync_storefront();
UPDATE public.stores SET poster_copy=poster_copy;
COMMIT;