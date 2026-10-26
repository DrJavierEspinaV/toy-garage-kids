-- Aplicada en Supabase: 20261026144259. No volver a ejecutar en producción.
BEGIN;
CREATE TABLE public.tgk_buyer_profiles (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 adult_declared boolean NOT NULL DEFAULT true CHECK(adult_declared=true),
 accepted_terms_version text NOT NULL DEFAULT 'buyer-pilot-v1' CHECK(accepted_terms_version='buyer-pilot-v1'),
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tgk_buyer_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tgk_buyer_profiles FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.tgk_buyer_profiles TO authenticated;
CREATE POLICY tgk_buyers_owner_read ON public.tgk_buyer_profiles
 FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE POLICY tgk_buyers_owner_register ON public.tgk_buyer_profiles
 FOR INSERT TO authenticated WITH CHECK (
  user_id=(SELECT auth.uid()) AND adult_declared IS TRUE
 );
-- Actual authorization of bids remains server-side.
CREATE OR REPLACE FUNCTION public.tgk_place_bid(p_battle_id uuid,p_amount integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_user uuid;v_battle public.tgk_battles%ROWTYPE;
 v_owner uuid;v_min integer;v_email_confirmed timestamptz;
BEGIN
 v_user:=auth.uid();
 IF v_user IS NULL THEN RAISE EXCEPTION 'Inicia sesión con una cuenta adulta para ofertar';END IF;
 IF NOT (
   EXISTS(SELECT 1 FROM public.tgk_buyer_profiles
     WHERE user_id=v_user AND adult_declared=true)
   OR EXISTS(SELECT 1 FROM public.stores WHERE owner_user_id=v_user)
 ) THEN
   RAISE EXCEPTION 'Para ofertar activa tu perfil gratuito de comprador adulto';
 END IF;
 SELECT email_confirmed_at INTO v_email_confirmed FROM auth.users WHERE id=v_user;
 IF v_email_confirmed IS NULL THEN RAISE EXCEPTION 'Confirma tu correo para ofertar';END IF;
 SELECT * INTO v_battle FROM public.tgk_battles WHERE id=p_battle_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Battle no encontrada';END IF;
 IF v_battle.state<>'active' OR clock_timestamp()>=v_battle.ends_at
 THEN RAISE EXCEPTION 'Esta Battle ya terminó y no admite ofertas';END IF;
 SELECT owner_user_id INTO v_owner FROM public.stores s
 WHERE s.id=v_battle.store_id AND s.is_published=true;
 IF v_owner IS NULL THEN RAISE EXCEPTION 'La tienda no está publicada';END IF;
 IF v_owner=v_user THEN RAISE EXCEPTION 'No puedes ofertar en tu propia tienda';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.toys
 WHERE id=v_battle.toy_id AND status='available')
 THEN RAISE EXCEPTION 'Juguete no disponible';END IF;
 v_min:=CASE WHEN v_battle.bid_count=0
  THEN v_battle.opening_bid ELSE v_battle.highest_bid+v_battle.bid_step END;
 IF p_amount IS NULL OR p_amount<v_min OR p_amount>100000000 OR p_amount%100<>0
 THEN RAISE EXCEPTION 'Oferta no válida: mínimo $%, en múltiplos de $100',v_min;END IF;
 IF v_battle.bid_count>=500 THEN RAISE EXCEPTION 'Límite de ofertas alcanzado';END IF;
 INSERT INTO public.tgk_bids(battle_id,bidder_user_id,amount)
 VALUES(p_battle_id,v_user,p_amount);
 UPDATE public.tgk_battles
 SET highest_bid=p_amount,bid_count=bid_count+1 WHERE id=p_battle_id;
 RETURN jsonb_build_object('accepted',true,'highest_bid',p_amount,'next_minimum',p_amount+v_battle.bid_step);
END;$$;
REVOKE ALL ON FUNCTION public.tgk_place_bid(uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tgk_place_bid(uuid,integer) TO authenticated;
COMMIT;