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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, User, Link } from "lucide-react";

interface Deal {
  id: string;
  deal_number: string;
  client_name: string;
  client_phone: string;
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
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (open) {
      searchDeals("");
    } else {
      setSearch("");
      setSelectedDeal(null);
      setDeals([]);
    }
  }, [open]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (open && !selectedDeal) {
        searchDeals(search);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, open, selectedDeal]);

  const searchDeals = async (searchTerm: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from("deals")
        .select("id, deal_number, client_name, client_phone, service_type, status")
        .is("worker_id", null); // Only show deals without a worker assigned

      if (searchTerm.trim()) {
        // Server-side search by client name or phone
        query = query.or(`client_name.ilike.%${searchTerm}%,client_phone.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setDeals(data || []);
    } catch (error: any) {
      console.error("Error loading deals:", error);
    } finally {
      setLoading(false);
    }
  };

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

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client name or phone..."
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
                {deals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No deals found without a worker assigned
                  </p>
                ) : (
                  deals.map((deal) => (
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
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{deal.client_name}</p>
                            <p className="text-sm text-muted-foreground">{deal.client_phone}</p>
                          </div>
                        </div>
                        <Badge variant={deal.status === "Active" ? "default" : "secondary"}>
                          {deal.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 ml-7">
                        <span className="text-xs font-medium text-primary">{deal.deal_number}</span>
                        <span className="text-xs text-muted-foreground">• {deal.service_type}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>

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
