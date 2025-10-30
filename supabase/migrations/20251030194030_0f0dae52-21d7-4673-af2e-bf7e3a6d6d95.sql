-- Create function to automatically log all lead changes
CREATE OR REPLACE FUNCTION log_lead_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  -- If no user is authenticated, skip logging
  IF current_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Log lead creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO lead_activities (
      lead_id,
      user_id,
      activity_type,
      title,
      description,
      metadata
    ) VALUES (
      NEW.id,
      current_user_id,
      'system',
      'Lead Created',
      format('Lead created with status "%s"', NEW.status),
      jsonb_build_object(
        'action', 'created',
        'client_name', NEW.client_name,
        'mobile_number', NEW.mobile_number,
        'status', NEW.status
      )
    );
  END IF;

  -- Log lead updates
  IF TG_OP = 'UPDATE' THEN
    -- Status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO lead_activities (
        lead_id,
        user_id,
        activity_type,
        title,
        description,
        metadata
      ) VALUES (
        NEW.id,
        current_user_id,
        'system',
        'Status Changed',
        format('Status changed from "%s" to "%s"', OLD.status, NEW.status),
        jsonb_build_object(
          'action', 'status_change',
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;

    -- Assignment change
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      DECLARE
        old_assignee_name text;
        new_assignee_name text;
      BEGIN
        -- Get old assignee name
        IF OLD.assigned_to IS NOT NULL THEN
          SELECT COALESCE(full_name, email) INTO old_assignee_name
          FROM profiles
          WHERE id = OLD.assigned_to;
        END IF;

        -- Get new assignee name
        IF NEW.assigned_to IS NOT NULL THEN
          SELECT COALESCE(full_name, email) INTO new_assignee_name
          FROM profiles
          WHERE id = NEW.assigned_to;
        END IF;

        INSERT INTO lead_activities (
          lead_id,
          user_id,
          activity_type,
          title,
          description,
          metadata
        ) VALUES (
          NEW.id,
          current_user_id,
          'system',
          'Assignment Changed',
          format('Assigned from %s to %s', 
            COALESCE(old_assignee_name, 'Unassigned'),
            COALESCE(new_assignee_name, 'Unassigned')
          ),
          jsonb_build_object(
            'action', 'assignment_change',
            'old_assigned_to', OLD.assigned_to,
            'new_assigned_to', NEW.assigned_to
          )
        );
      END;
    END IF;

    -- Emirate change
    IF OLD.emirate IS DISTINCT FROM NEW.emirate THEN
      INSERT INTO lead_activities (
        lead_id,
        user_id,
        activity_type,
        title,
        description,
        metadata
      ) VALUES (
        NEW.id,
        current_user_id,
        'system',
        'Emirate Updated',
        format('Emirate changed from "%s" to "%s"', 
          COALESCE(OLD.emirate, 'None'),
          COALESCE(NEW.emirate, 'None')
        ),
        jsonb_build_object(
          'action', 'emirate_change',
          'old_emirate', OLD.emirate,
          'new_emirate', NEW.emirate
        )
      );
    END IF;

    -- Service required change
    IF OLD.service_required IS DISTINCT FROM NEW.service_required THEN
      INSERT INTO lead_activities (
        lead_id,
        user_id,
        activity_type,
        title,
        description,
        metadata
      ) VALUES (
        NEW.id,
        current_user_id,
        'system',
        'Service Updated',
        format('Service changed from "%s" to "%s"', 
          COALESCE(OLD.service_required, 'None'),
          COALESCE(NEW.service_required, 'None')
        ),
        jsonb_build_object(
          'action', 'service_change',
          'old_service', OLD.service_required,
          'new_service', NEW.service_required
        )
      );
    END IF;

    -- Nationality change
    IF OLD.nationality_code IS DISTINCT FROM NEW.nationality_code THEN
      INSERT INTO lead_activities (
        lead_id,
        user_id,
        activity_type,
        title,
        description,
        metadata
      ) VALUES (
        NEW.id,
        current_user_id,
        'system',
        'Nationality Updated',
        format('Nationality changed from "%s" to "%s"', 
          COALESCE(OLD.nationality_code, 'None'),
          COALESCE(NEW.nationality_code, 'None')
        ),
        jsonb_build_object(
          'action', 'nationality_change',
          'old_nationality', OLD.nationality_code,
          'new_nationality', NEW.nationality_code
        )
      );
    END IF;

    -- Phone number change
    IF OLD.mobile_number IS DISTINCT FROM NEW.mobile_number THEN
      INSERT INTO lead_activities (
        lead_id,
        user_id,
        activity_type,
        title,
        description,
        metadata
      ) VALUES (
        NEW.id,
        current_user_id,
        'system',
        'Phone Number Updated',
        format('Phone changed from "%s" to "%s"', OLD.mobile_number, NEW.mobile_number),
        jsonb_build_object(
          'action', 'phone_change',
          'old_phone', OLD.mobile_number,
          'new_phone', NEW.mobile_number
        )
      );
    END IF;

    -- Email change
    IF OLD.email IS DISTINCT FROM NEW.email THEN
      INSERT INTO lead_activities (
        lead_id,
        user_id,
        activity_type,
        title,
        description,
        metadata
      ) VALUES (
        NEW.id,
        current_user_id,
        'system',
        'Email Updated',
        format('Email changed from "%s" to "%s"',
          COALESCE(OLD.email, 'None'),
          COALESCE(NEW.email, 'None')
        ),
        jsonb_build_object(
          'action', 'email_change',
          'old_email', OLD.email,
          'new_email', NEW.email
        )
      );
    END IF;

    -- Client name change
    IF OLD.client_name IS DISTINCT FROM NEW.client_name THEN
      INSERT INTO lead_activities (
        lead_id,
        user_id,
        activity_type,
        title,
        description,
        metadata
      ) VALUES (
        NEW.id,
        current_user_id,
        'system',
        'Client Name Updated',
        format('Name changed from "%s" to "%s"',
          COALESCE(OLD.client_name, 'None'),
          COALESCE(NEW.client_name, 'None')
        ),
        jsonb_build_object(
          'action', 'name_change',
          'old_name', OLD.client_name,
          'new_name', NEW.client_name
        )
      );
    END IF;

    -- Comments change
    IF OLD.comments IS DISTINCT FROM NEW.comments THEN
      INSERT INTO lead_activities (
        lead_id,
        user_id,
        activity_type,
        title,
        description,
        metadata
      ) VALUES (
        NEW.id,
        current_user_id,
        'system',
        'Comments Updated',
        'Comments were updated',
        jsonb_build_object(
          'action', 'comments_change'
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on leads table
DROP TRIGGER IF EXISTS trigger_log_lead_changes ON leads;
CREATE TRIGGER trigger_log_lead_changes
  AFTER INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION log_lead_changes();