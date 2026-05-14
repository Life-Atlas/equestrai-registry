-- Seed data for IALHA (Tenant 1)

INSERT INTO equestrai.tenants (slug, name, short_name, contact_email, contact_phone, website_url, address)
VALUES (
  'ialha',
  'International Andalusian & Lusitano Horse Association',
  'IALHA',
  'Registry@IALHA.org',
  '205-995-8900',
  'https://ialha.org',
  '{"street": "22 Inverness Center Pkwy #155", "city": "Birmingham", "state": "AL", "zip": "35242", "country": "US"}'::jsonb
);

INSERT INTO equestrai.fee_schedules (tenant_id, application_type, membership_type, fee_cents, description)
SELECT t.id, vals.app_type, vals.mem_type, vals.fee, vals.descr
FROM equestrai.tenants t, (VALUES
  ('purebred_ialha_bred',   'member',     5000,  'Purebred registration (member)'),
  ('purebred_ialha_bred',   'non_member', 25000, 'Purebred registration (non-member)'),
  ('purebred_non_ialha',    'member',     5000,  'Non-IALHA purebred registration (member)'),
  ('purebred_non_ialha',    'non_member', 25000, 'Non-IALHA purebred registration (non-member)'),
  ('half_bred',             'member',     5000,  'Half-bred registration (member)'),
  ('half_bred',             'non_member', 25000, 'Half-bred registration (non-member)'),
  ('transfer',              'member',     4000,  'Transfer of ownership (member)'),
  ('transfer',              'non_member', 12000, 'Transfer of ownership (non-member)'),
  ('agent_authorization',   'member',     0,     'Agent authorization (no fee)')
) AS vals(app_type, mem_type, fee, descr)
WHERE t.slug = 'ialha';
