-- Toy Garage Kids V1.6.1: ajustes posteriores a la migración principal
BEGIN;
CREATE INDEX IF NOT EXISTS tgk_stores_owner_user_idx ON public.stores(owner_user_id);
DROP POLICY IF EXISTS tgk_toys_owner_select ON public.toys;
DROP POLICY IF EXISTS tgk_toys_public_read ON public.toys;
CREATE POLICY tgk_toys_read ON public.toys FOR SELECT TO anon,authenticated
 USING (
  (store_id='d4549710-8c53-4901-bbee-f70fdb060f03'::uuid AND status <> 'hidden')
  OR EXISTS(
    SELECT 1 FROM public.stores s
    WHERE s.id=toys.store_id AND s.owner_user_id=(SELECT auth.uid())
  )
 );
COMMIT;