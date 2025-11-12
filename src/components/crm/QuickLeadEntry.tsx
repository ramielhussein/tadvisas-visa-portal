import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, Flame } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { sanitizePhoneInput, validatePhone } from "@/lib/phoneValidation";
import { useSalesTeam, useLeadSources, useInquiryPackages } from "@/hooks/useCRMData";
import { Skeleton } from "@/components/ui/skeleton";

interface QuickLeadEntryProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lead?: any | null;
}

  const QuickLeadEntry = ({ open, onClose, onSuccess, lead }: QuickLeadEntryProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [existingLead, setExistingLead] = useState<any>(null);
  const [formStage, setFormStage] = useState<'number-check' | 'quick-add' | 'full-form'>('number-check');
  
  // Use cached data hooks
  const { data: salesTeam = [], isLoading: loadingSalesTeam } = useSalesTeam();
  const { data: leadSources = [], isLoading: loadingLeadSources } = useLeadSources();
  const { data: inquiryPackages = [], isLoading: loadingInquiryPackages } = useInquiryPackages();
  
  const [formData, setFormData] = useState({
    client_name: "",
    email: "",
    mobile_number: "",
    emirate: "",
    status: "New Lead" as "New Lead" | "Called No Answer" | "Called Engaged" | "Called COLD" | "Called Unanswer 2" | "No Connection" | "Warm" | "HOT" | "SOLD" | "LOST" | "PROBLEM",
    service_required: "",
    nationality_code: "",
    lead_source: "",
    assigned_to: "",
    comments: "",
    hot: false,
    visa_expiry_date: "",
    remind_me: "",
  });

  const [files, setFiles] = useState<{
    passport: File | null;
    eidFront: File | null;
    eidBack: File | null;
  }>({
    passport: null,
    eidFront: null,
    eidBack: null,
  });

  // Data is now loaded via React Query hooks - no need for useEffect fetch

  // Initialize form data when dialog opens or lead changes
  useEffect(() => {
    if (open && lead) {
      console.log("Editing lead:", lead); // Debug log
      setFormData({
        client_name: lead.client_name || "",
        email: lead.email || "",
        mobile_number: lead.mobile_number || "",
        emirate: lead.emirate || "",
        status: lead.status || "New Lead",
        service_required: lead.service_required || "",
        nationality_code: lead.nationality_code || "",
        lead_source: lead.lead_source || "",
        assigned_to: lead.assigned_to || "",
        comments: lead.comments || "",
        hot: lead.hot || false,
        visa_expiry_date: lead.visa_expiry_date || "",
        remind_me: lead.remind_me || "",
      });
      setExistingLead(null);
      setFormStage('full-form');
    } else if (open && !lead) {
      // Reset for new lead
      setFormData({
        client_name: "",
        email: "",
        mobile_number: "",
        emirate: "",
        status: "New Lead",
        service_required: "",
        nationality_code: "",
        lead_source: "",
        assigned_to: "",
        comments: "",
        hot: false,
        visa_expiry_date: "",
        remind_me: "",
      });
      setExistingLead(null);
      setFiles({ passport: null, eidFront: null, eidBack: null });
      setFormStage('number-check');
    }
  }, [open, lead?.id]); // Use lead.id in dependency to ensure proper re-initialization

  const handleFileChange = (field: keyof typeof files, file: File | null) => {
    setFiles({ ...files, [field]: file });
  };

  const validatePhoneNumber = (phone: string) => {
    const sanitized = sanitizePhoneInput(phone);
    const error = validatePhone(sanitized);
    
    return { 
      valid: !error, 
      formatted: sanitized,
      error: error 
    };
  };

  const checkExistingLead = async (phoneNumber: string) => {
    const phoneValidation = validatePhoneNumber(phoneNumber);
    
    if (!phoneValidation.valid) {
      toast({
        title: "Invalid Phone Number",
        description: phoneValidation.error || "Phone number must be in format 971XXXXXXXXX",
        variant: "destructive",
      });
      return;
    }

    // Update form data with sanitized phone number
    setFormData(prev => ({ ...prev, mobile_number: phoneValidation.formatted }));

    setIsChecking(true);
    
    try {
      // Check if phone number exists in leads table
      const { data: existingLeadData, error } = await supabase
        .from('leads')
        .select('*')
        .eq('mobile_number', phoneValidation.formatted)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (existingLeadData) {
        // If lead is archived, unarchive it automatically
        if (existingLeadData.archived) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            
            // Check if lead is assigned or unassigned
            const isAssigned = existingLeadData.assigned_to !== null;
            
            // Unarchive and reset to "New Lead" status
            const { error: unarchiveError } = await supabase
              .from('leads')
              .update({ 
                archived: false,
                status: 'New Lead'
              })
              .eq('id', existingLeadData.id);

            if (unarchiveError) throw unarchiveError;

            // Log the activity
            if (user) {
              await supabase.from("lead_activities").insert({
                lead_id: existingLeadData.id,
                user_id: user.id,
                activity_type: "system",
                title: "Lead Restored from Archive",
                description: isAssigned 
                  ? "Archived lead restored and assigned salesperson notified"
                  : "Archived lead restored to incoming pool",
              });
            }

            // If assigned, ping the salesman with a notification
            if (isAssigned && existingLeadData.assigned_to) {
              await supabase.from("notifications").insert({
                user_id: existingLeadData.assigned_to,
                title: "Archived Lead Restored",
                message: `Lead ${existingLeadData.client_name || existingLeadData.mobile_number} has been unarchived and assigned back to you`,
                type: "info",
                related_lead_id: existingLeadData.id,
              });

              toast({
                title: "Lead Pre-Assigned and Archived",
                description: "PINGING THE SALESMAN - Lead has been restored to their list",
              });
            } else {
              toast({
                title: "Lead Restored",
                description: "Archived lead restored to incoming pool",
              });
            }

            // Navigate to the restored lead after a short delay
            setTimeout(() => {
              navigate(`/crm/leads/${existingLeadData.id}`);
            }, 1500);
          } catch (error: any) {
            console.error("Error unarchiving lead:", error);
            toast({
              title: "Error",
              description: "Failed to restore archived lead",
              variant: "destructive",
            });
          }
        } else {
          // Lead exists and is not archived - show duplicate error
          setExistingLead(existingLeadData);
          setFormData({
            ...formData,
            client_name: existingLeadData.client_name || "",
            email: existingLeadData.email || "",
            mobile_number: phoneValidation.formatted,
            emirate: existingLeadData.emirate || "",
            status: existingLeadData.status || "New Lead",
            service_required: existingLeadData.service_required || "",
            nationality_code: existingLeadData.nationality_code || "",
            lead_source: existingLeadData.lead_source || "",
            assigned_to: existingLeadData.assigned_to || "", // Add current assignment
          });

          // Fetch assignee information if lead is assigned
          let assigneeInfo = "";
          if (existingLeadData.assigned_to) {
            const { data: assigneeData } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", existingLeadData.assigned_to)
              .maybeSingle();
            
            if (assigneeData) {
              assigneeInfo = ` Lead is assigned to ${assigneeData.full_name || assigneeData.email}.`;
            }
          } else {
            assigneeInfo = " Lead is currently unassigned.";
          }

          toast({
            title: "Lead Already Exists",
            description: `This phone number is already in the system for ${existingLeadData.client_name || 'a client'}.${assigneeInfo}`,
            variant: "destructive",
          });
        }
      } else {
        setExistingLead(null);
        setFormStage('quick-add'); // Move to quick add stage
        toast({
          title: "Phone Number Available",
          description: "No existing lead found. Fill in source and service to continue.",
        });
      }
    } catch (error: any) {
      console.error("Error checking lead:", error);
      toast({
        title: "Error",
        description: "Failed to check for existing lead",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const pingSalesTeam = async () => {
    if (!existingLead) {
      toast({
        title: "No Lead to Notify About",
        description: "Check for an existing lead first by pressing Enter on the phone number field.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("notify-sales-team", {
        body: {
          leadId: existingLead.id,
          phoneNumber: existingLead.mobile_number,
          existingLeadData: existingLead,
        },
      });

      if (error) throw error;

      toast({
        title: "Sales Team Notified",
        description: "The assigned sales person has been notified about this duplicate lead attempt.",
      });
    } catch (error: any) {
      console.error("Error notifying sales team:", error);
      toast({
        title: "Notification Failed",
        description: error.message || "Failed to notify sales team",
        variant: "destructive",
      });
    }
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      checkExistingLead(formData.mobile_number);
    }
  };

  const handleQuickAdd = async () => {
    // Validate required fields for quick add
    if (!formData.mobile_number || !formData.lead_source || !formData.service_required) {
      toast({
        title: "Missing Required Fields",
        description: "Number, Source, and Service are required for Quick Add",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to create leads");
      }

      // Validate phone number
      const phoneValidation = validatePhoneNumber(formData.mobile_number);
      if (!phoneValidation.valid) {
        toast({
          title: "Invalid Phone Number",
          description: "Phone number must be in format 971xxxxxxxxx (12 digits total)",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Double-check for existing lead right before insert
      const { data: existingCheck } = await supabase
        .from('leads')
        .select('id, client_name, assigned_to, archived')
        .eq('mobile_number', phoneValidation.formatted)
        .maybeSingle();

      if (existingCheck) {
        toast({
          title: "Lead Already Exists",
          description: `This number is already in the system${existingCheck.client_name ? ` for ${existingCheck.client_name}` : ''}. Please search again.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        setFormStage('number-check'); // Reset to search stage
        return;
      }

      // Insert lead with minimal data
      const { data: newLead, error: insertError } = await supabase
        .from("leads")
        .insert({
          mobile_number: phoneValidation.formatted,
          lead_source: formData.lead_source,
          service_required: formData.service_required,
          status: "New Lead",
          archived: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: "Quick Lead Added",
        description: "Lead captured successfully with number, source, and service",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error in quick add:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add lead",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If editing an existing lead, update instead of create
    if (lead) {
      setIsSubmitting(true);
      try {
        const updateData: any = {
          client_name: formData.client_name || null,
          email: formData.email || null,
          mobile_number: formData.mobile_number,
          emirate: formData.emirate || null,
          status: formData.status,
          service_required: formData.service_required || null,
          nationality_code: formData.nationality_code || null,
          lead_source: formData.lead_source || null,
          assigned_to: (formData.assigned_to && formData.assigned_to !== "unassigned") ? formData.assigned_to : null,
          comments: formData.comments || null,
          hot: formData.hot,
          visa_expiry_date: formData.visa_expiry_date || null,
          remind_me: formData.remind_me || null,
        };

        // Auto-set reminder based on status if no manual reminder is set
        if (!formData.remind_me) {
          if (formData.status === "Called No Answer" || formData.status === "Called Unanswer 2") {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            updateData.remind_me = tomorrow.toISOString().split('T')[0];
          } else if (formData.status === "LOST") {
            const twoYears = new Date();
            twoYears.setFullYear(twoYears.getFullYear() + 2);
            updateData.remind_me = twoYears.toISOString().split('T')[0];
          }
        }

        // Handle "No Connection" - reassign to next person in round-robin
        if (formData.status === "No Connection") {
          try {
            await supabase.functions.invoke("assign-lead-round-robin", {
              body: { leadId: lead.id },
            });
          } catch (rrError) {
            console.error("Round-robin reassignment failed:", rrError);
          }
        }

        const { error } = await supabase
          .from("leads")
          .update(updateData)
          .eq("id", lead.id);

        if (error) throw error;

        // Create notification if lead is assigned to someone and assignment changed
        if (formData.assigned_to && formData.assigned_to !== lead.assigned_to) {
          try {
            const { error: notifError } = await supabase.from("notifications").insert({
              user_id: formData.assigned_to,
              title: "Lead Re-assigned",
              message: `You have been assigned a lead: ${formData.client_name || formData.mobile_number}`,
              type: "info",
              related_lead_id: lead.id,
            });
            
            if (notifError) {
              console.error("Failed to create notification:", notifError);
            } else {
              console.log("Re-assignment notification created for user:", formData.assigned_to);
            }
          } catch (notifError) {
            console.error("Exception creating notification:", notifError);
          }
        }

        let description = "Lead updated successfully";
        if (formData.status === "Called No Answer" || formData.status === "Called Unanswer 2") {
          description = "Lead updated and reminder set to tomorrow";
        } else if (formData.status === "LOST") {
          description = "Lead updated and reminder set to 2 years from now";
        } else if (formData.status === "No Connection") {
          description = "Lead updated and reassigned to next salesperson";
        }

        toast({
          title: "Success",
          description,
        });

        onSuccess();
        onClose();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    
    // Prevent submission if this is a duplicate lead
    if (existingLead) {
      toast({
        title: "Cannot Add Duplicate Lead",
        description: "This phone number already exists in the system. Please use a different number.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate phone number
    const phoneValidation = validatePhoneNumber(formData.mobile_number);
    if (!phoneValidation.valid) {
      toast({
        title: "Invalid Phone Number",
        description: "Phone number must be in format 971xxxxxxxxx (12 digits total)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to create leads");
      }
      // Check if phone number already exists as a client
      const { data: existingClient, error: clientCheckError } = await supabase
        .from('submissions')
        .select('id, name, status, created_at')
        .eq('phone', phoneValidation.formatted)
        .maybeSingle();

      if (clientCheckError && clientCheckError.code !== 'PGRST116') {
        throw clientCheckError;
      }

      if (existingClient) {
        toast({
          title: "Already a Client",
          description: `This phone number belongs to ${existingClient.name}, who is already a client (submitted ${new Date(existingClient.created_at).toLocaleDateString()}). Cannot add as a new lead.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Upload files to storage if provided
      const timestamp = Date.now();
      const folderName = `leads/${phoneValidation.formatted}_${timestamp}`;
      const fileUrls: Record<string, string> = {};

      const uploadPromises = Object.entries(files).map(async ([key, file]) => {
        if (file) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${folderName}/${key}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("crm-documents")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from("crm-documents")
            .getPublicUrl(fileName);

          fileUrls[key] = publicUrl;
        }
      });

      await Promise.all(uploadPromises);

      // Determine who to assign the lead to
      // If no assignee selected or "unassigned" explicitly chosen, leave unassigned
      const assignedTo = (formData.assigned_to && formData.assigned_to !== "unassigned") ? formData.assigned_to : null;

      // Prepare lead data
      const leadData: any = {
        client_name: formData.client_name || null,
        email: formData.email || null,
        mobile_number: phoneValidation.formatted,
        emirate: formData.emirate || null,
        status: formData.status,
        service_required: formData.service_required || null,
        nationality_code: formData.nationality_code || null,
        lead_source: formData.lead_source || null,
        assigned_to: assignedTo,
        passport_copy_url: fileUrls.passport || null,
        eid_front_url: fileUrls.eidFront || null,
        eid_back_url: fileUrls.eidBack || null,
        comments: formData.comments || null,
        hot: formData.hot,
        visa_expiry_date: formData.visa_expiry_date || null,
        remind_me: formData.remind_me || null,
      };

      // Auto-set reminder based on status if no manual reminder is set
      if (!formData.remind_me) {
        if (formData.status === "Called No Answer" || formData.status === "Called Unanswer 2") {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          leadData.remind_me = tomorrow.toISOString().split('T')[0];
        } else if (formData.status === "LOST") {
          const twoYears = new Date();
          twoYears.setFullYear(twoYears.getFullYear() + 2);
          leadData.remind_me = twoYears.toISOString().split('T')[0];
        }
      }

      // Insert lead into database
      const { data: newLead, error: dbError } = await supabase.from("leads").insert([leadData]).select().single();

      if (dbError) throw dbError;

      // Create notification for the assigned user
      if (newLead && assignedTo) {
        try {
          const { error: notifError } = await supabase.from("notifications").insert({
            user_id: assignedTo,
            title: "New Lead Assigned",
            message: `You have been assigned a new lead: ${formData.client_name || formData.mobile_number}`,
            type: "info",
            related_lead_id: newLead.id,
          });
          
          if (notifError) {
            console.error("Failed to create notification:", notifError);
          } else {
            console.log("Notification created successfully for user:", assignedTo);
          }
        } catch (notifError) {
          console.error("Exception creating notification:", notifError);
        }
      }

      // Only trigger round-robin if no assignee was explicitly set OR explicitly unassigned OR if status is "No Connection"
      if (newLead && (!formData.assigned_to || formData.assigned_to === "unassigned" || formData.status === "No Connection")) {
        try {
          await supabase.functions.invoke("assign-lead-round-robin", {
            body: { leadId: newLead.id },
          });
        } catch (rrError) {
          console.log("Round robin assignment failed (may be disabled):", rrError);
          // Don't throw - lead was created successfully, assigned to creator
        }
      }

      // Call Trello edge function (will be implemented)
      try {
        await supabase.functions.invoke("sync-to-trello", {
          body: {
            leadData: {
              ...formData,
              mobile_number: phoneValidation.formatted,
            },
          },
        });
      } catch (trelloError) {
        console.log("Trello sync failed (expected if not configured):", trelloError);
      }

      let description = "Lead added successfully";
      if (formData.status === "Called No Answer" || formData.status === "Called Unanswer 2") {
        description += " with reminder set to tomorrow";
      } else if (formData.status === "LOST") {
        description += " with reminder set to 2 years from now";
      } else if (formData.status === "No Connection") {
        description += " and reassigned via round-robin";
      }

      toast({
        title: "Success!",
        description,
      });

      // Reset form
      setFormData({
        client_name: "",
        email: "",
        mobile_number: "",
        emirate: "",
        status: "New Lead",
        service_required: "",
        nationality_code: "",
        lead_source: "",
        assigned_to: "",
        comments: "",
        hot: false,
        visa_expiry_date: "",
        remind_me: "",
      });
      setFiles({ passport: null, eidFront: null, eidBack: null });
      setExistingLead(null);

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error adding lead:", error);
      
      // Check if it's a duplicate phone number error
      if (error.code === '23505' && error.message.includes('leads_mobile_number_unique')) {
        toast({
          title: "Duplicate Phone Number",
          description: "A lead with this phone number already exists in the system.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileUploadField = ({
    field,
    label,
  }: {
    field: keyof typeof files;
    label: string;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={field}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={field}
          type="file"
          accept=".png,.jpg,.jpeg,.pdf"
          onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
          className="cursor-pointer"
        />
        {files[field] && (
          <span className="text-sm text-muted-foreground">
            {files[field]!.name}
          </span>
        )}
      </div>
    </div>
  );

  // Keyboard shortcut handler for status selection and actions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key;
    
    // Ctrl+S: Save/Submit form
    if (e.ctrlKey && key === 's') {
      e.preventDefault();
      if (formStage === 'quick-add' && formData.lead_source && formData.service_required) {
        handleQuickAdd();
      } else if (formStage === 'full-form' || lead) {
        const form = e.currentTarget.querySelector('form');
        if (form) {
          form.requestSubmit();
        }
      }
      return;
    }
    
    // Ctrl+H: Toggle hot status
    if (e.ctrlKey && key === 'h') {
      e.preventDefault();
      setFormData({ ...formData, hot: !formData.hot });
      toast({
        title: formData.hot ? "Removed HOT Flag" : "Marked as HOT",
        description: formData.hot ? "Lead is no longer marked as hot" : "Lead is now marked as HOT 🔥",
      });
      return;
    }
    
    // Escape: Close dialog
    if (key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    
    // Number keys 1-9: Quick status selection
    const statusMap: Record<string, string> = {
      '1': 'New Lead',
      '2': 'Called No Answer',
      '3': 'Called Engaged',
      '4': 'Called COLD',
      '5': 'Called Unanswer 2',
      '6': 'No Connection',
      '7': 'Warm',
      '8': 'HOT',
      '9': 'SOLD',
    };

    if (statusMap[key]) {
      e.preventDefault();
      setFormData({ ...formData, status: statusMap[key] as any });
      toast({
        title: "Status Updated",
        description: `Status set to: ${statusMap[key]}`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle>{lead ? "Edit Lead" : "Quick Lead Entry (Ctrl+Shift+Q)"}</DialogTitle>
          <DialogDescription>
            {formStage === 'number-check' && "Enter mobile number to check if lead exists"}
            {formStage === 'quick-add' && "Quick Add: Fill source and service, or Expand for full details"}
            {formStage === 'full-form' && (lead ? "Update lead information" : "Complete lead details")}
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <div>⌨️ <strong>Keyboard Shortcuts:</strong> Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">?</kbd> for full list</div>
              <div>• <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">1-9</kbd> Status • <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl+S</kbd> Save • <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl+H</kbd> HOT 🔥 • <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Esc</kbd> Close</div>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* STAGE 1: Number Check */}
        {formStage === 'number-check' && !lead && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="mobile_number">Mobile Number * (971xxxxxxxxx)</Label>
                {existingLead && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={pingSalesTeam}
                    className="text-xs"
                  >
                    Ping Sales Team
                  </Button>
                )}
              </div>
              <Input
                id="mobile_number"
                value={formData.mobile_number}
                onChange={(e) => {
                  setFormData({ ...formData, mobile_number: e.target.value });
                  if (existingLead) setExistingLead(null);
                }}
                onBlur={(e) => {
                  const sanitized = sanitizePhoneInput(e.target.value);
                  if (sanitized !== e.target.value) {
                    setFormData({ ...formData, mobile_number: sanitized });
                  }
                }}
                onKeyDown={handlePhoneKeyDown}
                placeholder="971501234567 or +971 50 123 4567"
                required
                disabled={isChecking}
                autoFocus
              />
              {isChecking && (
                <p className="text-sm text-muted-foreground">
                  <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                  Checking for existing lead...
                </p>
              )}
              {existingLead && (
                <div className="space-y-3">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ This lead already exists: {existingLead.client_name || existingLead.mobile_number}
                  </p>
                  
                  {/* Reassign Section */}
                  <div className="border rounded-lg p-3 bg-muted space-y-3">
                    <Label htmlFor="reassign_to" className="text-sm font-semibold">
                      Reassign Lead To:
                    </Label>
                    {loadingSalesTeam ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={formData.assigned_to}
                        onValueChange={(value) =>
                          setFormData({ ...formData, assigned_to: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select new assignee" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="unassigned">Unassign (Send to Incoming)</SelectItem>
                          {salesTeam.map((person) => (
                            <SelectItem key={person.id} value={person.id}>
                              {person.full_name || person.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => navigate(`/crm/leads/${existingLead.id}`)}
                      className="w-full"
                    >
                      View Lead Details
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!formData.assigned_to}
                      onClick={async () => {
                        // Allow empty selection to mean keep current assignment
                        const willUnassign = formData.assigned_to === "unassigned";
                        const newAssignee = willUnassign ? null : (formData.assigned_to || existingLead.assigned_to);

                        try {
                          const { error } = await supabase
                            .from("leads")
                            .update({ assigned_to: newAssignee })
                            .eq("id", existingLead.id);

                          if (error) throw error;

                          // Create notification if reassigned to someone new
                          if (newAssignee && newAssignee !== existingLead.assigned_to) {
                            await supabase.from("notifications").insert({
                              user_id: newAssignee,
                              title: "Lead Re-assigned",
                              message: `You have been assigned lead: ${existingLead.client_name || existingLead.mobile_number}`,
                              type: "info",
                              related_lead_id: existingLead.id,
                            });
                          }

                          toast({
                            title: "Lead Reassigned",
                            description: willUnassign 
                              ? "Lead has been unassigned and moved to incoming pool"
                              : newAssignee !== existingLead.assigned_to
                              ? "Lead has been reassigned successfully"
                              : "Lead assignment unchanged",
                          });

                          onSuccess();
                          onClose();
                        } catch (error: any) {
                          toast({
                            title: "Reassignment Failed",
                            description: error.message,
                            variant: "destructive",
                          });
                        }
                      }}
                      className="w-full"
                    >
                      Reassign Lead
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={pingSalesTeam}
                      className="w-full"
                    >
                      Ping Sales Team
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onClose}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Press Enter to check if this number already exists
              </p>
            </div>
          </div>
        )}

        {/* STAGE 2: Quick Add */}
        {formStage === 'quick-add' && !lead && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mobile Number</Label>
              <Input
                value={formData.mobile_number}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2 border-2 border-primary rounded-md p-4">
              <Label htmlFor="lead_source" className="text-primary font-semibold">Lead Source *</Label>
              {loadingLeadSources ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={formData.lead_source}
                  onValueChange={(value) =>
                    setFormData({ ...formData, lead_source: value })
                  }
                  required
                >
                  <SelectTrigger className="border-primary">
                    <SelectValue placeholder={leadSources.length === 0 ? "No lead sources available" : "Select source"} />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {leadSources.map((source) => (
                      <SelectItem key={source.id} value={source.source_name}>
                        {source.source_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2 border-2 border-primary rounded-md p-4">
              <Label htmlFor="service_required" className="text-primary font-semibold">Service Required *</Label>
              {loadingInquiryPackages ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={formData.service_required}
                  onValueChange={(value) =>
                    setFormData({ ...formData, service_required: value })
                  }
                  required
                >
                  <SelectTrigger className="border-primary">
                    <SelectValue placeholder={inquiryPackages.length === 0 ? "No packages available" : "Select service"} />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {inquiryPackages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.package_name}>
                        {pkg.package_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={handleQuickAdd}
                disabled={isSubmitting || !formData.lead_source || !formData.service_required}
                className="flex-1 h-12 text-lg font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "⚡ QUICK ADD"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormStage('full-form')}
                className="flex-1 h-12 text-lg"
              >
                Expand Full Form
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setFormStage('number-check');
                setFormData({ ...formData, mobile_number: "" });
              }}
              className="w-full"
            >
              ← Back to Number Check
            </Button>
          </div>
        )}

        {/* STAGE 3: Full Form */}
        {(formStage === 'full-form' || lead) && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile_number">Mobile Number * (971xxxxxxxxx)</Label>
              <Input
                id="mobile_number"
                value={formData.mobile_number}
                onChange={(e) => {
                  setFormData({ ...formData, mobile_number: e.target.value });
                  if (existingLead) setExistingLead(null);
                }}
                onBlur={(e) => {
                  const sanitized = sanitizePhoneInput(e.target.value);
                  if (sanitized !== e.target.value) {
                    setFormData({ ...formData, mobile_number: sanitized });
                  }
                }}
                placeholder="971501234567 or +971 50 123 4567"
                required
                disabled={!lead}
              />
            </div>

            <div className="space-y-2 border-2 border-primary rounded-md p-4">
              <Label htmlFor="service_required" className="text-primary font-semibold">Service Required *</Label>
              {loadingInquiryPackages ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={formData.service_required}
                  onValueChange={(value) =>
                    setFormData({ ...formData, service_required: value })
                  }
                >
                  <SelectTrigger className="border-primary">
                    <SelectValue placeholder={inquiryPackages.length === 0 ? "No packages available" : "Select service"} />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {inquiryPackages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.package_name}>
                        {pkg.package_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2 border-2 border-primary rounded-md p-4">
              <Label htmlFor="assigned_to" className="text-primary font-semibold">Assign To</Label>
              {loadingSalesTeam ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) =>
                    setFormData({ ...formData, assigned_to: value })
                  }
                >
                  <SelectTrigger className="border-primary">
                    <SelectValue placeholder="Unassigned (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem key="unassigned" value="unassigned">
                      Unassigned
                    </SelectItem>
                    {salesTeam.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead_source">Lead Source *</Label>
              {loadingLeadSources ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={formData.lead_source}
                  onValueChange={(value) =>
                    setFormData({ ...formData, lead_source: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={leadSources.length === 0 ? "No lead sources available" : "Select source"} />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {leadSources.map((source) => (
                      <SelectItem key={source.id} value={source.source_name}>
                        {source.source_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationality_code">Nationality</Label>
              <Select
                value={formData.nationality_code}
                onValueChange={(value) =>
                  setFormData({ ...formData, nationality_code: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="PH">🇵🇭 Philippines</SelectItem>
                  <SelectItem value="ID">🇮🇩 Indonesia</SelectItem>
                  <SelectItem value="IN">🇮🇳 India</SelectItem>
                  <SelectItem value="KE">🇰🇪 Kenya</SelectItem>
                  <SelectItem value="UG">🇺🇬 Uganda</SelectItem>
                  <SelectItem value="ET">🇪🇹 Ethiopia</SelectItem>
                  <SelectItem value="SR">🇱🇰 Sri Lanka</SelectItem>
                  <SelectItem value="MY">🇲🇲 Myanmar</SelectItem>
                  <SelectItem value="NP">🇳🇵 Nepal</SelectItem>
                  <SelectItem value="VN">🇻🇳 Vietnam</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-orange-50/50 dark:bg-orange-950/20">
              <Checkbox
                id="hot"
                checked={formData.hot}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, hot: checked === true })
                }
              />
              <Label
                htmlFor="hot"
                className="flex items-center gap-2 cursor-pointer font-medium"
              >
                <Flame className="w-4 h-4 text-orange-500" />
                Mark as HOT Lead
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visa_expiry_date">Visa Expiry Date</Label>
              <Input
                id="visa_expiry_date"
                type="date"
                value={formData.visa_expiry_date}
                onChange={(e) =>
                  setFormData({ ...formData, visa_expiry_date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remind_me">Remind Me On</Label>
              <Input
                id="remind_me"
                type="date"
                value={formData.remind_me}
                onChange={(e) =>
                  setFormData({ ...formData, remind_me: e.target.value })
                }
                placeholder="Set a reminder date"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use automatic reminders based on status
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) =>
                  setFormData({ ...formData, client_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emirate">Emirate</Label>
              <Select
                value={formData.emirate}
                onValueChange={(value) =>
                  setFormData({ ...formData, emirate: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select emirate" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="Dubai">Dubai</SelectItem>
                  <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                  <SelectItem value="Sharjah">Sharjah</SelectItem>
                  <SelectItem value="Ajman">Ajman</SelectItem>
                  <SelectItem value="Ras Al Khaimah">Ras Al Khaimah</SelectItem>
                  <SelectItem value="Fujairah">Fujairah</SelectItem>
                  <SelectItem value="Umm Al Quwain">Umm Al Quwain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="New Lead">New Lead</SelectItem>
                  <SelectItem value="Called No Answer">Called No Answer</SelectItem>
                  <SelectItem value="Called Engaged">Called Engaged</SelectItem>
                  <SelectItem value="Called COLD">Called COLD</SelectItem>
                  <SelectItem value="Called Unanswer 2">Called Unanswer 2</SelectItem>
                  <SelectItem value="No Connection">No Connection</SelectItem>
                  <SelectItem value="Warm">Warm</SelectItem>
                  <SelectItem value="HOT">HOT</SelectItem>
                  <SelectItem value="SOLD">SOLD</SelectItem>
                  <SelectItem value="LOST">LOST</SelectItem>
                  <SelectItem value="PROBLEM">PROBLEM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={formData.comments}
                onChange={(e) =>
                  setFormData({ ...formData, comments: e.target.value })
                }
                placeholder="Add any additional notes or comments..."
                className="min-h-[100px]"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Document Uploads</h3>
              <div className="space-y-4">
                <FileUploadField field="passport" label="Passport Copy" />
                <FileUploadField field="eidFront" label="Emirates ID (Front)" />
                <FileUploadField field="eidBack" label="Emirates ID (Back)" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              {formStage === 'full-form' && !lead && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setFormStage('quick-add')}
                >
                  ← Back to Quick Add
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  lead ? "Update Lead" : "Add Lead"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuickLeadEntry;
