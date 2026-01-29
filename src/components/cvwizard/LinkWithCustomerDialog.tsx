import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, User, Link } from "lucide-react";

interface Lead {
  id: string;
  client_name: string | null;
  mobile_number: string;
  status: string;
  service_required: string | null;
}

interface Deal {
  id: string;
  deal_number: string;
  service_type: string;
  status: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workerId: string;
  workerName: string;
  onSuccess?: () => void;
}

const LinkWithCustomerDialog = ({ open, onOpenChange, workerId, workerName, onSuccess }: Props) => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (open) {
      loadLeads();
    } else {
      setSearch("");
      setSelectedLead(null);
      setSelectedDeal(null);
      setDeals([]);
    }
  }, [open]);

  useEffect(() => {
    if (selectedLead) {
      loadDealsForLead(selectedLead.id);
    }
  }, [selectedLead]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("id, client_name, mobile_number, status, service_required")
        .eq("archived", false)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      console.error("Error loading leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDealsForLead = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from("deals")
        .select("id, deal_number, service_type, status")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDeals(data || []);
      
      // Auto-select if only one deal
      if (data && data.length === 1) {
        setSelectedDeal(data[0]);
      }
    } catch (error: any) {
      console.error("Error loading deals:", error);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const searchLower = search.toLowerCase();
    return (
      (lead.client_name?.toLowerCase() || "").includes(searchLower) ||
      lead.mobile_number.includes(search)
    );
  });

  const handleLink = async () => {
    if (!selectedDeal) {
      toast({
        title: "Select a Deal",
        description: "Please select a deal to link with this worker",
        variant: "destructive",
      });
      return;
    }

    setLinking(true);
    try {
      const { error } = await supabase
        .from("deals")
        .update({
          worker_id: workerId,
          worker_name: workerName,
        })
        .eq("id", selectedDeal.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${workerName} has been linked to deal ${selectedDeal.deal_number}`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to link worker with deal",
        variant: "destructive",
      });
    } finally {
      setLinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Link with Customer
          </DialogTitle>
          <DialogDescription>
            Link <strong>{workerName}</strong> to a customer's deal
          </DialogDescription>
        </DialogHeader>

        {!selectedLead ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {filteredLeads.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No leads found
                    </p>
                  ) : (
                    filteredLeads.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="w-full p-3 rounded-lg border hover:bg-accent text-left transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {lead.client_name || "Unknown"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {lead.mobile_number}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{lead.status}</Badge>
                        </div>
                        {lead.service_required && (
                          <p className="text-xs text-muted-foreground mt-1 ml-7">
                            {lead.service_required}
                          </p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-accent/50 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedLead.client_name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{selectedLead.mobile_number}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                  setSelectedLead(null);
                  setSelectedDeal(null);
                  setDeals([]);
                }}>
                  Change
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Deal</Label>
              {deals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No deals found for this customer
                </p>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {deals.map((deal) => (
                      <button
                        key={deal.id}
                        onClick={() => setSelectedDeal(deal)}
                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                          selectedDeal?.id === deal.id
                            ? "border-primary bg-primary/10"
                            : "hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{deal.deal_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {deal.service_type}
                            </p>
                          </div>
                          <Badge variant={deal.status === "Active" ? "default" : "secondary"}>
                            {deal.status}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleLink} 
            disabled={!selectedDeal || linking}
          >
            {linking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Link Worker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LinkWithCustomerDialog;
