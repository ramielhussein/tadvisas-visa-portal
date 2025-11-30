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
  { id: "New Lead", title: "New Un/Act", color: "bg-blue-50 border-blue-200" },
  { id: "Called No Answer", title: "Contacted - No Answer", color: "bg-yellow-50 border-yellow-200" },
  { id: "Called Engaged", title: "Contacted - Engaged", color: "bg-green-50 border-green-200" },
  { id: "Called COLD", title: "Contacted - Dead/Cold", color: "bg-gray-50 border-gray-200" },
];

export const LeadKanbanBoard = ({ leads, userId, onLeadUpdate }: LeadKanbanBoardProps) => {
  const { toast } = useToast();
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [currentCardIndices, setCurrentCardIndices] = useState<Record<string, number>>({});

  const getLeadsByColumn = (columnId: string) => {
    return leads.filter(lead => lead.status === columnId);
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
      
      onLeadUpdate();
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

  const handleNext = (columnId: string) => {
    const columnLeads = getLeadsByColumn(columnId);
    const currentIndex = currentCardIndices[columnId] || 0;
    const nextIndex = (currentIndex + 1) % columnLeads.length;
    setCurrentCardIndices({ ...currentCardIndices, [columnId]: nextIndex });
  };

  const handlePrev = (columnId: string) => {
    const columnLeads = getLeadsByColumn(columnId);
    const currentIndex = currentCardIndices[columnId] || 0;
    const prevIndex = (currentIndex - 1 + columnLeads.length) % columnLeads.length;
    setCurrentCardIndices({ ...currentCardIndices, [columnId]: prevIndex });
  };

  const renderLeadCard = (lead: Lead, columnId: string, index: number) => {
    const currentIndex = currentCardIndices[columnId] || 0;
    const isVisible = index === currentIndex;
    
    if (!isVisible) return null;

    const lastUpdate = lead.updated_at ? format(parseISO(lead.updated_at), "MMM dd, yyyy") : "N/A";
    const nextDue = lead.remind_me ? format(parseISO(lead.remind_me), "MMM dd, yyyy") : "No reminder";

    return (
      <div
        key={lead.id}
        draggable
        onDragStart={(e) => handleDragStart(e, lead)}
        className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-move"
      >
        {/* Header with Lead Number and Hot Indicator */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">
            Lead #{lead.id.slice(0, 8)}
          </h3>
          {lead.hot && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Flame className="h-3 w-3" />
              HOT
            </Badge>
          )}
        </div>

        {/* Phone Number */}
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">Phone</p>
          <p className="font-medium">{formatPhoneDisplay(lead.mobile_number)}</p>
        </div>

        {/* Client Name */}
        {lead.client_name && (
          <div className="mb-2">
            <p className="text-sm text-muted-foreground">Client</p>
            <p className="font-medium">{lead.client_name}</p>
          </div>
        )}

        {/* Service Required */}
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">Service</p>
          <p className="font-medium">{lead.service_required || "N/A"}</p>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Last Update</p>
            <p className="text-sm font-medium">{lastUpdate}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Next Due</p>
            <p className="text-sm font-medium">{nextDue}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleWhatsApp(lead)}
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            WhatsApp
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCall(lead)}
            className="flex-1"
          >
            <Phone className="h-4 w-4 mr-1" />
            Call
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEmail(lead)}
            className="flex-1"
            disabled={!lead.email}
          >
            <Mail className="h-4 w-4 mr-1" />
            Email
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handlePrev(columnId)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {getLeadsByColumn(columnId).length}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleNext(columnId)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {COLUMNS.map((column) => {
        const columnLeads = getLeadsByColumn(column.id);
        const currentIndex = currentCardIndices[column.id] || 0;
        
        return (
          <div
            key={column.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`rounded-lg border-2 ${column.color} p-4 min-h-[600px]`}
          >
            {/* Column Header */}
            <div className="mb-4">
              <h2 className="font-semibold text-lg mb-1">{column.title}</h2>
              <Badge variant="secondary">{columnLeads.length} leads</Badge>
            </div>

            {/* Lead Cards */}
            <div className="space-y-4">
              {columnLeads.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No leads in this column
                </div>
              ) : (
                columnLeads.map((lead, index) => renderLeadCard(lead, column.id, index))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
