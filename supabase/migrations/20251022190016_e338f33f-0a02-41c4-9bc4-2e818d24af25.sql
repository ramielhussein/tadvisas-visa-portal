-- Make remind_me nullable so trigger can work properly
ALTER TABLE public.leads ALTER COLUMN remind_me DROP NOT NULL;