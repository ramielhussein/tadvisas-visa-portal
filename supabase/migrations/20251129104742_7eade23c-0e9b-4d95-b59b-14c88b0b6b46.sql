-- Set default generator for deal_number so frontend doesn't have to pass it
ALTER TABLE public.deals
ALTER COLUMN deal_number SET DEFAULT public.generate_deal_number();