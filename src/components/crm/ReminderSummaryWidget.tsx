import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface Lead {
  id: string;
  client_name: string;
  mobile_number: string;
  remind_me: string;
  status: string;
}

interface ReminderSummaryWidgetProps {
  userId: string;
}

export const ReminderSummaryWidget = ({ userId }: ReminderSummaryWidgetProps) => {
  const [overdue, setOverdue] = useState<Lead[]>([]);
  const [today, setToday] = useState<Lead[]>([]);
  const [upcoming, setUpcoming] = useState<Lead[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, [userId]);

  const fetchReminders = async () => {
    const todayDate = format(new Date(), "yyyy-MM-dd");
    const nextWeek = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");

    const { data } = await supabase
      .from("leads")
      .select("id, client_name, mobile_number, remind_me, status")
      .eq("assigned_to", userId)
      .not("remind_me", "is", null)
      .order("remind_me", { ascending: true });

    if (data) {
      setOverdue(data.filter(lead => lead.remind_me < todayDate));
      setToday(data.filter(lead => lead.remind_me === todayDate));
      setUpcoming(data.filter(lead => lead.remind_me > todayDate && lead.remind_me <= nextWeek));
    }
  };

  const totalReminders = overdue.length + today.length + upcoming.length;

  if (totalReminders === 0) return null;

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <span>Reminder Summary</span>
            <span className="text-sm font-normal text-muted-foreground">
              ({totalReminders} {totalReminders === 1 ? 'reminder' : 'reminders'})
            </span>
          </div>
          <div className="flex gap-4 text-sm font-normal">
            {overdue.length > 0 && (
              <span className="text-destructive font-semibold">
                {overdue.length} Overdue
              </span>
            )}
            {today.length > 0 && (
              <span className="text-orange-500 font-semibold">
                {today.length} Today
              </span>
            )}
            {upcoming.length > 0 && (
              <span className="text-muted-foreground">
                {upcoming.length} Upcoming
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      {expanded && (
        <CardContent className="space-y-4">
          {overdue.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-destructive font-semibold">
                <Clock className="h-4 w-4" />
                <span>Overdue ({overdue.length})</span>
              </div>
              <div className="space-y-2 ml-6">
                {overdue.map(lead => (
                  <Link key={lead.id} to={`/leads/${lead.id}`} className="text-sm flex justify-between items-center p-2 rounded-md bg-destructive/5 border border-destructive/20 hover:bg-destructive/10 transition-colors">
                    <span className="font-medium">{lead.client_name || lead.mobile_number}</span>
                    <span className="text-muted-foreground">{format(new Date(lead.remind_me), "MMM dd, yyyy")}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {today.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-orange-500 font-semibold">
                <Bell className="h-4 w-4" />
                <span>Today ({today.length})</span>
              </div>
              <div className="space-y-2 ml-6">
                {today.map(lead => (
                  <Link key={lead.id} to={`/leads/${lead.id}`} className="text-sm flex justify-between items-center p-2 rounded-md bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors">
                    <span className="font-medium">{lead.client_name || lead.mobile_number}</span>
                    <span className="text-muted-foreground">Due Today</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 font-semibold">
                <Calendar className="h-4 w-4" />
                <span>Upcoming (Next 7 Days) ({upcoming.length})</span>
              </div>
              <div className="space-y-2 ml-6">
                {upcoming.map(lead => (
                  <Link key={lead.id} to={`/leads/${lead.id}`} className="text-sm flex justify-between items-center p-2 rounded-md bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
                    <span className="font-medium">{lead.client_name || lead.mobile_number}</span>
                    <span className="text-muted-foreground">{format(new Date(lead.remind_me), "MMM dd, yyyy")}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
