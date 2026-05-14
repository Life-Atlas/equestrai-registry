-- Foundation migration: multi-tenant registry schema
-- Schema: equestrai (NEVER public)
-- Tables: tenants, profiles, horses, applications, documents,
--         ownership_history, notifications, fee_schedules, audit_log

CREATE SCHEMA IF NOT EXISTS equestrai;

-- =============================================================
-- 1. TENANTS — multi-tenant root
-- =============================================================
CREATE TABLE equestrai.tenants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  name          text NOT NULL,
  short_name    text,
  logo_url      text,
  primary_color text DEFAULT '#1a3a5c',
  website_url   text,
  contact_email text,
  contact_phone text,
  address       jsonb,
  settings      jsonb DEFAULT '{}',
  status        text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'onboarding')),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE equestrai.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tenants"
  ON equestrai.tenants FOR SELECT
  USING (status = 'active');

-- =============================================================
-- 2. PROFILES — extends auth.users
-- =============================================================
CREATE TABLE equestrai.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id       uuid NOT NULL REFERENCES equestrai.tenants(id),
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  display_name    text GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  phone           text,
  preferred_lang  text DEFAULT 'en' CHECK (preferred_lang IN ('en', 'es')),
  notify_channel  text DEFAULT 'email' CHECK (notify_channel IN ('email', 'sms', 'whatsapp')),
  whatsapp_number text,
  role            text DEFAULT 'member' CHECK (role IN ('member', 'staff', 'admin', 'board')),
  membership_type text DEFAULT 'standard' CHECK (membership_type IN ('standard', 'premium', 'lifetime', 'non_member')),
  membership_expires_at timestamptz,
  farm_name       text,
  address         jsonb,
  is_agent        boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE equestrai.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own profile"
  ON equestrai.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Staff see all profiles in tenant"
  ON equestrai.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM equestrai.profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = equestrai.profiles.tenant_id
        AND p.role IN ('staff', 'admin', 'board')
    )
  );

CREATE POLICY "Users update own profile"
  ON equestrai.profiles FOR UPDATE
  USING (auth.uid() = id);

-- =============================================================
-- 3. HORSES — core entity
-- =============================================================
CREATE TABLE equestrai.horses (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES equestrai.tenants(id),
  registration_number text,
  name              text NOT NULL,
  barn_name         text,
  sex               text NOT NULL CHECK (sex IN ('stallion', 'mare', 'gelding')),
  color             text,
  date_of_birth     date,
  country_of_birth  text DEFAULT 'US',
  breed_type        text NOT NULL CHECK (breed_type IN ('pre', 'psl', 'half_bred', 'iberian_performance')),
  registration_type text CHECK (registration_type IN ('ialha_bred', 'non_ialha_bred', 'half_bred', 'iberian_cert')),
  status            text DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'transferred', 'deceased', 'archived')),
  sire_id           uuid REFERENCES equestrai.horses(id),
  dam_id            uuid REFERENCES equestrai.horses(id),
  microchip_number  text,
  brand_description text,
  dna_case_number   text,
  dna_lab           text,
  dna_status        text DEFAULT 'pending' CHECK (dna_status IN ('pending', 'submitted', 'verified', 'failed')),
  foreign_registry  text,
  foreign_reg_number text,
  foreign_country   text,
  markings_description text,
  markings_verified boolean DEFAULT false,
  current_owner_id  uuid REFERENCES equestrai.profiles(id),
  breeder_id        uuid REFERENCES equestrai.profiles(id),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  registered_at     timestamptz,
  UNIQUE (tenant_id, registration_number),
  UNIQUE (tenant_id, microchip_number)
);

CREATE INDEX idx_horses_tenant ON equestrai.horses(tenant_id);
CREATE INDEX idx_horses_owner ON equestrai.horses(current_owner_id);
CREATE INDEX idx_horses_sire ON equestrai.horses(sire_id);
CREATE INDEX idx_horses_dam ON equestrai.horses(dam_id);
CREATE INDEX idx_horses_name ON equestrai.horses(tenant_id, name);
CREATE INDEX idx_horses_reg ON equestrai.horses(tenant_id, registration_number);

ALTER TABLE equestrai.horses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read registered horses"
  ON equestrai.horses FOR SELECT
  USING (status = 'registered');

CREATE POLICY "Owners see their own horses"
  ON equestrai.horses FOR SELECT
  USING (current_owner_id = auth.uid());

CREATE POLICY "Staff see all horses in tenant"
  ON equestrai.horses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM equestrai.profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = equestrai.horses.tenant_id
        AND p.role IN ('staff', 'admin')
    )
  );

-- =============================================================
-- 4. APPLICATIONS — registration/transfer workflow
-- =============================================================
CREATE TABLE equestrai.applications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES equestrai.tenants(id),
  applicant_id    uuid NOT NULL REFERENCES equestrai.profiles(id),
  horse_id        uuid REFERENCES equestrai.horses(id),
  application_type text NOT NULL CHECK (application_type IN (
    'purebred_ialha_bred', 'purebred_non_ialha', 'half_bred',
    'transfer', 'agent_authorization', 'iberian_performance_cert'
  )),
  status          text DEFAULT 'draft' CHECK (status IN (
    'draft', 'submitted', 'intake_complete', 'awaiting_payment',
    'paid', 'awaiting_approval', 'in_review', 'approved',
    'rejected', 'incomplete', 'abandoned'
  )),
  form_data       jsonb DEFAULT '{}',
  missing_items   text[] DEFAULT '{}',
  last_reminder_at timestamptz,
  reminder_count  int DEFAULT 0,
  requires_sire_approval  boolean DEFAULT false,
  sire_approval_status    text CHECK (sire_approval_status IN ('pending', 'approved', 'denied')),
  sire_approval_by        uuid REFERENCES equestrai.profiles(id),
  sire_approval_at        timestamptz,
  requires_board_review   boolean DEFAULT false,
  board_review_status     text CHECK (board_review_status IN ('pending', 'approved', 'denied')),
  board_reviewer_id       uuid REFERENCES equestrai.profiles(id),
  board_review_at         timestamptz,
  board_review_notes      text,
  assigned_to       uuid REFERENCES equestrai.profiles(id),
  staff_notes       text,
  rejection_reason  text,
  fee_amount_cents  int,
  fee_currency      text DEFAULT 'usd',
  stripe_checkout_id text,
  stripe_payment_id  text,
  payment_status    text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded', 'failed')),
  payment_method    text CHECK (payment_method IN ('stripe', 'check', 'money_order')),
  paid_at           timestamptz,
  transfer_from_id  uuid REFERENCES equestrai.profiles(id),
  transfer_to_id    uuid REFERENCES equestrai.profiles(id),
  transfer_from_signed boolean DEFAULT false,
  transfer_to_signed   boolean DEFAULT false,
  agent_id          uuid REFERENCES equestrai.profiles(id),
  authorization_scope text[] DEFAULT '{}',
  ai_screened       boolean DEFAULT false,
  ai_confidence     decimal(3,2),
  ai_flags          text[] DEFAULT '{}',
  ai_auto_approved  boolean DEFAULT false,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  submitted_at      timestamptz,
  completed_at      timestamptz
);

CREATE INDEX idx_applications_tenant ON equestrai.applications(tenant_id);
CREATE INDEX idx_applications_applicant ON equestrai.applications(applicant_id);
CREATE INDEX idx_applications_status ON equestrai.applications(tenant_id, status);
CREATE INDEX idx_applications_type ON equestrai.applications(tenant_id, application_type);

ALTER TABLE equestrai.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members see own applications"
  ON equestrai.applications FOR SELECT
  USING (applicant_id = auth.uid() OR transfer_to_id = auth.uid());

CREATE POLICY "Sire owners see approval requests"
  ON equestrai.applications FOR SELECT
  USING (
    requires_sire_approval = true
    AND EXISTS (
      SELECT 1 FROM equestrai.horses h
      WHERE h.id = (equestrai.applications.form_data->>'sire_horse_id')::uuid
        AND h.current_owner_id = auth.uid()
    )
  );

CREATE POLICY "Staff see all applications in tenant"
  ON equestrai.applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM equestrai.profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = equestrai.applications.tenant_id
        AND p.role IN ('staff', 'admin')
    )
  );

-- =============================================================
-- 5. DOCUMENTS — uploaded files
-- =============================================================
CREATE TABLE equestrai.documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES equestrai.tenants(id),
  application_id  uuid REFERENCES equestrai.applications(id),
  horse_id        uuid REFERENCES equestrai.horses(id),
  uploaded_by     uuid NOT NULL REFERENCES equestrai.profiles(id),
  doc_type        text NOT NULL CHECK (doc_type IN (
    'marking_photo_front', 'marking_photo_rear', 'marking_photo_left', 'marking_photo_right',
    'dna_report', 'microchip_certificate', 'foreign_registration',
    'agent_authorization', 'breeding_certificate', 'registration_certificate',
    'health_record', 'coggins_test', 'other'
  )),
  storage_path    text NOT NULL,
  file_name       text NOT NULL,
  file_size       int,
  mime_type       text,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE equestrai.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners see their docs"
  ON equestrai.documents FOR SELECT
  USING (uploaded_by = auth.uid());

CREATE POLICY "Staff see all docs in tenant"
  ON equestrai.documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM equestrai.profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = equestrai.documents.tenant_id
        AND p.role IN ('staff', 'admin')
    )
  );

-- =============================================================
-- 6. OWNERSHIP_HISTORY — immutable chain
-- =============================================================
CREATE TABLE equestrai.ownership_history (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES equestrai.tenants(id),
  horse_id      uuid NOT NULL REFERENCES equestrai.horses(id),
  owner_id      uuid NOT NULL REFERENCES equestrai.profiles(id),
  transfer_type text CHECK (transfer_type IN ('original_registration', 'sale', 'gift', 'inheritance', 'lease', 'return')),
  application_id uuid REFERENCES equestrai.applications(id),
  started_at    timestamptz DEFAULT now(),
  ended_at      timestamptz,
  notes         text,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_ownership_horse ON equestrai.ownership_history(horse_id);
CREATE INDEX idx_ownership_owner ON equestrai.ownership_history(owner_id);

ALTER TABLE equestrai.ownership_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads ownership of registered horses"
  ON equestrai.ownership_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM equestrai.horses h
      WHERE h.id = equestrai.ownership_history.horse_id
        AND h.status = 'registered'
    )
  );

-- =============================================================
-- 7. NOTIFICATIONS — delivery log
-- =============================================================
CREATE TABLE equestrai.notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES equestrai.tenants(id),
  recipient_id    uuid NOT NULL REFERENCES equestrai.profiles(id),
  application_id  uuid REFERENCES equestrai.applications(id),
  channel         text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  language        text DEFAULT 'en' CHECK (language IN ('en', 'es')),
  template_key    text NOT NULL,
  subject         text,
  body            text,
  metadata        jsonb DEFAULT '{}',
  status          text DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'bounced')),
  sent_at         timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE equestrai.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipients see own notifications"
  ON equestrai.notifications FOR SELECT
  USING (recipient_id = auth.uid());

-- =============================================================
-- 8. FEE_SCHEDULES — per-tenant fee config
-- =============================================================
CREATE TABLE equestrai.fee_schedules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES equestrai.tenants(id),
  application_type text NOT NULL,
  membership_type text NOT NULL,
  age_bracket     text,
  fee_cents       int NOT NULL,
  currency        text DEFAULT 'usd',
  description     text,
  effective_from  date DEFAULT CURRENT_DATE,
  effective_to    date,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE equestrai.fee_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read fee schedules"
  ON equestrai.fee_schedules FOR SELECT
  USING (true);

-- =============================================================
-- 9. AUDIT_LOG — immutable trail
-- =============================================================
CREATE TABLE equestrai.audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  actor_id      uuid,
  actor_type    text CHECK (actor_type IN ('user', 'staff', 'admin', 'system', 'ai_agent')),
  entity_type   text NOT NULL,
  entity_id     uuid NOT NULL,
  action        text NOT NULL,
  old_values    jsonb,
  new_values    jsonb,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_entity ON equestrai.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_tenant ON equestrai.audit_log(tenant_id, created_at);

ALTER TABLE equestrai.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read audit in tenant"
  ON equestrai.audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM equestrai.profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = equestrai.audit_log.tenant_id
        AND p.role IN ('staff', 'admin', 'board')
    )
  );

CREATE POLICY "System inserts audit"
  ON equestrai.audit_log FOR INSERT
  WITH CHECK (true);
