import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageCircle, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateWhatsAppLink, formatPhoneDisplay } from "@/lib/phoneValidation";
import { format, parseISO } from "date-fns";

interface Lead {
  id: string;
  client_name: string | null;
  mobile_number: string;
  status: string;
  service_required: string | null;
  nationality_code: string | null;
  emirate: string | null;
  hot: boolean;
  remind_me: string | null;
  visa_expiry_date: string | null;
  created_at: string;
  assigned_to: string | null;
  email: string | null;
  updated_at: string;
  lead_source: string | null;
}

interface LeadKanbanBoardProps {
  leads: Lead[];
  userId: string;
  onLeadUpdate: () => void;
}

const COLUMNS = [
  { id: "New Lead", title: "New Un/Act", color: "bg-blue-100 dark:bg-blue-950 border-blue-400 dark:border-blue-600" },
  { id: "Called No Answer", title: "Contacted - No Answer", color: "bg-amber-100 dark:bg-amber-950 border-amber-400 dark:border-amber-600" },
  { id: "Called Engaged", title: "Contacted - Engaged", color: "bg-emerald-100 dark:bg-emerald-950 border-emerald-400 dark:border-emerald-600" },
  { id: "Called COLD", title: "Contacted - Dead/Cold", color: "bg-slate-100 dark:bg-slate-950 border-slate-400 dark:border-slate-600" },
];

export const LeadKanbanBoard = ({ leads, userId, onLeadUpdate }: LeadKanbanBoardProps) => {
  const { toast } = useToast();
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const getLeadsByColumn = (columnId: string) => {
    return leads.filter((lead) => lead.status === columnId);
  };

  const getColumnIndex = (status: string) => {
    return COLUMNS.findIndex((column) => column.id === status);
  };

  const logActivity = async (leadId: string, activityType: string, title: string, description: string) => {
    try {
      await supabase.from("lead_activities").insert({
        lead_id: leadId,
        user_id: userId,
        activity_type: activityType,
        title: title,
        description: description,
        metadata: { action: activityType },
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  const handleWhatsApp = async (lead: Lead) => {
    const link = generateWhatsAppLink(lead.mobile_number);
    window.open(link, '_blank');
    await logActivity(lead.id, "communication", "WhatsApp Contact", `Opened WhatsApp chat with ${lead.client_name || lead.mobile_number}`);
    toast({ title: "WhatsApp Opened", description: "Activity logged" });
  };

  const handleCall = async (lead: Lead) => {
    window.location.href = `tel:${lead.mobile_number}`;
    await logActivity(lead.id, "communication", "Phone Call", `Called ${lead.client_name || lead.mobile_number}`);
    toast({ title: "Call Initiated", description: "Activity logged" });
  };

  const handleEmail = async (lead: Lead) => {
    if (lead.email) {
      window.location.href = `mailto:${lead.email}`;
      await logActivity(lead.id, "communication", "Email Sent", `Sent email to ${lead.email}`);
      toast({ title: "Email Opened", description: "Activity logged" });
    } else {
      toast({ title: "No Email", description: "This lead has no email address", variant: "destructive" });
    }
  };

  const handleStatusChange = async (lead: Lead, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus as any })
        .eq("id", lead.id);

      if (error) throw error;

      await logActivity(lead.id, "status_change", "Status Changed", `Status changed from ${lead.status} to ${newStatus}`);
      
      toast({
        title: "Status Updated",
        description: `Lead moved to ${newStatus}`,
      });
      
      // Don't reload - realtime will update
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (!draggedLead || draggedLead.status === columnId) {
      setDraggedLead(null);
      return;
    }

    await handleStatusChange(draggedLead, columnId);
    setDraggedLead(null);
  };

  const moveLeadToAdjacentColumn = async (lead: Lead, direction: 1 | -1) => {
    const currentIndex = getColumnIndex(lead.status);
    if (currentIndex === -1) return;

    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= COLUMNS.length) return;

    const newStatus = COLUMNS[newIndex].id;
    await handleStatusChange(lead, newStatus);
  };

  const renderLeadCard = (lead: Lead, columnId: string) => {

    const lastUpdate = lead.updated_at ? format(parseISO(lead.updated_at), "MMM dd, yyyy") : "N/A";
    const nextDue = lead.remind_me ? format(parseISO(lead.remind_me), "MMM dd, yyyy") : "No reminder";

    return (
      <div
        key={lead.id}
        draggable
        onDragStart={(e) => handleDragStart(e, lead)}
        className="bg-card border rounded-md p-1.5 shadow-sm hover:shadow-md transition-all cursor-move hover:scale-[1.02]"
      >
        {/* Header with Phone Number and Hot Indicator */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-[11px]">
            {formatPhoneDisplay(lead.mobile_number)}
          </h3>
          {lead.hot && (
            <Badge variant="destructive" className="flex items-center gap-0.5 text-[10px] py-0 px-1 h-4">
              <Flame className="h-2.5 w-2.5" />
              HOT
            </Badge>
          )}
        </div>

        {/* Service Required */}
        <div className="mb-1">
          <p className="text-[11px] font-medium truncate">{lead.service_required || "N/A"}</p>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-1 mb-1">
          <div>
            <p className="text-[9px] text-muted-foreground">Last Update</p>
            <p className="text-[10px] font-medium">{lastUpdate}</p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground">Next Due</p>
            <p className="text-[10px] font-medium">{nextDue}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-0.5 mb-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleWhatsApp(lead)}
            className="flex-1 h-6 text-xs px-0.5"
          >
            <MessageCircle className="h-2.5 w-2.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCall(lead)}
            className="flex-1 h-6 text-xs px-0.5"
          >
            <Phone className="h-2.5 w-2.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEmail(lead)}
            className="flex-1 h-6 text-xs px-0.5"
            disabled={!lead.email}
          >
            <Mail className="h-2.5 w-2.5" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-1 border-t">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => moveLeadToAdjacentColumn(lead, -1)}
            className="h-5 w-5 p-0"
          >
            <ChevronLeft className="h-2.5 w-2.5" />
          </Button>
          <span className="text-[10px] text-muted-foreground">
            {columnId}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => moveLeadToAdjacentColumn(lead, 1)}
            className="h-5 w-5 p-0"
          >
            <ChevronRight className="h-2.5 w-2.5" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
      {COLUMNS.map((column) => {
        const columnLeads = getLeadsByColumn(column.id);
        
        return (
          <div
            key={column.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`rounded-lg border-2 ${column.color} p-3 min-h-[400px]`}
          >
            {/* Column Header */}
            <div className="mb-3">
              <h2 className="font-semibold text-base mb-1.5">{column.title}</h2>
              <Badge variant="secondary" className="text-xs">{columnLeads.length} leads</Badge>
            </div>

            {/* Lead Cards */}
            <div className="space-y-2">
              {columnLeads.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No leads
                </div>
              ) : (
                columnLeads.map((lead) => renderLeadCard(lead, column.id))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
