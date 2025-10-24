import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface Lead {
  id: string;
  client_name: string;
  email: string | null;
  mobile_number: string;
  emirate: string | null;
  status: string;
  service_required: string | null;
  nationality_code: string | null;
  remind_me: string;
  created_at: string;
  assigned_to: string | null;
  client_converted: boolean;
}

interface EditLeadDialogProps {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EditLeadDialog = ({ open, lead, onClose, onSuccess }: EditLeadDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: "",
    email: "",
    mobile_number: "",
    emirate: "",
    status: "New Lead" as "New Lead" | "Warm" | "HOT" | "SOLD" | "LOST" | "PROBLEM",
    service_required: "",
    nationality_code: "",
    lead_source: "",
    remind_me: "",
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        client_name: lead.client_name || "",
        email: lead.email || "",
        mobile_number: lead.mobile_number || "",
        emirate: lead.emirate || "",
        status: lead.status as "New Lead" | "Warm" | "HOT" | "SOLD" | "LOST" | "PROBLEM",
        service_required: lead.service_required || "",
        nationality_code: lead.nationality_code || "",
        lead_source: (lead as any).lead_source || "",
        remind_me: lead.remind_me ? lead.remind_me.split('T')[0] : "",
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("leads")
        .update({
          client_name: formData.client_name || null,
          email: formData.email || null,
          mobile_number: formData.mobile_number,
          emirate: formData.emirate || null,
          status: formData.status,
          service_required: formData.service_required || null,
          nationality_code: formData.nationality_code || null,
          lead_source: formData.lead_source || null,
          remind_me: formData.remind_me || null,
        })
        .eq("id", lead.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead updated successfully",
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
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile_number">Mobile Number *</Label>
              <Input
                id="mobile_number"
                required
                value={formData.mobile_number}
                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emirate">Emirate</Label>
              <Select value={formData.emirate} onValueChange={(value) => setFormData({ ...formData, emirate: value })}>
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
              <Select value={formData.nationality_code} onValueChange={(value) => setFormData({ ...formData, nationality_code: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PH">Philippines</SelectItem>
                  <SelectItem value="ET">Ethiopia</SelectItem>
                  <SelectItem value="ID">Indonesia</SelectItem>
                  <SelectItem value="AF">Afghanistan</SelectItem>
                  <SelectItem value="MY">Myanmar</SelectItem>
                  <SelectItem value="NP">Nepal</SelectItem>
                  <SelectItem value="BD">Bangladesh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service_required">Service Required</Label>
              <Select value={formData.service_required} onValueChange={(value) => setFormData({ ...formData, service_required: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Housemaid">Housemaid</SelectItem>
                  <SelectItem value="Driver">Driver</SelectItem>
                  <SelectItem value="DIRECT">DIRECT</SelectItem>
                  <SelectItem value="Cook">Cook</SelectItem>
                  <SelectItem value="Caregiver">Caregiver</SelectItem>
                  <SelectItem value="Nurse">Nurse</SelectItem>
                  <SelectItem value="Skilled">Skilled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: "New Lead" | "Warm" | "HOT" | "SOLD" | "LOST" | "PROBLEM") => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New Lead">New Lead</SelectItem>
                  <SelectItem value="Warm">Warm</SelectItem>
                  <SelectItem value="HOT">HOT</SelectItem>
                  <SelectItem value="SOLD">SOLD</SelectItem>
                  <SelectItem value="LOST">LOST</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead_source">Lead Source</Label>
            <Select value={formData.lead_source} onValueChange={(value) => setFormData({ ...formData, lead_source: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Phone">Phone Call</SelectItem>
                <SelectItem value="Referral">Referral</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Google Ads">Google Ads</SelectItem>
                <SelectItem value="Walk-in">Walk-in</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remind_me">Remind Me Date</Label>
            <Input
              id="remind_me"
              type="date"
              value={formData.remind_me}
              onChange={(e) => setFormData({ ...formData, remind_me: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLeadDialog;
