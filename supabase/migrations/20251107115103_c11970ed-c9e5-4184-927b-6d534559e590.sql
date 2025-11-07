-- Performance indexes for leads table
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_archived ON leads(archived);
CREATE INDEX IF NOT EXISTS idx_leads_mobile_number ON leads(mobile_number);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_archived ON leads(assigned_to, archived) WHERE assigned_to IS NOT NULL;

-- Performance indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Performance indexes for lead_activities table
CREATE INDEX IF NOT EXISTS idx_activities_lead_date ON lead_activities(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON lead_activities(user_id);

-- Performance indexes for deals table
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON deals(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC);

-- Performance indexes for invoices table
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_phone ON invoices(client_phone);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Performance indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_phone ON payments(client_phone);

-- Performance indexes for contracts table
CREATE INDEX IF NOT EXISTS idx_contracts_salesman ON contracts(salesman_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);