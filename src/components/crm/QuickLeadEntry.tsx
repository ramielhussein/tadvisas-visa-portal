import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload } from "lucide-react";

interface QuickLeadEntryProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const QuickLeadEntry = ({ open, onClose, onSuccess }: QuickLeadEntryProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    client_name: "",
    email: "",
    mobile_number: "",
    emirate: "",
    status: "New Lead" as const,
    service_required: "",
    nationality_code: "",
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

  const handleFileChange = (field: keyof typeof files, file: File | null) => {
    setFiles({ ...files, [field]: file });
  };

  const validatePhoneNumber = (phone: string) => {
    // Remove any spaces or dashes
    const cleaned = phone.replace(/[\s-]/g, "");
    
    // Check if it starts with 971
    if (!cleaned.startsWith("971")) {
      return { valid: false, formatted: "" };
    }
    
    // Should be 12 digits total (971 + 9 digits)
    if (cleaned.length !== 12) {
      return { valid: false, formatted: "" };
    }
    
    return { valid: true, formatted: cleaned };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

      // Insert lead into database
      const { data: newLead, error: dbError } = await supabase.from("leads").insert([{
        client_name: formData.client_name || null,
        email: formData.email || null,
        mobile_number: phoneValidation.formatted,
        emirate: formData.emirate || null,
        status: formData.status,
        service_required: formData.service_required || null,
        nationality_code: formData.nationality_code || null,
        passport_copy_url: fileUrls.passport || null,
        eid_front_url: fileUrls.eidFront || null,
        eid_back_url: fileUrls.eidBack || null,
      }]).select().single();

      if (dbError) throw dbError;

      // Trigger round-robin assignment for the new lead
      if (newLead) {
        try {
          await supabase.functions.invoke("assign-lead-round-robin", {
            body: { leadId: newLead.id },
          });
        } catch (rrError) {
          console.log("Round robin assignment failed (may be disabled):", rrError);
          // Don't throw - lead was created successfully
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

      toast({
        title: "Success!",
        description: "Lead added successfully",
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
      });
      setFiles({ passport: null, eidFront: null, eidBack: null });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error adding lead:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Lead Entry (Ctrl+Shift+Q)</DialogTitle>
          <DialogDescription>
            Add a new lead to the CRM system. Phone number is required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="mobile_number">Mobile Number * (971xxxxxxxxx)</Label>
            <Input
              id="mobile_number"
              value={formData.mobile_number}
              onChange={(e) =>
                setFormData({ ...formData, mobile_number: e.target.value })
              }
              placeholder="971501234567"
              required
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
              <SelectContent>
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
              <SelectContent>
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

          <div className="space-y-2">
            <Label htmlFor="service_required">Service Required</Label>
            <Select
              value={formData.service_required}
              onValueChange={(value) =>
                setFormData({ ...formData, service_required: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="P1 Traditional Package">P1 Traditional Package</SelectItem>
                <SelectItem value="P4 Monthly">P4 Monthly</SelectItem>
                <SelectItem value="P5 Tadvisas">P5 Tadvisas</SelectItem>
                <SelectItem value="P5 Tadvisas+">P5 Tadvisas+</SelectItem>
                <SelectItem value="P5 Tadvisas++">P5 Tadvisas++</SelectItem>
                <SelectItem value="Typing">Typing</SelectItem>
                <SelectItem value="P6">P6</SelectItem>
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
              <SelectContent>
                <SelectItem value="New Lead">New Lead</SelectItem>
                <SelectItem value="Warm">Warm</SelectItem>
                <SelectItem value="HOT">HOT</SelectItem>
                <SelectItem value="SOLD">SOLD</SelectItem>
                <SelectItem value="LOST">LOST</SelectItem>
                <SelectItem value="PROBLEM">PROBLEM</SelectItem>
              </SelectContent>
            </Select>
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
                "Add Lead"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickLeadEntry;
