-- Migración aplicada en Supabase (20261022221833); no ejecutar otra vez en este proyecto.
BEGIN;
CREATE INDEX IF NOT EXISTS tgk_invites_issued_by_idx ON private.tgk_family_invites(issued_by);
CREATE INDEX IF NOT EXISTS tgk_invites_redeemed_by_idx ON private.tgk_family_invites(redeemed_by);
CREATE INDEX IF NOT EXISTS tgk_stores_radar_area_idx ON public.stores(radar_area_id);
CREATE INDEX IF NOT EXISTS tgk_storefronts_area_optin_idx ON public.storefronts(radar_area_id,is_published,radar_opt_in);
DROP POLICY IF EXISTS tgk_connections_recipient_reply ON public.tgk_connections;
DROP POLICY IF EXISTS tgk_connections_sender_cancel ON public.tgk_connections;
CREATE POLICY tgk_connections_adults_update ON public.tgk_connections FOR UPDATE TO authenticated
 USING (
   status='pending' AND (
    EXISTS(SELECT 1 FROM public.stores s WHERE s.id=to_store_id AND s.owner_user_id=(SELECT auth.uid()))
    OR EXISTS(SELECT 1 FROM public.stores s WHERE s.id=from_store_id AND s.owner_user_id=(SELECT auth.uid()))
   )
 )
 WITH CHECK (
   (status IN ('accepted','declined','blocked') AND
    EXISTS(SELECT 1 FROM public.stores s WHERE s.id=to_store_id AND s.owner_user_id=(SELECT auth.uid())))
   OR
   (status='cancelled' AND
    EXISTS(SELECT 1 FROM public.stores s WHERE s.id=from_store_id AND s.owner_user_id=(SELECT auth.uid())))
 );
COMMIT;