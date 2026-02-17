import { FileText, Users, MessageSquare, UserPlus, Clock, Coffee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import TeamChat from "./TeamChat";
import QuickLeadEntry from "./crm/QuickLeadEntry";
import { useAuth } from "@/contexts/AuthContext";

const FloatingButtons = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [activeBreakId, setActiveBreakId] = useState<string | null>(null);

  const checkBreakStatus = async (userId: string) => {
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('created_by', userId)
      .single();

    if (!employee) return;

    const { data: attendance } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('employee_id', employee.id)
      .eq('attendance_date', format(new Date(), 'yyyy-MM-dd'))
      .maybeSingle();

    if (!attendance) return;

    const { data: activeBreak } = await supabase
      .from('break_records')
      .select('id')
      .eq('attendance_record_id', attendance.id)
      .is('break_back_time', null)
      .maybeSingle();

    if (activeBreak) {
      setOnBreak(true);
      setActiveBreakId(activeBreak.id);
    } else {
      setOnBreak(false);
      setActiveBreakId(null);
    }
  };

  const handleBreakBack = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get employee record
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!employee) {
        toast.error('Employee record not found');
        return;
      }

      const today = format(new Date(), 'yyyy-MM-dd');

      // Get today's attendance record
      const { data: attendance } = await supabase
        .from('attendance_records')
        .select('id, total_break_minutes')
        .eq('employee_id', employee.id)
        .eq('attendance_date', today)
        .maybeSingle();

      if (!attendance) {
        toast.error('No attendance record found for today');
        return;
      }

      // Find open break record (if any)
      const { data: openBreak } = await supabase
        .from('break_records')
        .select('id, break_out_time')
        .eq('attendance_record_id', attendance.id)
        .is('break_back_time', null)
        .order('break_out_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      let totalBreakMinutes = attendance.total_break_minutes || 0;

      // If there's an open break, close it properly
      if (openBreak) {
        const breakBackTime = new Date().toISOString();
        const breakDuration = Math.floor(
          (new Date(breakBackTime).getTime() - new Date(openBreak.break_out_time).getTime()) / 60000
        );

        await supabase
          .from('break_records')
          .update({
            break_back_time: breakBackTime,
            break_duration_minutes: breakDuration,
          })
          .eq('id', openBreak.id);

        // Recalculate total break minutes
        const { data: allBreaks } = await supabase
          .from('break_records')
          .select('break_duration_minutes')
          .eq('attendance_record_id', attendance.id)
          .not('break_duration_minutes', 'is', null);

        totalBreakMinutes = (allBreaks || []).reduce(
          (sum, b) => sum + (b.break_duration_minutes || 0),
          0
        );
      }
      // If no open break but we're here, just fix the attendance status (recovery mode)

      // Update attendance record status - no need to clear check_out_time since break doesn't set it
      const { error: updateError } = await supabase
        .from('attendance_records')
        .update({
          status: 'checked_in',
          total_break_minutes: totalBreakMinutes,
        })
        .eq('id', attendance.id);

      if (updateError) throw updateError;

      toast.success('Welcome back! Break ended.');
      setOnBreak(false);
      setActiveBreakId(null);
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['staff-attendance-today'] });
    } catch (error: any) {
      toast.error('Failed to end break: ' + error.message);
    }
  };

  const handleMaidVisaClick = () => {
    if ((window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': 'AW-17128942210'
      });
    }
    const phoneNumber = "971567222248";
    const message = "Hi, I need help with maid visa services";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleHireMaidClick = () => {
    if ((window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': 'AW-17128942210'
      });
    }
    const phoneNumber = "971567222248";
    const message = "Hi, I need help hiring a maid";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleChatOpen = () => {
    setIsChatOpen(true);
    setIsChatMinimized(false);
    setUnreadCount(0);
  };

  // Show authenticated buttons when logged in
  if (isAuthenticated) {
    return (
      <>
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[60] flex flex-nowrap gap-3 whitespace-nowrap">
          {onBreak && (
            <button
              onClick={handleBreakBack}
              className="group shrink-0 flex items-center gap-2 bg-green-600 text-white px-3 py-2 md:px-5 md:py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-green-700 transition-all transform hover:scale-105 whitespace-nowrap animate-pulse"
            >
              <Coffee className="w-4 h-4" />
              <span className="text-xs font-semibold">Break Back</span>
            </button>
          )}
          <button
            onClick={() => navigate('/hr/attendance')}
            className="group shrink-0 flex items-center gap-2 bg-accent text-accent-foreground px-3 py-2 md:px-5 md:py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-accent/90 transition-all transform hover:scale-105 whitespace-nowrap"
          >
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold">Attendance</span>
          </button>
          <button
            onClick={() => setIsAddLeadOpen(true)}
            className="group shrink-0 flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-2 md:px-5 md:py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-secondary/80 transition-all transform hover:scale-105 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span className="text-xs font-semibold">Add Lead</span>
          </button>
          <button
            onClick={handleChatOpen}
            className="group shrink-0 flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 md:px-5 md:py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all transform hover:scale-105 whitespace-nowrap relative"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs font-semibold">Team Chat</span>
            {unreadCount > 0 && !isChatOpen && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </button>
        </div>
        
        <TeamChat 
          isOpen={isChatOpen}
          isMinimized={isChatMinimized}
          onClose={() => setIsChatOpen(false)}
          onMinimize={() => setIsChatMinimized(true)}
          onExpand={() => setIsChatMinimized(false)}
          unreadCount={unreadCount}
        />
        
        <QuickLeadEntry 
          open={isAddLeadOpen}
          onClose={() => setIsAddLeadOpen(false)}
          onSuccess={() => {
            setIsAddLeadOpen(false);
            navigate('/crm');
          }}
        />
      </>
    );
  }

  // Show public WhatsApp buttons when not logged in
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[60] flex flex-nowrap gap-3 whitespace-nowrap">
      <button
        onClick={handleMaidVisaClick}
        className="group shrink-0 flex items-center gap-2 bg-white backdrop-blur-sm border border-[#c9a227]/30 text-[#c9a227] px-3 py-2 md:px-5 md:py-3 rounded-none md:rounded-full shadow-lg hover:shadow-xl hover:bg-[#c9a227]/10 transition-all transform hover:scale-105 whitespace-nowrap"
      >
        <FileText className="w-4 h-4" />
        <span className="text-xs font-semibold">Apply for a Maid Visa</span>
      </button>
      <button
        onClick={handleHireMaidClick}
        className="group shrink-0 flex items-center gap-2 bg-white backdrop-blur-sm border border-[#0f73bd]/30 text-[#0f73bd] px-3 py-2 md:px-5 md:py-3 rounded-none md:rounded-full shadow-lg hover:shadow-xl hover:bg-[#0f73bd]/10 transition-all transform hover:scale-105 whitespace-nowrap"
      >
        <Users className="w-4 h-4" />
        <span className="text-xs font-semibold">Hire a Maid</span>
      </button>
    </div>
  );
};

export default FloatingButtons;