-- Add lead_id column to chat_messages
ALTER TABLE public.chat_messages ADD COLUMN lead_id uuid REFERENCES public.leads(id);

-- Add index for faster lookups
CREATE INDEX idx_chat_messages_lead_id ON public.chat_messages(lead_id);