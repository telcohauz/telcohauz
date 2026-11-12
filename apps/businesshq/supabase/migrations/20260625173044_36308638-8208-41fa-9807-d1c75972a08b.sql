
-- Enums
CREATE TYPE public.company_role AS ENUM ('owner','admin','manager','staff','viewer');
CREATE TYPE public.doc_category AS ENUM ('tax','hr','contracts','licenses','finance','other');
CREATE TYPE public.compliance_status AS ENUM ('pending','in_progress','completed','overdue');

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  active_company_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER tg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- companies
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL DEFAULT 'MY',
  industry text,
  business_type text,
  registration_no text,
  tax_id text,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tg_companies_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- company_members (must exist before policies referencing it)
CREATE TABLE public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.company_role NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_members TO authenticated;
GRANT ALL ON public.company_members TO service_role;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Security-definer membership helpers (avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_company_member(_company uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.company_members WHERE company_id = _company AND user_id = _user)
$$;

CREATE OR REPLACE FUNCTION public.has_company_role(_company uuid, _user uuid, _roles public.company_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.company_members
    WHERE company_id = _company AND user_id = _user AND role = ANY(_roles))
$$;

-- companies RLS
CREATE POLICY "companies member read" ON public.companies FOR SELECT TO authenticated
  USING (public.is_company_member(id, auth.uid()));
CREATE POLICY "companies owner insert" ON public.companies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "companies admin update" ON public.companies FOR UPDATE TO authenticated
  USING (public.has_company_role(id, auth.uid(), ARRAY['owner','admin']::public.company_role[]));
CREATE POLICY "companies owner delete" ON public.companies FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- Auto-add owner as member
CREATE OR REPLACE FUNCTION public.add_owner_as_member() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER tg_company_owner_member AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.add_owner_as_member();

-- company_members RLS
CREATE POLICY "members read" ON public.company_members FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "members admin manage insert" ON public.company_members FOR INSERT TO authenticated
  WITH CHECK (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin']::public.company_role[]));
CREATE POLICY "members admin manage update" ON public.company_members FOR UPDATE TO authenticated
  USING (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin']::public.company_role[]));
CREATE POLICY "members admin manage delete" ON public.company_members FOR DELETE TO authenticated
  USING (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin']::public.company_role[]));

-- Generic tenant table builder via SQL
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  category public.doc_category NOT NULL DEFAULT 'other',
  storage_path text,
  size_bytes bigint,
  mime_type text,
  tags text[] DEFAULT '{}',
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "docs member read" ON public.documents FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "docs member write" ON public.documents FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "docs member update" ON public.documents FOR UPDATE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "docs admin delete" ON public.documents FOR DELETE TO authenticated
  USING (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin','manager']::public.company_role[]));

CREATE TABLE public.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  issuer text,
  reference_no text,
  issued_on date,
  expires_on date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.licenses TO authenticated;
GRANT ALL ON public.licenses TO service_role;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lic member read" ON public.licenses FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "lic member write" ON public.licenses FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "lic member update" ON public.licenses FOR UPDATE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "lic admin delete" ON public.licenses FOR DELETE TO authenticated
  USING (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin','manager']::public.company_role[]));

CREATE TABLE public.compliance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  due_date date,
  status public.compliance_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_items TO authenticated;
GRANT ALL ON public.compliance_items TO service_role;
ALTER TABLE public.compliance_items ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tg_compliance_updated BEFORE UPDATE ON public.compliance_items FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "comp member read" ON public.compliance_items FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "comp member write" ON public.compliance_items FOR INSERT TO authenticated
  WITH CHECK (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "comp member update" ON public.compliance_items FOR UPDATE TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));
CREATE POLICY "comp admin delete" ON public.compliance_items FOR DELETE TO authenticated
  USING (public.has_company_role(company_id, auth.uid(), ARRAY['owner','admin','manager']::public.company_role[]));

CREATE TABLE public.ai_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'New conversation',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chats TO authenticated;
GRANT ALL ON public.ai_chats TO service_role;
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tg_ai_chats_updated BEFORE UPDATE ON public.ai_chats FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "chats self all" ON public.ai_chats FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
