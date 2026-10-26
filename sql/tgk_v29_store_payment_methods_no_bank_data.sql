-- Ya aplicada en producción a la versión 20261026011855.
-- Aplicar solo una vez en un entorno nuevo.
BEGIN;
CREATE TABLE IF NOT EXISTS public.store_payment_options(
 store_id uuid PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
 transfer boolean NOT NULL DEFAULT false,
 cash_on_delivery boolean NOT NULL DEFAULT false,
 arrange_with_adult boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tgk_payment_at_least_one CHECK (transfer OR cash_on_delivery OR arrange_with_adult)
);
ALTER TABLE public.store_payment_options ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_payment_options FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.store_payment_options TO anon,authenticated;
GRANT INSERT,UPDATE ON public.store_payment_options TO authenticated;
DROP POLICY IF EXISTS tgk_payment_public_published_read ON public.store_payment_options;
CREATE POLICY tgk_payment_public_published_read
 ON public.store_payment_options FOR SELECT TO anon, authenticated
 USING (
   EXISTS (SELECT 1 FROM public.storefronts sf WHERE sf.store_id=store_payment_options.store_id AND sf.is_published=true)
 );
DROP POLICY IF EXISTS tgk_payment_owner_read ON public.store_payment_options;
CREATE POLICY tgk_payment_owner_read
 ON public.store_payment_options FOR SELECT TO authenticated
 USING (
   EXISTS (SELECT 1 FROM public.stores s
     WHERE s.id=store_payment_options.store_id AND s.owner_user_id=(SELECT auth.uid()))
 );
DROP POLICY IF EXISTS tgk_payment_owner_insert ON public.store_payment_options;
CREATE POLICY tgk_payment_owner_insert
 ON public.store_payment_options FOR INSERT TO authenticated
 WITH CHECK (
   EXISTS (SELECT 1 FROM public.stores s
     WHERE s.id=store_payment_options.store_id AND s.owner_user_id=(SELECT auth.uid()))
 );
DROP POLICY IF EXISTS tgk_payment_owner_update ON public.store_payment_options;
CREATE POLICY tgk_payment_owner_update
 ON public.store_payment_options FOR UPDATE TO authenticated
 USING (
   EXISTS (SELECT 1 FROM public.stores s
     WHERE s.id=store_payment_options.store_id AND s.owner_user_id=(SELECT auth.uid()))
 )
 WITH CHECK (
   EXISTS (SELECT 1 FROM public.stores s
     WHERE s.id=store_payment_options.store_id AND s.owner_user_id=(SELECT auth.uid()))
 );
COMMIT;