import { FileText, Users, MessageSquare, UserPlus, Clock, Coffee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import TeamChat from "./TeamChat";
import QuickLeadEntry from "./crm/QuickLeadEntry";

const FloatingButtons = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [activeBreakId, setActiveBreakId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
      if (user) {
        checkBreakStatus(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
      if (session?.user) {
        checkBreakStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
    if (!activeBreakId) return;

    try {
      // Fetch the break record to get break_out_time and attendance_record_id
      const { data: breakRecord, error: fetchError } = await supabase
        .from('break_records')
        .select('break_out_time, attendance_record_id')
        .eq('id', activeBreakId)
        .single();

      if (fetchError || !breakRecord) throw new Error('Break record not found');

      const breakBackTime = new Date().toISOString();
      const breakDuration = Math.floor(
        (new Date(breakBackTime).getTime() - new Date(breakRecord.break_out_time).getTime()) / 60000
      );

      // Update break record with back time and duration
      const { error: updateBreakError } = await supabase
        .from('break_records')
        .update({
          break_back_time: breakBackTime,
          break_duration_minutes: breakDuration,
        })
        .eq('id', activeBreakId);

      if (updateBreakError) throw updateBreakError;

      // Fetch attendance record to get current total break minutes
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('total_break_minutes')
        .eq('id', breakRecord.attendance_record_id)
        .single();

      if (attendanceError) throw attendanceError;

      // Update attendance record status and total break minutes
      const totalBreakMinutes = (attendance?.total_break_minutes || 0) + breakDuration;
      const { error: updateAttendanceError } = await supabase
        .from('attendance_records')
        .update({
          status: 'checked_in',
          total_break_minutes: totalBreakMinutes,
        })
        .eq('id', breakRecord.attendance_record_id);

      if (updateAttendanceError) throw updateAttendanceError;

      toast.success('Welcome back! Break ended.');
      setOnBreak(false);
      setActiveBreakId(null);
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['staff-attendance-today'] });
    } catch (error: any) {
      toast.error(error.message);
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
    const phoneNumber = "971565822258";
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