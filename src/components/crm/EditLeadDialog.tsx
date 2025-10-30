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
  const [salesTeam, setSalesTeam] = useState<Array<{ id: string; email: string; full_name: string | null }>>([]);
  const [leadSources, setLeadSources] = useState<Array<{ id: string; source_name: string }>>([]);
  const [inquiryPackages, setInquiryPackages] = useState<Array<{ id: string; package_name: string }>>([]);
  
  const [formData, setFormData] = useState({
    client_name: "",
    email: "",
    mobile_number: "",
    emirate: "",
    status: "New Lead" as "New Lead" | "Called No Answer" | "Called Engaged" | "Called COLD" | "Warm" | "HOT" | "SOLD" | "LOST" | "PROBLEM",
    service_required: "",
    nationality_code: "",
    lead_source: "",
    remind_me: "",
    assigned_to: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sales team
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, email, full_name, permissions")
          .order("email");

        if (profilesError) throw profilesError;

        // Filter for users with sales/deals permissions or lead assignment permissions
        const salesUsers = (profilesData || []).filter((user: any) => {
          const permissions = user.permissions as any;
          return (
            permissions?.leads?.assign === true ||
            permissions?.deals?.create === true ||
            permissions?.deals?.edit === true
          );
        });

        setSalesTeam(salesUsers);

        // Fetch lead sources
        const { data: sourcesData, error: sourcesError } = await supabase
          .from("lead_sources")
          .select("id, source_name")
          .eq("is_active", true)
          .order("sort_order")
          .order("source_name");

        if (sourcesError) throw sourcesError;

        setLeadSources(sourcesData || []);

        // Fetch inquiry packages
        const { data: packagesData, error: packagesError } = await supabase
          .from("inquiry_packages")
          .select("id, package_name")
          .eq("is_active", true)
          .order("sort_order")
          .order("package_name");

        if (packagesError) throw packagesError;

        setInquiryPackages(packagesData || []);
      } catch (error: any) {
        console.error("Error fetching data:", error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (lead) {
      setFormData({
        client_name: lead.client_name || "",
        email: lead.email || "",
        mobile_number: lead.mobile_number || "",
        emirate: lead.emirate || "",
        status: lead.status as "New Lead" | "Called No Answer" | "Called Engaged" | "Called COLD" | "Warm" | "HOT" | "SOLD" | "LOST" | "PROBLEM",
        service_required: lead.service_required || "",
        nationality_code: lead.nationality_code || "",
        lead_source: (lead as any).lead_source || "",
        remind_me: lead.remind_me ? lead.remind_me.split('T')[0] : "",
        assigned_to: lead.assigned_to || "",
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setLoading(true);
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
        remind_me: formData.remind_me || null,
        assigned_to: formData.assigned_to || null,
      };

      // Set reminder to tomorrow if status is "Called No Answer"
      if (formData.status === "Called No Answer") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        updateData.remind_me = tomorrow.toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", lead.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: formData.status === "Called No Answer" 
          ? "Lead updated and reminder set to tomorrow"
          : "Lead updated successfully",
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
                type="tel"
                required
                value={formData.mobile_number}
                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                placeholder="971501234567"
                pattern="971[0-9]{9}"
                title="Phone format: 971XXXXXXXXX"
              />
              <p className="text-xs text-muted-foreground">Format: 971XXXXXXXXX</p>
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
              <Select value={formData.status} onValueChange={(value: "New Lead" | "Called No Answer" | "Called Engaged" | "Called COLD" | "Warm" | "HOT" | "SOLD" | "LOST" | "PROBLEM") => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New Lead">New Lead</SelectItem>
                  <SelectItem value="Called No Answer">Called No Answer</SelectItem>
                  <SelectItem value="Called Engaged">Called Engaged</SelectItem>
                  <SelectItem value="Called COLD">Called COLD</SelectItem>
                  <SelectItem value="Warm">Warm</SelectItem>
                  <SelectItem value="HOT">HOT</SelectItem>
                  <SelectItem value="SOLD">SOLD</SelectItem>
                  <SelectItem value="LOST">LOST</SelectItem>
                  <SelectItem value="PROBLEM">PROBLEM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lead_source">Lead Source</Label>
              <Select value={formData.lead_source} onValueChange={(value) => setFormData({ ...formData, lead_source: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {leadSources.length > 0 ? (
                    leadSources.map((source) => (
                      <SelectItem key={source.id} value={source.source_name}>
                        {source.source_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="None" disabled>
                      No sources available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sales person" />
                </SelectTrigger>
                <SelectContent>
                  {salesTeam.length > 0 ? (
                    salesTeam.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="None" disabled>
                      No sales team available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
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
