
-- WALLETS
CREATE TABLE public.wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency TEXT NOT NULL DEFAULT 'RM',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage wallets" ON public.wallets FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- TRANSACTIONS LEDGER
CREATE TYPE public.txn_type AS ENUM ('topup','order','refund','adjustment','bonus');
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.txn_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wtx_user ON public.wallet_transactions(user_id, created_at DESC);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage transactions" ON public.wallet_transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- CREDIT PACKAGES
CREATE TABLE public.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits NUMERIC(12,2) NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  bonus NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view active packages" ON public.credit_packages FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage packages" ON public.credit_packages FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- TOPUP REQUESTS
CREATE TYPE public.payment_method AS ENUM ('fpx','duitnow','manual_bank');
CREATE TYPE public.topup_status AS ENUM ('pending','approved','rejected','cancelled');
CREATE TABLE public.topup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.credit_packages(id),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  credits NUMERIC(12,2) NOT NULL CHECK (credits > 0),
  method public.payment_method NOT NULL,
  reference TEXT,
  proof_url TEXT,
  status public.topup_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_topup_user ON public.topup_requests(user_id, created_at DESC);
CREATE INDEX idx_topup_status ON public.topup_requests(status);
ALTER TABLE public.topup_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own topups" ON public.topup_requests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users create own topups" ON public.topup_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Users cancel own pending topups" ON public.topup_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status = 'pending') WITH CHECK (auth.uid() = user_id AND status IN ('pending','cancelled'));
CREATE POLICY "Admins manage topups" ON public.topup_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- SERVICES
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  credit_price NUMERIC(12,2) NOT NULL CHECK (credit_price >= 0),
  delivery_eta TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone auth views active services" ON public.services FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage services" ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ORDERS
CREATE TYPE public.order_status AS ENUM ('pending','processing','completed','rejected','refunded');
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT 'TH-' || lpad((floor(random()*900000)+100000)::text,6,'0'),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  imei TEXT,
  notes TEXT,
  credits_charged NUMERIC(12,2) NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user ON public.orders(user_id, created_at DESC);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trg_wallets_touch BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_topup_touch BEFORE UPDATE ON public.topup_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- AUTO-CREATE WALLET ON SIGNUP (extend handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, display_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email,'@',1)), NEW.raw_user_meta_data ->> 'phone');

  _role := COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'role','')::public.app_role, 'customer');
  IF _role = 'admin' THEN _role := 'customer'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);

  INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 0);
  RETURN NEW;
END $$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill wallets for existing users
INSERT INTO public.wallets (user_id, balance)
SELECT id, 0 FROM auth.users WHERE id NOT IN (SELECT user_id FROM public.wallets);

-- APPROVE TOPUP (admin) — credits wallet + writes ledger
CREATE OR REPLACE FUNCTION public.approve_topup(_topup_id UUID, _note TEXT DEFAULT NULL)
RETURNS public.wallet_transactions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _t public.topup_requests; _new_balance NUMERIC(12,2); _txn public.wallet_transactions;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO _t FROM public.topup_requests WHERE id = _topup_id FOR UPDATE;
  IF _t.id IS NULL THEN RAISE EXCEPTION 'Top-up not found'; END IF;
  IF _t.status <> 'pending' THEN RAISE EXCEPTION 'Top-up not pending'; END IF;

  UPDATE public.wallets SET balance = balance + _t.credits WHERE user_id = _t.user_id RETURNING balance INTO _new_balance;
  IF _new_balance IS NULL THEN
    INSERT INTO public.wallets (user_id, balance) VALUES (_t.user_id, _t.credits) RETURNING balance INTO _new_balance;
  END IF;

  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, reference_id, description)
  VALUES (_t.user_id, 'topup', _t.credits, _new_balance, _t.id, 'Top-up approved (' || _t.method || ')')
  RETURNING * INTO _txn;

  UPDATE public.topup_requests SET status='approved', admin_note=_note, reviewed_by=auth.uid(), reviewed_at=now() WHERE id=_t.id;
  RETURN _txn;
END $$;

-- REJECT TOPUP
CREATE OR REPLACE FUNCTION public.reject_topup(_topup_id UUID, _note TEXT DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.topup_requests SET status='rejected', admin_note=_note, reviewed_by=auth.uid(), reviewed_at=now()
  WHERE id=_topup_id AND status='pending';
END $$;

-- PLACE ORDER — atomic credit deduction
CREATE OR REPLACE FUNCTION public.place_order(_service_id UUID, _imei TEXT DEFAULT NULL, _notes TEXT DEFAULT NULL)
RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID := auth.uid(); _svc public.services; _bal NUMERIC(12,2); _new_bal NUMERIC(12,2); _order public.orders;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _svc FROM public.services WHERE id=_service_id AND is_active=true;
  IF _svc.id IS NULL THEN RAISE EXCEPTION 'Service unavailable'; END IF;

  SELECT balance INTO _bal FROM public.wallets WHERE user_id=_uid FOR UPDATE;
  IF _bal IS NULL THEN
    INSERT INTO public.wallets (user_id, balance) VALUES (_uid, 0);
    _bal := 0;
  END IF;
  IF _bal < _svc.credit_price THEN RAISE EXCEPTION 'Insufficient credits' USING ERRCODE='P0001'; END IF;

  UPDATE public.wallets SET balance = balance - _svc.credit_price WHERE user_id=_uid RETURNING balance INTO _new_bal;

  INSERT INTO public.orders (user_id, service_id, imei, notes, credits_charged, status)
  VALUES (_uid, _svc.id, _imei, _notes, _svc.credit_price, 'processing') RETURNING * INTO _order;

  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, reference_id, description)
  VALUES (_uid, 'order', -_svc.credit_price, _new_bal, _order.id, 'Order ' || _order.order_number || ' — ' || _svc.name);

  RETURN _order;
END $$;

-- REFUND ORDER (admin)
CREATE OR REPLACE FUNCTION public.refund_order(_order_id UUID, _note TEXT DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _o public.orders; _new_bal NUMERIC(12,2);
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO _o FROM public.orders WHERE id=_order_id FOR UPDATE;
  IF _o.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF _o.status='refunded' THEN RAISE EXCEPTION 'Already refunded'; END IF;

  UPDATE public.wallets SET balance = balance + _o.credits_charged WHERE user_id=_o.user_id RETURNING balance INTO _new_bal;
  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, reference_id, description)
  VALUES (_o.user_id, 'refund', _o.credits_charged, _new_bal, _o.id, COALESCE(_note,'Order refunded ' || _o.order_number));
  UPDATE public.orders SET status='refunded' WHERE id=_o.id;
END $$;

-- STORAGE BUCKET for proofs (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs','payment-proofs', false) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Users upload own proofs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users view own proofs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='payment-proofs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "Admins manage proofs" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id='payment-proofs' AND public.has_role(auth.uid(),'admin')) WITH CHECK (bucket_id='payment-proofs' AND public.has_role(auth.uid(),'admin'));

-- SEED CREDIT PACKAGES
INSERT INTO public.credit_packages (name, credits, price, bonus, is_popular, sort_order) VALUES
  ('Starter Pack', 50, 50, 0, false, 1),
  ('Reseller Pack', 200, 195, 10, true, 2),
  ('Pro Pack', 500, 475, 50, false, 3),
  ('Enterprise Pack', 1000, 900, 150, false, 4);

-- SEED SERVICES
INSERT INTO public.services (name, category, brand, description, credit_price, delivery_eta) VALUES
  ('Samsung FRP Unlock — All Models', 'Android', 'Samsung', 'Bypass Google account lock on all Samsung devices', 25, '5-30 min'),
  ('iCloud Bypass — Premium', 'iPhone', 'Apple', 'Remove iCloud lock with full signal restore', 180, '1-24 hrs'),
  ('Network Unlock — Worldwide', 'Network', 'Carrier', 'Permanent carrier unlock via IMEI', 65, '1-3 days'),
  ('Mi Account Remove', 'Software', 'Xiaomi', 'Remove Mi cloud account permanently', 80, '10-60 min'),
  ('Huawei Bootloader / FRP / ID', 'Repair', 'Huawei', 'Unlock bootloader, remove FRP and Huawei ID', 45, '1-6 hrs'),
  ('Oppo Pattern & FRP Remove', 'Android', 'Oppo', 'Instant pattern lock and FRP removal', 20, 'Instant');
