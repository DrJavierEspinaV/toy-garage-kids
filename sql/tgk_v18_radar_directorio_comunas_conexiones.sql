-- Actual migration applied to Supabase: tgk_v18_radar_directorio_comunas_conexiones (20261022220637)
-- Do not re-run against this project.
-- TGK V1.8 A · Red de tiendas y solicitudes solo entre adultos (piloto por invitación)
-- El usuario escoge una comuna pública de referencia. No se almacena GPS, domicilio ni coordenada.
BEGIN;
CREATE TABLE public.radar_areas (
  id text PRIMARY KEY CHECK (length(id) between 3 and 80 AND id ~ '^[a-z0-9-]+$'),
  label text NOT NULL CHECK (length(label) between 2 and 90)
);
INSERT INTO public.radar_areas(id,label) VALUES
('santiago','Santiago'),('providencia','Providencia'),('las-condes','Las Condes'),('vitacura','Vitacura'),
('lo-barnechea','Lo Barnechea'),('huechuraba','Huechuraba'),('recoleta','Recoleta'),
('independencia','Independencia'),('conchali','Conchalí'),('quilicura','Quilicura'),
('renca','Renca'),('quinta-normal','Quinta Normal'),('maipu','Maipú'),('pudahuel','Pudahuel'),
('estacion-central','Estación Central'),('nunoa','Ñuñoa'),('la-reina','La Reina'),
('penalolen','Peñalolén'),('macul','Macul'),('la-florida','La Florida'),('puente-alto','Puente Alto'),
('san-miguel','San Miguel'),('san-joaquin','San Joaquín'),('la-cisterna','La Cisterna'),
('la-granja','La Granja'),('san-bernardo','San Bernardo'),('el-bosque','El Bosque'),
('cerrillos','Cerrillos'),('lo-prado','Lo Prado'),('penaflor','Peñaflor'),
('vina-del-mar','Viña del Mar'),('valparaiso','Valparaíso'),('concon','Concón'),
('quilpue','Quilpué'),('concepcion','Concepción'),('talcahuano','Talcahuano'),
('temuco','Temuco'),('la-serena','La Serena'),('coquimbo','Coquimbo'),
('antofagasta','Antofagasta'),('rancagua','Rancagua'),('talca','Talca'),
('puerto-montt','Puerto Montt'),('valdivia','Valdivia'),('osorno','Osorno');
ALTER TABLE public.radar_areas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.radar_areas FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.radar_areas TO anon,authenticated;
CREATE POLICY tgk_radar_areas_read ON public.radar_areas FOR SELECT TO anon,authenticated USING(true);

ALTER TABLE public.stores ADD COLUMN radar_area_id text REFERENCES public.radar_areas(id) ON DELETE SET NULL;
ALTER TABLE public.storefronts ADD COLUMN radar_area_id text REFERENCES public.radar_areas(id) ON DELETE SET NULL;
ALTER TABLE public.storefronts ADD COLUMN radar_opt_in boolean NOT NULL DEFAULT false;
GRANT UPDATE (radar_opt_in,radar_area_id) ON public.stores TO authenticated;

CREATE OR REPLACE FUNCTION private.tgk_sync_storefront()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 INSERT INTO public.storefronts(store_id,slug,display_name,logo_url,tagline,is_published,radar_area_id,radar_opt_in,updated_at)
 VALUES(NEW.id,NEW.slug,NEW.display_name,NEW.logo_url,NEW.tagline,NEW.is_published,
   CASE WHEN NEW.radar_opt_in AND NEW.is_published THEN NEW.radar_area_id ELSE NULL END,
   (NEW.radar_opt_in AND NEW.is_published AND NEW.radar_area_id IS NOT NULL),now())
 ON CONFLICT (store_id) DO UPDATE SET
  slug=excluded.slug,display_name=excluded.display_name,logo_url=excluded.logo_url,
  tagline=excluded.tagline,is_published=excluded.is_published,
  radar_area_id=excluded.radar_area_id,radar_opt_in=excluded.radar_opt_in,updated_at=now();
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.tgk_sync_storefront() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS tgk_stores_storefront_sync ON public.stores;
CREATE TRIGGER tgk_stores_storefront_sync
AFTER INSERT OR UPDATE OF slug,display_name,logo_url,tagline,is_published,radar_area_id,radar_opt_in
ON public.stores FOR EACH ROW EXECUTE FUNCTION private.tgk_sync_storefront();

CREATE TABLE public.tgk_connections (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 from_store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
 to_store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'pending'
   CHECK(status IN ('pending','accepted','declined','blocked','cancelled')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tgk_connections_not_self CHECK(from_store_id <> to_store_id)
);
CREATE UNIQUE INDEX tgk_connections_unique_pair ON public.tgk_connections(
 LEAST(from_store_id,to_store_id),GREATEST(from_store_id,to_store_id));
CREATE INDEX tgk_connections_from_idx ON public.tgk_connections(from_store_id,created_at DESC);
CREATE INDEX tgk_connections_to_idx ON public.tgk_connections(to_store_id,created_at DESC);
ALTER TABLE public.tgk_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tgk_connections FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.tgk_connections TO authenticated;
GRANT UPDATE(status) ON public.tgk_connections TO authenticated;

CREATE POLICY tgk_connections_own_read ON public.tgk_connections FOR SELECT TO authenticated
 USING (
  EXISTS(SELECT 1 FROM public.stores s WHERE s.id=from_store_id AND s.owner_user_id=(SELECT auth.uid()))
  OR EXISTS(SELECT 1 FROM public.stores s WHERE s.id=to_store_id AND s.owner_user_id=(SELECT auth.uid()))
 );
CREATE POLICY tgk_connections_owner_send ON public.tgk_connections FOR INSERT TO authenticated
 WITH CHECK (
   status='pending'
   AND from_store_id<>to_store_id
   AND EXISTS(SELECT 1 FROM public.stores s
     WHERE s.id=from_store_id AND s.owner_user_id=(SELECT auth.uid()) AND s.is_published AND s.radar_opt_in AND s.radar_area_id IS NOT NULL)
   AND EXISTS(SELECT 1 FROM public.storefronts sf
     WHERE sf.store_id=to_store_id AND sf.is_published AND sf.radar_opt_in AND sf.radar_area_id IS NOT NULL)
 );
CREATE POLICY tgk_connections_recipient_reply ON public.tgk_connections FOR UPDATE TO authenticated
 USING (
   status='pending'
   AND EXISTS(SELECT 1 FROM public.stores s WHERE s.id=to_store_id AND s.owner_user_id=(SELECT auth.uid()))
 )
 WITH CHECK (
   status IN ('accepted','declined','blocked')
   AND EXISTS(SELECT 1 FROM public.stores s WHERE s.id=to_store_id AND s.owner_user_id=(SELECT auth.uid()))
 );
CREATE POLICY tgk_connections_sender_cancel ON public.tgk_connections FOR UPDATE TO authenticated
 USING (
   status='pending'
   AND EXISTS(SELECT 1 FROM public.stores s WHERE s.id=from_store_id AND s.owner_user_id=(SELECT auth.uid()))
 )
 WITH CHECK (
   status='cancelled'
   AND EXISTS(SELECT 1 FROM public.stores s WHERE s.id=from_store_id AND s.owner_user_id=(SELECT auth.uid()))
 );

-- Security-definer trigger is private, not callable as an exposed API endpoint.
CREATE OR REPLACE FUNCTION private.tgk_check_connection_rate()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF (SELECT count(*) FROM public.tgk_connections
     WHERE from_store_id=NEW.from_store_id AND created_at>now()-interval '24 hours')>=10 THEN
   RAISE EXCEPTION 'Límite de 10 solicitudes cada 24 horas por tienda';
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.tgk_check_connection_rate() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER tgk_connections_rate_before_insert BEFORE INSERT ON public.tgk_connections
FOR EACH ROW EXECUTE FUNCTION private.tgk_check_connection_rate();
COMMIT;