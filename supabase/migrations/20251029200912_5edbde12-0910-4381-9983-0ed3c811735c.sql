-- Pre-populate common lead sources
INSERT INTO public.lead_sources (source_name, description, is_active, sort_order) VALUES
('Website', 'Leads from website contact forms', true, 1),
('WhatsApp', 'Leads from WhatsApp inquiries', true, 2),
('Phone', 'Direct phone call inquiries', true, 3),
('Referral', 'Customer referrals', true, 4),
('Facebook', 'Facebook page and ads', true, 5),
('Instagram', 'Instagram page and ads', true, 6),
('Google Ads', 'Google advertising campaigns', true, 7),
('Walk-in', 'Walk-in customers', true, 8),
('Other', 'Other sources', true, 9)
ON CONFLICT (source_name) DO NOTHING;