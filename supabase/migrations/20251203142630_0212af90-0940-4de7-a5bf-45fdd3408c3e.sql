-- Set default value for transfer_number to use the generator function
ALTER TABLE public.worker_transfers 
ALTER COLUMN transfer_number SET DEFAULT generate_transfer_number();