-- Create enum for attendance status
CREATE TYPE public.attendance_status AS ENUM ('checked_in', 'on_break', 'checked_out', 'absent');

-- Create enum for overtime status
CREATE TYPE public.overtime_status AS ENUM ('pending', 'approved', 'rejected');

-- Employee shifts configuration table
CREATE TABLE public.employee_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  shift_start TIME NOT NULL DEFAULT '09:00:00',
  shift_end TIME NOT NULL DEFAULT '18:00:00',
  break_duration_minutes INTEGER NOT NULL DEFAULT 60,
  working_days INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5], -- Monday to Friday
  grace_period_minutes INTEGER NOT NULL DEFAULT 15,
  is_ramadan_hours BOOLEAN NOT NULL DEFAULT false,
  ramadan_shift_start TIME DEFAULT '09:00:00',
  ramadan_shift_end TIME DEFAULT '15:00:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id)
);

-- Attendance records table
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  status public.attendance_status NOT NULL DEFAULT 'absent',
  total_break_minutes INTEGER NOT NULL DEFAULT 0,
  regular_hours NUMERIC(5,2) DEFAULT 0,
  overtime_hours NUMERIC(5,2) DEFAULT 0,
  net_working_hours NUMERIC(5,2) DEFAULT 0,
  is_late BOOLEAN DEFAULT false,
  late_minutes INTEGER DEFAULT 0,
  is_early_leave BOOLEAN DEFAULT false,
  early_leave_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, attendance_date)
);

-- Break records table
CREATE TABLE public.break_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_record_id UUID NOT NULL REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  break_out_time TIMESTAMP WITH TIME ZONE NOT NULL,
  break_back_time TIMESTAMP WITH TIME ZONE,
  break_duration_minutes INTEGER,
  break_type TEXT DEFAULT 'regular',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Overtime records table
CREATE TABLE public.overtime_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_record_id UUID NOT NULL REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  overtime_date DATE NOT NULL,
  overtime_hours NUMERIC(5,2) NOT NULL,
  overtime_rate NUMERIC(5,2) NOT NULL DEFAULT 125.00, -- 125% or 150%
  overtime_amount NUMERIC(10,2),
  status public.overtime_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- UAE public holidays table
CREATE TABLE public.uae_public_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date DATE NOT NULL UNIQUE,
  holiday_name TEXT NOT NULL,
  is_official BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert UAE 2025 public holidays
INSERT INTO public.uae_public_holidays (holiday_date, holiday_name) VALUES
  ('2025-01-01', 'New Year''s Day'),
  ('2025-03-29', 'Eid Al Fitr (estimated)'),
  ('2025-03-30', 'Eid Al Fitr (estimated)'),
  ('2025-03-31', 'Eid Al Fitr (estimated)'),
  ('2025-06-05', 'Arafat Day (estimated)'),
  ('2025-06-06', 'Eid Al Adha (estimated)'),
  ('2025-06-07', 'Eid Al Adha (estimated)'),
  ('2025-06-08', 'Eid Al Adha (estimated)'),
  ('2025-06-26', 'Islamic New Year (estimated)'),
  ('2025-09-04', 'Prophet''s Birthday (estimated)'),
  ('2025-12-02', 'Commemoration Day'),
  ('2025-12-03', 'National Day');

-- Enable RLS
ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.break_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uae_public_holidays ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage employee shifts"
  ON public.employee_shifts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can view their own shift"
  ON public.employee_shifts FOR SELECT
  TO authenticated
  USING (employee_id IN (SELECT id FROM public.employees WHERE created_by = auth.uid()));

CREATE POLICY "Admins can manage attendance records"
  ON public.attendance_records FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can view their attendance"
  ON public.attendance_records FOR SELECT
  TO authenticated
  USING (employee_id IN (SELECT id FROM public.employees WHERE created_by = auth.uid()));

CREATE POLICY "Authenticated users can insert attendance"
  ON public.attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Employees can update their attendance"
  ON public.attendance_records FOR UPDATE
  TO authenticated
  USING (employee_id IN (SELECT id FROM public.employees WHERE created_by = auth.uid()));

CREATE POLICY "Admins can manage break records"
  ON public.break_records FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can manage their breaks"
  ON public.break_records FOR ALL
  TO authenticated
  USING (attendance_record_id IN (
    SELECT id FROM public.attendance_records 
    WHERE employee_id IN (SELECT id FROM public.employees WHERE created_by = auth.uid())
  ));

CREATE POLICY "Admins can manage overtime records"
  ON public.overtime_records FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can view their overtime"
  ON public.overtime_records FOR SELECT
  TO authenticated
  USING (employee_id IN (SELECT id FROM public.employees WHERE created_by = auth.uid()));

CREATE POLICY "Everyone can view holidays"
  ON public.uae_public_holidays FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage holidays"
  ON public.uae_public_holidays FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to calculate attendance hours
CREATE OR REPLACE FUNCTION public.calculate_attendance_hours()
RETURNS TRIGGER AS $$
DECLARE
  shift_record RECORD;
  work_minutes INTEGER;
  shift_minutes INTEGER;
  is_holiday BOOLEAN;
  ot_rate NUMERIC;
BEGIN
  -- Get employee shift configuration
  SELECT * INTO shift_record
  FROM public.employee_shifts
  WHERE employee_id = NEW.employee_id;

  -- Check if it's a public holiday
  SELECT EXISTS (
    SELECT 1 FROM public.uae_public_holidays
    WHERE holiday_date = NEW.attendance_date
  ) INTO is_holiday;

  -- Only calculate if both check-in and check-out exist
  IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
    -- Calculate total minutes worked
    work_minutes := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 60;
    
    -- Deduct break time
    work_minutes := work_minutes - NEW.total_break_minutes;
    
    -- Calculate standard shift minutes
    IF shift_record.is_ramadan_hours THEN
      shift_minutes := EXTRACT(EPOCH FROM (shift_record.ramadan_shift_end - shift_record.ramadan_shift_start)) / 60;
    ELSE
      shift_minutes := EXTRACT(EPOCH FROM (shift_record.shift_end - shift_record.shift_start)) / 60;
    END IF;
    
    -- Deduct standard break duration
    shift_minutes := shift_minutes - shift_record.break_duration_minutes;
    
    -- Calculate regular and overtime hours
    IF work_minutes <= shift_minutes THEN
      NEW.regular_hours := ROUND((work_minutes / 60.0)::NUMERIC, 2);
      NEW.overtime_hours := 0;
    ELSE
      NEW.regular_hours := ROUND((shift_minutes / 60.0)::NUMERIC, 2);
      NEW.overtime_hours := ROUND(((work_minutes - shift_minutes) / 60.0)::NUMERIC, 2);
      
      -- Cap OT at 2 hours per day (UAE law)
      IF NEW.overtime_hours > 2 THEN
        NEW.overtime_hours := 2;
      END IF;
    END IF;
    
    -- Calculate net working hours
    NEW.net_working_hours := NEW.regular_hours + NEW.overtime_hours;
    
    -- Check if late or early leave
    IF shift_record.is_ramadan_hours THEN
      IF EXTRACT(EPOCH FROM (NEW.check_in_time::TIME - shift_record.ramadan_shift_start)) / 60 > shift_record.grace_period_minutes THEN
        NEW.is_late := true;
        NEW.late_minutes := ROUND(EXTRACT(EPOCH FROM (NEW.check_in_time::TIME - shift_record.ramadan_shift_start)) / 60);
      END IF;
    ELSE
      IF EXTRACT(EPOCH FROM (NEW.check_in_time::TIME - shift_record.shift_start)) / 60 > shift_record.grace_period_minutes THEN
        NEW.is_late := true;
        NEW.late_minutes := ROUND(EXTRACT(EPOCH FROM (NEW.check_in_time::TIME - shift_record.shift_start)) / 60);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to calculate hours on attendance record update
CREATE TRIGGER calculate_attendance_hours_trigger
  BEFORE INSERT OR UPDATE ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_attendance_hours();

-- Trigger to update updated_at
CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_shifts_updated_at
  BEFORE UPDATE ON public.employee_shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_overtime_records_updated_at
  BEFORE UPDATE ON public.overtime_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();