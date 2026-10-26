-- Migración aplicada en Supabase, versión 20261026014743.
-- Aplicar solo en entornos nuevos; revisar cron.schedule en cada proyecto.
BEGIN;
CREATE TABLE IF NOT EXISTS public.tgk_battles(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 toy_id uuid NOT NULL UNIQUE REFERENCES public.toys(id) ON DELETE RESTRICT,
 store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
 opening_bid integer NOT NULL CHECK(opening_bid BETWEEN 100 AND 50000000),
 bid_step integer NOT NULL CHECK(bid_step BETWEEN 100 AND 10000000),
 highest_bid integer CHECK(highest_bid BETWEEN 100 AND 100000000),
 bid_count integer NOT NULL DEFAULT 0 CHECK(bid_count BETWEEN 0 AND 500),
 ends_at timestamptz NOT NULL,
 state text NOT NULL DEFAULT 'active' CHECK(state IN('active','closed')),
 created_at timestamptz NOT NULL DEFAULT now(),
 closed_at timestamptz,
 CONSTRAINT tgk_battle_bid_state CHECK(
   (bid_count=0 AND highest_bid IS NULL) OR (bid_count>0 AND highest_bid>=opening_bid)
 )
);
CREATE INDEX IF NOT EXISTS tgk_battles_due_idx ON public.tgk_battles(ends_at) WHERE state='active';
CREATE INDEX IF NOT EXISTS tgk_battles_store_idx ON public.tgk_battles(store_id,created_at DESC);
CREATE TABLE IF NOT EXISTS public.tgk_bids(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 battle_id uuid NOT NULL REFERENCES public.tgk_battles(id) ON DELETE RESTRICT,
 bidder_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 amount integer NOT NULL CHECK(amount BETWEEN 100 AND 100000000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tgk_bids_battle_rank_idx ON public.tgk_bids(battle_id,amount DESC,created_at,id);
CREATE INDEX IF NOT EXISTS tgk_bids_user_idx ON public.tgk_bids(bidder_user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS public.tgk_battle_notifications(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 battle_id uuid NOT NULL REFERENCES public.tgk_battles(id) ON DELETE RESTRICT,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN('winner','seller_won','seller_no_bids')),
 title text NOT NULL CHECK(length(title) BETWEEN 3 AND 120),
 message text NOT NULL CHECK(length(message) BETWEEN 10 AND 650),
 created_at timestamptz NOT NULL DEFAULT now(),
 read_at timestamptz,
 UNIQUE (battle_id,user_id,kind)
);
CREATE INDEX IF NOT EXISTS tgk_battle_notifications_user_idx ON public.tgk_battle_notifications(user_id,created_at DESC);
ALTER TABLE public.tgk_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tgk_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tgk_battle_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tgk_battles, public.tgk_bids, public.tgk_battle_notifications FROM PUBLIC,anon,authenticated;
GRANT SELECT(id,toy_id,store_id,opening_bid,bid_step,highest_bid,bid_count,ends_at,state,created_at,closed_at)
 ON public.tgk_battles TO anon,authenticated;
GRANT SELECT ON public.tgk_bids TO authenticated;
GRANT SELECT,UPDATE(read_at) ON public.tgk_battle_notifications TO authenticated;
CREATE POLICY tgk_battles_read_public ON public.tgk_battles
 FOR SELECT TO anon,authenticated USING(
 EXISTS(SELECT 1 FROM public.storefronts sf
 WHERE sf.store_id=tgk_battles.store_id AND sf.is_published=true)
 );
CREATE POLICY tgk_battles_read_owner ON public.tgk_battles
 FOR SELECT TO authenticated USING(
 EXISTS(SELECT 1 FROM public.stores s WHERE s.id=tgk_battles.store_id AND s.owner_user_id=(SELECT auth.uid()))
 );
CREATE POLICY tgk_bids_read_self_or_seller ON public.tgk_bids
 FOR SELECT TO authenticated USING(
 bidder_user_id=(SELECT auth.uid()) OR
 EXISTS(SELECT 1 FROM public.tgk_battles b
  JOIN public.stores s ON s.id=b.store_id
  WHERE b.id=tgk_bids.battle_id AND s.owner_user_id=(SELECT auth.uid()))
 );
CREATE POLICY tgk_notifications_read_self ON public.tgk_battle_notifications
 FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
CREATE POLICY tgk_notifications_mark_self ON public.tgk_battle_notifications
 FOR UPDATE TO authenticated USING(user_id=(SELECT auth.uid()))
 WITH CHECK(user_id=(SELECT auth.uid()));

-- Active auctions lock the critical toy properties; do not permit deleting an active listing.
CREATE OR REPLACE FUNCTION private.tgk_guard_battle_toy()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM public.tgk_battles b WHERE b.toy_id=OLD.id AND b.state='active') THEN
   IF TG_OP='DELETE' THEN RAISE EXCEPTION 'No puedes eliminar un juguete con Battle activa'; END IF;
   IF NEW.store_id IS DISTINCT FROM OLD.store_id
    OR NEW.status IS DISTINCT FROM OLD.status
    OR NEW.sale_mode IS DISTINCT FROM OLD.sale_mode
    OR NEW.battle_base IS DISTINCT FROM OLD.battle_base
    OR NEW.battle_step IS DISTINCT FROM OLD.battle_step
    OR NEW.battle_ends_at IS DISTINCT FROM OLD.battle_ends_at
    OR NEW.price IS DISTINCT FROM OLD.price THEN
    RAISE EXCEPTION 'La Battle está activa: precio, plazo, modalidad y disponibilidad están protegidos';
   END IF;
 END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END;$$;
REVOKE ALL ON FUNCTION private.tgk_guard_battle_toy() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS tgk_protect_active_battle_toy ON public.toys;
CREATE TRIGGER tgk_protect_active_battle_toy
 BEFORE UPDATE OR DELETE ON public.toys FOR EACH ROW EXECUTE FUNCTION private.tgk_guard_battle_toy();

-- Atomic launch with strict owner identity, store publication and server clock.
CREATE OR REPLACE FUNCTION public.tgk_start_battle(p_toy_id uuid,p_opening integer,p_step integer,p_ends_at timestamptz)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_user uuid;v_toy public.toys%ROWTYPE;v_store public.stores%ROWTYPE;v_id uuid;
BEGIN
 v_user:=auth.uid();
 IF v_user IS NULL THEN RAISE EXCEPTION 'Debes iniciar sesión como adulto propietario'; END IF;
 IF p_opening IS NULL OR p_opening<100 OR p_opening>50000000 OR p_opening%100<>0
  OR p_step IS NULL OR p_step<100 OR p_step>10000000 OR p_step%100<>0 THEN
   RAISE EXCEPTION 'Precios de salida e incrementos: múltiplos de $100, dentro de límites válidos';
 END IF;
 IF p_ends_at IS NULL OR p_ends_at<now()+interval '15 minutes' OR p_ends_at>now()+interval '14 days'
 THEN RAISE EXCEPTION 'Duración permitida: entre 15 minutos y 14 días';END IF;
 SELECT * INTO v_toy FROM public.toys WHERE id=p_toy_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'No existe el juguete'; END IF;
 SELECT * INTO v_store FROM public.stores WHERE id=v_toy.store_id;
 IF v_store.owner_user_id IS DISTINCT FROM v_user OR v_store.is_published IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'Solo el adulto dueño de una tienda publicada puede activar la Battle'; END IF;
 IF v_toy.status <> 'available' THEN RAISE EXCEPTION 'Solo se pueden subastar juguetes disponibles'; END IF;
 IF EXISTS(SELECT 1 FROM public.tgk_battles WHERE toy_id=p_toy_id)
 THEN RAISE EXCEPTION 'Este juguete ya tiene una Battle registrada'; END IF;
 IF (SELECT count(*) FROM public.tgk_battles WHERE store_id=v_toy.store_id AND state='active')>=10
 THEN RAISE EXCEPTION 'Límite de 10 Battles abiertas por tienda';END IF;
 UPDATE public.toys SET sale_mode='battle',battle_base=p_opening,
  battle_step=p_step,battle_ends_at=p_ends_at,updated_at=now()
 WHERE id=p_toy_id;
 INSERT INTO public.tgk_battles(toy_id,store_id,opening_bid,bid_step,ends_at)
 VALUES(p_toy_id,v_toy.store_id,p_opening,p_step,p_ends_at) RETURNING id INTO v_id;
 RETURN v_id;
END;$$;
REVOKE ALL ON FUNCTION public.tgk_start_battle(uuid,integer,integer,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tgk_start_battle(uuid,integer,integer,timestamptz) TO authenticated;

-- Atomic bidding, serialized on auction row; no direct table writes from browser.
CREATE OR REPLACE FUNCTION public.tgk_place_bid(p_battle_id uuid,p_amount integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_user uuid;v_battle public.tgk_battles%ROWTYPE;v_owner uuid;v_min integer;v_email_confirmed timestamptz;
BEGIN
 v_user:=auth.uid();IF v_user IS NULL THEN RAISE EXCEPTION 'Inicia sesión para ofertar';END IF;
 -- During pilot, bidders must be invited adults who have activated their own store.
 IF NOT EXISTS(SELECT 1 FROM public.stores WHERE owner_user_id=v_user)
 THEN RAISE EXCEPTION 'En el piloto solo ofertan adultos con una tienda activada';END IF;
 SELECT email_confirmed_at INTO v_email_confirmed FROM auth.users WHERE id=v_user;
 IF v_email_confirmed IS NULL THEN RAISE EXCEPTION 'Confirma tu correo para ofertar';END IF;
 SELECT * INTO v_battle FROM public.tgk_battles WHERE id=p_battle_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Battle no encontrada'; END IF;
 IF v_battle.state<>'active' OR clock_timestamp()>=v_battle.ends_at
 THEN RAISE EXCEPTION 'Esta Battle ya terminó y no admite ofertas'; END IF;
 SELECT owner_user_id INTO v_owner FROM public.stores s WHERE s.id=v_battle.store_id AND s.is_published=true;
 IF v_owner IS NULL THEN RAISE EXCEPTION 'La tienda no está publicada';END IF;
 IF v_owner=v_user THEN RAISE EXCEPTION 'No puedes ofertar en tu propia tienda';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.toys WHERE id=v_battle.toy_id AND status='available')
 THEN RAISE EXCEPTION 'Juguete no disponible';END IF;
 v_min:=CASE WHEN v_battle.bid_count=0 THEN v_battle.opening_bid ELSE v_battle.highest_bid+v_battle.bid_step END;
 IF p_amount IS NULL OR p_amount<v_min OR p_amount>100000000 OR p_amount%100<>0
 THEN RAISE EXCEPTION 'Oferta no válida: mínimo $%, en múltiplos de $100',v_min;END IF;
 IF v_battle.bid_count>=500 THEN RAISE EXCEPTION 'Límite de ofertas alcanzado';END IF;
 INSERT INTO public.tgk_bids(battle_id,bidder_user_id,amount) VALUES(p_battle_id,v_user,p_amount);
 UPDATE public.tgk_battles SET highest_bid=p_amount,bid_count=bid_count+1 WHERE id=p_battle_id;
 RETURN jsonb_build_object('accepted',true,'highest_bid',p_amount,'next_minimum',p_amount+v_battle.bid_step);
END;$$;
REVOKE ALL ON FUNCTION public.tgk_place_bid(uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.tgk_place_bid(uuid,integer) TO authenticated;

-- Close expired battles and create one private in-app message per recipient.
CREATE OR REPLACE FUNCTION private.tgk_close_due_battles()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_row record;v_bid record;v_owner uuid;v_toy_title text;v_done integer:=0;
BEGIN
 FOR v_row IN SELECT id,toy_id,store_id FROM public.tgk_battles
   WHERE state='active' AND ends_at<=clock_timestamp()
   ORDER BY ends_at FOR UPDATE SKIP LOCKED LIMIT 100 LOOP
  SELECT b.bidder_user_id,b.amount INTO v_bid
   FROM public.tgk_bids b WHERE b.battle_id=v_row.id
   ORDER BY b.amount DESC,b.created_at ASC,b.id ASC LIMIT 1;
  SELECT owner_user_id INTO v_owner FROM public.stores WHERE id=v_row.store_id;
  SELECT title INTO v_toy_title FROM public.toys WHERE id=v_row.toy_id;
  UPDATE public.tgk_battles SET state='closed',closed_at=now() WHERE id=v_row.id;
  IF v_bid.bidder_user_id IS NOT NULL THEN
   INSERT INTO public.tgk_battle_notifications(battle_id,user_id,kind,title,message)
   VALUES(v_row.id,v_bid.bidder_user_id,'winner','🏆 ¡Ganaste la Battle!',
    'Tu oferta ganadora por «'||left(coalesce(v_toy_title,'este juguete'),100)||
    '» fue de $'||to_char(v_bid.amount,'FM999G999G999')||
    '. Entra a la tienda para coordinar el pago y la entrega con el adulto vendedor. No pagues sin confirmar sus datos.')
   ON CONFLICT(battle_id,user_id,kind) DO NOTHING;
   IF v_owner IS NOT NULL THEN
    INSERT INTO public.tgk_battle_notifications(battle_id,user_id,kind,title,message)
    VALUES(v_row.id,v_owner,'seller_won','🎉 Tu Battle terminó con ganador',
    '«'||left(coalesce(v_toy_title,'Juguete'),100)||'» recibió una oferta ganadora de $'||
      to_char(v_bid.amount,'FM999G999G999')||'. Revisa las ofertas y coordina la venta directamente con el adulto ganador.')
    ON CONFLICT(battle_id,user_id,kind) DO NOTHING;
   END IF;
   UPDATE public.toys SET status='reserved',updated_at=now() WHERE id=v_row.toy_id AND status='available';
  ELSE
   IF v_owner IS NOT NULL THEN
    INSERT INTO public.tgk_battle_notifications(battle_id,user_id,kind,title,message)
    VALUES(v_row.id,v_owner,'seller_no_bids','⌛ Tu Battle terminó sin ofertas',
      'La Battle de «'||left(coalesce(v_toy_title,'Juguete'),100)||
      '» terminó sin propuestas. Puedes decidir cómo continuar con el juguete.')
    ON CONFLICT(battle_id,user_id,kind) DO NOTHING;
   END IF;
  END IF;
  v_bid:=NULL;
  v_done:=v_done+1;
 END LOOP;
 RETURN v_done;
END;$$;
REVOKE ALL ON FUNCTION private.tgk_close_due_battles() FROM PUBLIC,anon,authenticated;
SELECT cron.schedule('tgk-battles-v1-close','* * * * *','SELECT private.tgk_close_due_battles()');
COMMIT;