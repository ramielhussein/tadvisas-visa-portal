import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Lead {
  id: string;
  client_name: string;
  mobile_number: string;
  status: string;
}

interface LeadSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectLead: (leadId: string, leadName: string) => void;
}

const LeadSelectorDialog = ({ open, onOpenChange, onSelectLead }: LeadSelectorDialogProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadLeads();
    }
  }, [open]);

  const loadLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("id, client_name, mobile_number, status")
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setLeads(data);
    }
    setLoading(false);
  };

  const filteredLeads = leads.filter(
    (lead) =>
      lead.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.mobile_number?.includes(searchQuery)
  );

  const handleSelect = (lead: Lead) => {
    onSelectLead(lead.id, lead.client_name || "Unnamed Lead");
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select a Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[300px] pr-4">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading leads...</p>
            ) : filteredLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No leads found</p>
            ) : (
              <div className="space-y-2">
                {filteredLeads.map((lead) => (
                  <Button
                    key={lead.id}
                    variant="ghost"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => handleSelect(lead)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{lead.client_name || "Unnamed"}</div>
                      <div className="text-xs text-muted-foreground">
                        {lead.mobile_number} • {lead.status}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadSelectorDialog;
