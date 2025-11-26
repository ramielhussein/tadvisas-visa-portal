-- Add user_id column to employees table to link employees to auth users
ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);

-- Update existing employees to link them to users by matching email
UPDATE employees e
SET user_id = p.id
FROM profiles p
WHERE e.email = p.email
AND e.user_id IS NULL
AND p.email IS NOT NULL;

-- For employees without email match, try to link by created_by (for rami and rayaan who are working)
UPDATE employees e
SET user_id = e.created_by
WHERE e.user_id IS NULL
AND e.created_by IS NOT NULL;

-- Create a function to automatically set user_id when an employee is created
CREATE OR REPLACE FUNCTION set_employee_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is not set, try to find matching profile by email
  IF NEW.user_id IS NULL AND NEW.email IS NOT NULL THEN
    SELECT id INTO NEW.user_id
    FROM profiles
    WHERE email = NEW.email
    LIMIT 1;
  END IF;
  
  -- If still no user_id and created_by is set, use created_by
  IF NEW.user_id IS NULL AND NEW.created_by IS NOT NULL THEN
    NEW.user_id := NEW.created_by;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic user_id assignment
DROP TRIGGER IF EXISTS set_employee_user_id_trigger ON employees;
CREATE TRIGGER set_employee_user_id_trigger
BEFORE INSERT OR UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION set_employee_user_id();