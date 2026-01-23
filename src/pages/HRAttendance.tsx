import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Coffee, 
  Users,
  Timer,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  FileText,
  Calculator,
  RotateCcw,
  Shield,
  Calendar,
  Search,
  UserX
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserRole } from "@/hooks/useUserRole";
import { format, formatDistance, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import html2pdf from "html2pdf.js";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const HRAttendance = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const [onBreak, setOnBreak] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("today");
  const [showMarkAbsentDialog, setShowMarkAbsentDialog] = useState(false);
  const [selectedEmployeeForAbsent, setSelectedEmployeeForAbsent] = useState<string>("");
  const [canViewTeamAttendance, setCanViewTeamAttendance] = useState(false);
  
  // Date range state for history
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Filter state for detailed records table
  const [filterName, setFilterName] = useState<string>("");
  
  // Bulk mark absent state (for History tab)
  const [showBulkMarkAbsentDialog, setShowBulkMarkAbsentDialog] = useState(false);
  const [selectedEmployeeForBulkAbsent, setSelectedEmployeeForBulkAbsent] = useState<string>("");

  // Check if user has view-only attendance permission
  useEffect(() => {
    const checkAttendancePermission = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('permissions')
        .eq('id', user.id)
        .single();
      
      const permissions = profile?.permissions as Record<string, any> | null;
      const hasViewPermission = permissions?.attendance?.view_team === true;
      setCanViewTeamAttendance(hasViewPermission);
    };
    checkAttendancePermission();
  }, []);

  // Fetch current user's attendance for today
  const { data: todayAttendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ['today-attendance'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get employee record for current user using user_id
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!employee) return null;

      const { data, error } = await supabase
        .from('attendance_records')
        .select('*, break_records(*)')
        .eq('employee_id', employee.id)
        .eq('attendance_date', format(new Date(), 'yyyy-MM-dd'))
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Fetch all staff attendance for today
  const { data: staffAttendance } = useQuery({
    queryKey: ['staff-attendance-today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          employees!inner(full_name, position, department, photo_url)
        `)
        .eq('attendance_date', format(new Date(), 'yyyy-MM-dd'))
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch all employees for mark absent feature
  const { data: allEmployees } = useQuery({
    queryKey: ['all-employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, position, employment_status')
        .eq('employment_status', 'Active')
        .order('full_name');

      if (error) throw error;
      return data;
    },
  });

  // Get employees who haven't checked in today
  const employeesNotCheckedIn = allEmployees?.filter(emp => 
    !staffAttendance?.some((att: any) => att.employee_id === emp.id)
  ) || [];

  const { data: attendanceHistory, isLoading: loadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['attendance-history', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          employees!inner(id, full_name, position, department, photo_url, user_id)
        `)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .order('attendance_date', { ascending: false })
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: activeTab === 'history',
  });

  // Calculate per-employee statistics from history
  const employeeStats = attendanceHistory ? (() => {
    const statsMap = new Map<string, {
      name: string;
      position: string;
      daysWorked: number;
      totalMinutes: number;
      totalBreakMinutes: number;
      lateDays: number;
      records: any[];
    }>();
    
    attendanceHistory.forEach((record: any) => {
      const empId = record.employees?.id;
      if (!empId) return;
      
      let existing = statsMap.get(empId);
      if (!existing) {
        existing = {
          name: record.employees?.full_name || 'Unknown',
          position: record.employees?.position || 'N/A',
          daysWorked: 0,
          totalMinutes: 0,
          totalBreakMinutes: 0,
          lateDays: 0,
          records: [],
        };
        statsMap.set(empId, existing);
      }
      
      existing.daysWorked++;
      existing.records.push(record);
      existing.totalBreakMinutes += record.total_break_minutes || 0;
      if (record.is_late) existing.lateDays++;
      
      if (record.check_in_time && record.check_out_time) {
        const minutes = Math.floor(
          (new Date(record.check_out_time).getTime() - new Date(record.check_in_time).getTime()) / 60000
        );
        existing.totalMinutes += minutes - (record.total_break_minutes || 0);
      }
    });
    
    return Array.from(statsMap.values()).sort((a, b) => b.daysWorked - a.daysWorked);
  })() : [];

  // Check in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!employee) throw new Error('Employee record not found');

      const { error } = await supabase
        .from('attendance_records')
        .insert({
          employee_id: employee.id,
          attendance_date: format(new Date(), 'yyyy-MM-dd'),
          check_in_time: new Date().toISOString(),
          status: 'checked_in',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['staff-attendance-today'] });
      toast.success('Checked in successfully!');
    },
    onError: (error: Error) => {
      toast.error('Failed to check in: ' + error.message);
    },
  });

  // Check out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      if (!todayAttendance?.id) throw new Error('No check-in record found');

      // First, close any open break records for this attendance
      const { data: openBreaks } = await supabase
        .from('break_records')
        .select('id, break_out_time')
        .eq('attendance_record_id', todayAttendance.id)
        .is('break_back_time', null);

      if (openBreaks && openBreaks.length > 0) {
        const now = new Date().toISOString();
        for (const brk of openBreaks) {
          const breakDuration = Math.floor(
            (new Date(now).getTime() - new Date(brk.break_out_time).getTime()) / 60000
          );
          await supabase
            .from('break_records')
            .update({
              break_back_time: now,
              break_duration_minutes: breakDuration,
            })
            .eq('id', brk.id);
        }

        // Recalculate total break minutes
        const { data: allBreaks } = await supabase
          .from('break_records')
          .select('break_duration_minutes')
          .eq('attendance_record_id', todayAttendance.id)
          .not('break_duration_minutes', 'is', null);

        const totalBreakMinutes = (allBreaks || []).reduce(
          (sum, b) => sum + (b.break_duration_minutes || 0),
          0
        );

        await supabase
          .from('attendance_records')
          .update({ total_break_minutes: totalBreakMinutes })
          .eq('id', todayAttendance.id);
      }

      // Now perform checkout
      const { error } = await supabase
        .from('attendance_records')
        .update({
          check_out_time: new Date().toISOString(),
          status: 'checked_out',
        })
        .eq('id', todayAttendance.id);

      if (error) throw error;

      // Sign out the user after checkout
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['staff-attendance-today'] });
      toast.success('Checked out successfully. Please log in again to continue.');
      // Redirect to login
      navigate('/auth', { replace: true });
    },
    onError: (error: Error) => {
      console.error('Checkout error:', error);
      toast.error('Failed to check out: ' + error.message);
    },
  });

  // Break out mutation - now also checks out the user
  const breakOutMutation = useMutation({
    mutationFn: async () => {
      if (!todayAttendance?.id) throw new Error('No check-in record found');

      // Create break record
      const { error: breakError } = await supabase
        .from('break_records')
        .insert({
          attendance_record_id: todayAttendance.id,
          break_out_time: new Date().toISOString(),
        });

      if (breakError) throw breakError;

      // Update status to on_break AND set check_out_time (break out = check out)
      const { error: statusError } = await supabase
        .from('attendance_records')
        .update({ 
          status: 'on_break',
          check_out_time: new Date().toISOString(),
        })
        .eq('id', todayAttendance.id);

      if (statusError) throw statusError;

      // IMPORTANT: Break out should also sign the user out of the app.
      // They can only return by logging in again.
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['staff-attendance-today'] });

      toast.success('Break started. Please log in again to continue.');
      // Redirect to login explicitly (in case route guards/layout don\'t redirect immediately)
      navigate('/auth', { replace: true });
    },
    onError: (error: Error) => {
      toast.error('Failed to start break: ' + error.message);
    },
  });

  // Break back mutation - now also clears checkout time (sign back in)
  // Handles edge case where status is 'on_break' but no open break record exists
  const breakBackMutation = useMutation({
    mutationFn: async () => {
      if (!todayAttendance?.id) throw new Error("No attendance record found");

      const lastBreak = await supabase
        .from("break_records")
        .select("*")
        .eq("attendance_record_id", todayAttendance.id)
        .is("break_back_time", null)
        .order("break_out_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      let totalBreakMinutes = todayAttendance.total_break_minutes || 0;

      // If there's an open break record, close it properly
      if (lastBreak.data) {
        const breakBackTime = new Date().toISOString();
        const breakDuration = Math.floor(
          (new Date(breakBackTime).getTime() - new Date(lastBreak.data.break_out_time).getTime()) / 60000
        );

        await supabase
          .from("break_records")
          .update({
            break_back_time: breakBackTime,
            break_duration_minutes: breakDuration,
          })
          .eq("id", lastBreak.data.id);

        // Calculate total from all break records for *this* attendance record (today)
        const { data: allBreaks, error: breaksError } = await supabase
          .from("break_records")
          .select("break_duration_minutes")
          .eq("attendance_record_id", todayAttendance.id)
          .not("break_duration_minutes", "is", null);

        if (breaksError) throw breaksError;

        totalBreakMinutes = (allBreaks || []).reduce(
          (sum, b) => sum + (b.break_duration_minutes || 0),
          0
        );
      }
      // If no open break but status is on_break, just fix the status (recovery mode)

      // Update status to checked_in AND clear check_out_time (break back = sign back in)
      await supabase
        .from("attendance_records")
        .update({
          status: "checked_in",
          total_break_minutes: totalBreakMinutes,
          check_out_time: null, // Clear checkout time - user is signed back in
        })
        .eq("id", todayAttendance.id);
    },
    onSuccess: () => {
      setOnBreak(false);
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['staff-attendance-today'] });
      toast.success("Break ended - you are now signed back in");
    },
    onError: (error: Error) => {
      toast.error('Failed to end break: ' + error.message);
    },
  });

  // Admin: Reset attendance for a user (delete today's record so they can check in fresh)
  const resetAttendanceMutation = useMutation({
    mutationFn: async (attendanceId: string) => {
      // First delete all break records for this attendance
      await supabase
        .from('break_records')
        .delete()
        .eq('attendance_record_id', attendanceId);

      // Then delete the attendance record
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', attendanceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['staff-attendance-today'] });
      toast.success('Attendance reset successfully - user can now check in fresh');
      setResetTargetId(null);
    },
    onError: (error: Error) => {
      toast.error('Failed to reset attendance: ' + error.message);
    },
  });

  // Admin: Force checkout for a user
  const forceCheckoutMutation = useMutation({
    mutationFn: async (attendanceId: string) => {
      // Close any open breaks first
      const { data: openBreaks } = await supabase
        .from('break_records')
        .select('id, break_out_time')
        .eq('attendance_record_id', attendanceId)
        .is('break_back_time', null);

      if (openBreaks && openBreaks.length > 0) {
        const now = new Date().toISOString();
        for (const brk of openBreaks) {
          const breakDuration = Math.floor(
            (new Date(now).getTime() - new Date(brk.break_out_time).getTime()) / 60000
          );
          await supabase
            .from('break_records')
            .update({
              break_back_time: now,
              break_duration_minutes: breakDuration,
            })
            .eq('id', brk.id);
        }
      }

      // Force checkout
      const { error } = await supabase
        .from('attendance_records')
        .update({
          check_out_time: new Date().toISOString(),
          status: 'checked_out',
        })
        .eq('id', attendanceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['staff-attendance-today'] });
      toast.success('User checked out successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to checkout user: ' + error.message);
    },
  });

  // Admin: Force break for a user
  const forceBreakMutation = useMutation({
    mutationFn: async (attendanceId: string) => {
      // Insert a break record for the user
      const { error: breakError } = await supabase
        .from('break_records')
        .insert({
          attendance_record_id: attendanceId,
          break_out_time: new Date().toISOString(),
        });

      if (breakError) throw breakError;

      // Update status to on_break
      const { error: statusError } = await supabase
        .from('attendance_records')
        .update({ status: 'on_break' })
        .eq('id', attendanceId);

      if (statusError) throw statusError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['staff-attendance-today'] });
      toast.success('Employee forced on break');
    },
    onError: (error: Error) => {
      toast.error('Failed to force break: ' + error.message);
    },
  });

  // Mark absent mutation
  const markAbsentMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase
        .from('attendance_records')
        .insert({
          employee_id: employeeId,
          attendance_date: format(new Date(), 'yyyy-MM-dd'),
          status: 'absent',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['staff-attendance-today'] });
      toast.success('Employee marked as absent');
      setShowMarkAbsentDialog(false);
      setSelectedEmployeeForAbsent("");
    },
    onError: (error: Error) => {
      toast.error('Failed to mark absent: ' + error.message);
    },
  });

  // Bulk mark absent mutation (for History tab - mark absent for date range)
  const bulkMarkAbsentMutation = useMutation({
    mutationFn: async ({ employeeId, fromDate, toDate }: { employeeId: string; fromDate: string; toDate: string }) => {
      const dates = eachDayOfInterval({
        start: parseISO(fromDate),
        end: parseISO(toDate),
      });
      
      // Get existing attendance records for this employee in the date range
      const { data: existingRecords } = await supabase
        .from('attendance_records')
        .select('attendance_date')
        .eq('employee_id', employeeId)
        .gte('attendance_date', fromDate)
        .lte('attendance_date', toDate);
      
      const existingDates = new Set(existingRecords?.map(r => r.attendance_date) || []);
      
      // Filter to only dates that don't have a record yet
      const datesToMark = dates
        .map(d => format(d, 'yyyy-MM-dd'))
        .filter(d => !existingDates.has(d));
      
      if (datesToMark.length === 0) {
        throw new Error('All dates in this range already have attendance records');
      }
      
      // Insert absent records for all missing dates
      const { error } = await supabase
        .from('attendance_records')
        .insert(datesToMark.map(date => ({
          employee_id: employeeId,
          attendance_date: date,
          status: 'absent' as const,
        })));
      
      if (error) throw error;
      
      return datesToMark.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-history'] });
      toast.success(`Marked absent for ${count} day${count > 1 ? 's' : ''}`);
      setShowBulkMarkAbsentDialog(false);
      setSelectedEmployeeForBulkAbsent("");
    },
    onError: (error: Error) => {
      toast.error('Failed to mark absent: ' + error.message);
    },
  });

  const generatePDF = async () => {
    const element = document.createElement("div");
    element.innerHTML = `
      <div style="padding: 40px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; margin-bottom: 10px;">Tadmaids HR Attendance Report</h1>
          <p style="color: #666; font-size: 16px;">${format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px;">
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="color: #16a34a; font-size: 32px; margin: 0;">${staffAttendance?.filter(s => s.status === "checked_in").length || 0}</h3>
            <p style="color: #166534; margin: 5px 0 0 0;">Working Now</p>
          </div>
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="color: #d97706; font-size: 32px; margin: 0;">${staffAttendance?.filter(s => s.status === "on_break").length || 0}</h3>
            <p style="color: #92400e; margin: 5px 0 0 0;">On Break</p>
          </div>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="color: #6b7280; font-size: 32px; margin: 0;">${staffAttendance?.filter(s => s.status === "checked_out").length || 0}</h3>
            <p style="color: #374151; margin: 5px 0 0 0;">Checked Out</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 12px; text-align: left;">Staff Name</th>
              <th style="padding: 12px; text-align: left;">Position</th>
              <th style="padding: 12px; text-align: center;">Check In</th>
              <th style="padding: 12px; text-align: center;">Check Out</th>
              <th style="padding: 12px; text-align: center;">Break Time</th>
              <th style="padding: 12px; text-align: center;">Net Hours</th>
              <th style="padding: 12px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${(staffAttendance || []).map((staff: any) => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px;">${staff.employees?.full_name || "N/A"}</td>
                <td style="padding: 12px;">${staff.employees?.position || "N/A"}</td>
                <td style="padding: 12px; text-align: center;">${staff.check_in_time ? format(new Date(staff.check_in_time), "h:mm a") : "-"}</td>
                <td style="padding: 12px; text-align: center;">${staff.check_out_time ? format(new Date(staff.check_out_time), "h:mm a") : "-"}</td>
                <td style="padding: 12px; text-align: center;">${staff.total_break_minutes} min</td>
                <td style="padding: 12px; text-align: center;">${staff.net_working_hours?.toFixed(2) || "0.00"}h</td>
                <td style="padding: 12px; text-align: center;">
                  <span style="background: ${staff.status === "checked_in" ? "#dcfce7" : staff.status === "on_break" ? "#fef3c7" : "#f3f4f6"}; 
                               color: ${staff.status === "checked_in" ? "#16a34a" : staff.status === "on_break" ? "#d97706" : "#6b7280"}; 
                               padding: 4px 12px; border-radius: 12px; font-size: 12px;">
                    ${staff.status === "checked_in" ? "Working" : staff.status === "on_break" ? "On Break" : "Checked Out"}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <p>Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
        </div>
      </div>
    `;

    const opt = {
      margin: 10,
      filename: `attendance-report-${format(new Date(), "yyyy-MM-dd")}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "landscape" as const },
    };

    html2pdf().set(opt).from(element).save();
    
    toast.success("PDF generated successfully");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Working</Badge>;
      case 'on_break':
        return <Badge className="bg-yellow-500"><Coffee className="h-3 w-3 mr-1" />On Break</Badge>;
      case 'checked_out':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Checked Out</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Absent</Badge>;
    }
  };

  const stats = {
    working: staffAttendance?.filter(a => a.status === 'checked_in').length || 0,
    onBreak: staffAttendance?.filter(a => a.status === 'on_break').length || 0,
    checkedOut: staffAttendance?.filter(a => a.status === 'checked_out').length || 0,
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Smart Attendance</h1>
            <p className="text-muted-foreground">UAE Labor Law Compliant Tracking</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isAdmin && (
              <>
                <Button variant="outline" onClick={() => setShowMarkAbsentDialog(true)}>
                  <UserX className="mr-2 h-4 w-4" />
                  Mark Absent
                </Button>
                <Button variant="outline" onClick={() => navigate("/hr/payroll")}>
                  <Calculator className="mr-2 h-4 w-4" />
                  Payroll
                </Button>
              </>
            )}
            <Button variant="outline" onClick={generatePDF}>
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Clock className="h-4 w-4 mr-2" />
              {format(new Date(), 'EEEE, MMMM dd, yyyy')}
            </Badge>
          </div>
        </div>

        {/* Tabs for Today / History - History only for admins */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full max-w-md ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Today
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                History
              </TabsTrigger>
            )}
          </TabsList>

          {/* Today Tab */}
          <TabsContent value="today" className="space-y-6 mt-4">
            {/* Personal Attendance Card */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  My Attendance Today
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!todayAttendance?.check_in_time ? (
                  <div className="text-center py-8">
                    <Button
                      size="lg"
                      onClick={() => checkInMutation.mutate()}
                      disabled={checkInMutation.isPending}
                      className="w-full max-w-xs"
                    >
                      <LogIn className="h-5 w-5 mr-2" />
                      Check In
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Start your workday
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <LogIn className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Check In</p>
                          <p className="font-semibold">{format(new Date(todayAttendance.check_in_time), 'hh:mm a')}</p>
                        </div>
                      </div>
                      {todayAttendance.check_out_time && (
                        <div className="flex items-center gap-2">
                          <LogOut className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Check Out</p>
                            <p className="font-semibold">{format(new Date(todayAttendance.check_out_time), 'hh:mm a')}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Coffee className="h-4 w-4 text-yellow-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Break Time</p>
                          <p className="font-semibold">{todayAttendance.total_break_minutes} min</p>
                        </div>
                      </div>
                    </div>

                    {todayAttendance.is_late && (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>Late by {todayAttendance.late_minutes} minutes</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Working Now</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.working}</div>
                  <p className="text-xs text-muted-foreground">Active staff members</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">On Break</CardTitle>
                  <Coffee className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.onBreak}</div>
                  <p className="text-xs text-muted-foreground">Taking a break</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
                  <LogOut className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.checkedOut}</div>
                  <p className="text-xs text-muted-foreground">Finished for today</p>
                </CardContent>
              </Card>
            </div>

            {/* Team Attendance List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Attendance Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Center Opened/Closed Time */}
                {(() => {
                  const checkInTimes = staffAttendance
                    ?.filter((a: any) => a.check_in_time)
                    .map((a: any) => new Date(a.check_in_time).getTime());
                  const firstCheckIn = checkInTimes?.length ? new Date(Math.min(...checkInTimes)) : null;
                  
                  const stillWorking = staffAttendance?.filter((a: any) => 
                    a.status === 'checked_in' || a.status === 'on_break'
                  ).length || 0;
                  
                  const checkOutTimes = staffAttendance
                    ?.filter((a: any) => a.check_out_time)
                    .map((a: any) => new Date(a.check_out_time).getTime());
                  const lastCheckOut = checkOutTimes?.length && stillWorking === 0 
                    ? new Date(Math.max(...checkOutTimes)) 
                    : null;
                  
                  const isLate = firstCheckIn && firstCheckIn.getHours() >= 10;
                  
                  return (
                    <div className="space-y-2 mb-4">
                      {firstCheckIn && (
                        <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                          isLate 
                            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' 
                            : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                        }`}>
                          <Clock className={`h-4 w-4 ${isLate ? 'text-red-600' : 'text-green-600'}`} />
                          <span className={`text-sm font-medium ${isLate ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                            CENTER OPENED TODAY - {format(firstCheckIn, 'hh:mm a')}
                          </span>
                        </div>
                      )}
                      {lastCheckOut && (
                        <div className="flex items-center gap-2 p-2 rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                          <LogOut className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                            CENTER CLOSED TODAY - {format(lastCheckOut, 'hh:mm a')}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
                <div className="space-y-3">
                  {staffAttendance?.map((attendance: any) => {
                    const checkInTime = attendance.check_in_time ? new Date(attendance.check_in_time) : null;
                    const checkOutTime = attendance.check_out_time ? new Date(attendance.check_out_time) : null;
                    const now = new Date();
                    
                    let workingMinutes = 0;
                    if (checkInTime) {
                      const endTime = checkOutTime || now;
                      workingMinutes = Math.floor((endTime.getTime() - checkInTime.getTime()) / 60000);
                    }
                    
                    const workingHours = Math.floor(workingMinutes / 60);
                    const workingMins = workingMinutes % 60;
                    
                    return (
                      <div key={attendance.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{attendance.employees?.full_name}</p>
                            <p className="text-sm text-muted-foreground">{attendance.employees?.position}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {attendance.check_in_time && (
                            <div className="text-right space-y-0.5">
                              <p className="text-sm font-medium">
                                Working since {format(new Date(attendance.check_in_time), 'hh:mm a')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Total work: {workingHours}h {workingMins}m • Break: {attendance.total_break_minutes || 0} min
                              </p>
                            </div>
                          )}
                          {getStatusBadge(attendance.status)}
                          
                          {isAdmin && attendance.status !== 'checked_out' && (
                            <div className="flex gap-1">
                              {attendance.status === 'checked_in' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => forceBreakMutation.mutate(attendance.id)}
                                  disabled={forceBreakMutation.isPending}
                                  title="Force break"
                                  className="text-yellow-600 hover:text-yellow-700"
                                >
                                  <Coffee className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => forceCheckoutMutation.mutate(attendance.id)}
                                disabled={forceCheckoutMutation.isPending}
                                title="Force checkout"
                              >
                                <LogOut className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setResetTargetId(attendance.id)}
                                title="Reset attendance"
                                className="text-destructive hover:text-destructive"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6 mt-4">
            {/* Date Range Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Attendance History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <Button onClick={() => refetchHistory()}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button variant="outline" onClick={() => setShowBulkMarkAbsentDialog(true)}>
                    <UserX className="h-4 w-4 mr-2" />
                    Mark Absent
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Showing records from {format(new Date(startDate), 'MMM dd, yyyy')} to {format(new Date(endDate), 'MMM dd, yyyy')}
                  {' '}({differenceInDays(new Date(endDate), new Date(startDate)) + 1} days)
                </p>
              </CardContent>
            </Card>

            {/* Employee Stats Summary */}
            {loadingHistory ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Loading attendance history...</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employeeStats.map((emp, idx) => {
                    const totalHours = Math.floor(emp.totalMinutes / 60);
                    const totalMins = emp.totalMinutes % 60;
                    const avgHoursPerDay = emp.daysWorked > 0 ? (emp.totalMinutes / emp.daysWorked / 60).toFixed(1) : '0';
                    
                    return (
                      <Card key={idx}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            {emp.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{emp.position}</p>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                              <p className="font-semibold text-green-700 dark:text-green-400">{emp.daysWorked}</p>
                              <p className="text-xs text-muted-foreground">Days Worked</p>
                            </div>
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                              <p className="font-semibold text-blue-700 dark:text-blue-400">{totalHours}h {totalMins}m</p>
                              <p className="text-xs text-muted-foreground">Total Hours</p>
                            </div>
                            <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                              <p className="font-semibold text-yellow-700 dark:text-yellow-400">{emp.totalBreakMinutes}m</p>
                              <p className="text-xs text-muted-foreground">Break Time</p>
                            </div>
                            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                              <p className="font-semibold text-purple-700 dark:text-purple-400">{avgHoursPerDay}h</p>
                              <p className="text-xs text-muted-foreground">Avg/Day</p>
                            </div>
                          </div>
                          {emp.lateDays > 0 && (
                            <div className="flex items-center gap-1 text-xs text-destructive">
                              <AlertCircle className="h-3 w-3" />
                              <span>Late {emp.lateDays} time{emp.lateDays > 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {employeeStats.length === 0 && (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">No attendance records found for this date range.</p>
                    </CardContent>
                  </Card>
                )}

                {/* Detailed Records Table */}
                {attendanceHistory && attendanceHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Detailed Attendance Records
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Filters Section */}
                      <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg border">
                        <div className="flex-1 min-w-[200px]">
                          <Label className="text-xs text-muted-foreground mb-1 block">Filter by Name</Label>
                          <Select value={filterName} onValueChange={setFilterName}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Employees" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Employees</SelectItem>
                              {/* Get unique employee names from the history */}
                              {Array.from(new Set(attendanceHistory.map((r: any) => r.employees?.full_name)))
                                .filter(Boolean)
                                .sort()
                                .map((name: string) => (
                                  <SelectItem key={name} value={name}>{name}</SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setFilterName("")}
                          >
                            Clear Filters
                          </Button>
                        </div>
                      </div>

                      {/* Filtered results count */}
                      <p className="text-sm text-muted-foreground">
                        Showing {attendanceHistory.filter((record: any) => {
                          if (filterName && filterName !== "all" && record.employees?.full_name !== filterName) return false;
                          return true;
                        }).length} of {attendanceHistory.length} records
                        {filterName && filterName !== "all" && ` for ${filterName}`}
                        {` from ${format(new Date(startDate), 'MMM dd, yyyy')} to ${format(new Date(endDate), 'MMM dd, yyyy')}`}
                      </p>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Date</th>
                              <th className="text-left p-2">Name</th>
                              <th className="text-center p-2">Check In</th>
                              <th className="text-center p-2">Check Out</th>
                              <th className="text-center p-2">Break</th>
                              <th className="text-center p-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceHistory
                              .filter((record: any) => {
                                // Name filter
                                if (filterName && filterName !== "all" && record.employees?.full_name !== filterName) return false;
                                return true;
                              })
                              .map((record: any) => (
                              <tr key={record.id} className="border-b hover:bg-muted/50">
                                <td className="p-2">{format(new Date(record.attendance_date), 'MMM dd, yyyy')}</td>
                                <td className="p-2">{record.employees?.full_name}</td>
                                <td className="p-2 text-center">
                                  {record.check_in_time ? format(new Date(record.check_in_time), 'hh:mm a') : '-'}
                                </td>
                                <td className="p-2 text-center">
                                  {record.check_out_time ? format(new Date(record.check_out_time), 'hh:mm a') : '-'}
                                </td>
                                <td className="p-2 text-center">{record.total_break_minutes || 0}m</td>
                                <td className="p-2 text-center">{getStatusBadge(record.status)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Break/Check Out Fixed Button */}
      {todayAttendance?.check_in_time && todayAttendance.status !== 'checked_out' && (
        <div className="fixed bottom-24 right-6 z-50">
          {todayAttendance.status !== 'on_break' ? (
            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                variant="outline"
                onClick={() => breakOutMutation.mutate()}
                disabled={breakOutMutation.isPending}
                className="shadow-lg hover:shadow-xl"
              >
                <Coffee className="h-5 w-5 mr-2" />
                Break Out
              </Button>
              <Button
                size="lg"
                onClick={() => setShowCheckoutConfirm(true)}
                disabled={checkOutMutation.isPending}
                className="shadow-lg hover:shadow-xl"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Check Out
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              onClick={() => breakBackMutation.mutate()}
              disabled={breakBackMutation.isPending}
              className="shadow-lg hover:shadow-xl"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Break Back
            </Button>
          )}
        </div>
      )}

      {/* Checkout Confirmation Dialog */}
      <AlertDialog open={showCheckoutConfirm} onOpenChange={setShowCheckoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Check Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to check out? This will end your workday.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                checkOutMutation.mutate();
                setShowCheckoutConfirm(false);
              }}
            >
              Yes, Check Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Reset Confirmation Dialog */}
      <AlertDialog open={!!resetTargetId} onOpenChange={(open) => !open && setResetTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              Reset Attendance Record
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the attendance record for today, allowing the user to check in fresh. 
              All break records will also be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetTargetId && resetAttendanceMutation.mutate(resetTargetId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset Attendance
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark Absent Dialog */}
      <AlertDialog open={showMarkAbsentDialog} onOpenChange={setShowMarkAbsentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-muted-foreground" />
              Mark Employee as Absent
            </AlertDialogTitle>
            <AlertDialogDescription>
              Select an employee to mark as absent for today. Only employees who haven't checked in yet are shown.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="absent-employee">Select Employee</Label>
            <Select 
              value={selectedEmployeeForAbsent} 
              onValueChange={setSelectedEmployeeForAbsent}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employeesNotCheckedIn.length === 0 ? (
                  <SelectItem value="none" disabled>All employees have checked in</SelectItem>
                ) : (
                  employeesNotCheckedIn.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name} - {emp.position || 'N/A'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedEmployeeForAbsent("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedEmployeeForAbsent && markAbsentMutation.mutate(selectedEmployeeForAbsent)}
              disabled={!selectedEmployeeForAbsent || markAbsentMutation.isPending}
            >
              Mark Absent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Mark Absent Dialog (History Tab) */}
      <AlertDialog open={showBulkMarkAbsentDialog} onOpenChange={setShowBulkMarkAbsentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-muted-foreground" />
              Mark Employee Absent for Date Range
            </AlertDialogTitle>
            <AlertDialogDescription>
              Select an employee to mark as absent for all dates from{' '}
              <strong>{format(new Date(startDate), 'MMM dd, yyyy')}</strong> to{' '}
              <strong>{format(new Date(endDate), 'MMM dd, yyyy')}</strong>.
              Only dates without existing attendance records will be marked as absent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="bulk-absent-employee">Select Employee</Label>
            <Select 
              value={selectedEmployeeForBulkAbsent} 
              onValueChange={setSelectedEmployeeForBulkAbsent}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {allEmployees?.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name} - {emp.position || 'N/A'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedEmployeeForBulkAbsent("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedEmployeeForBulkAbsent && bulkMarkAbsentMutation.mutate({
                employeeId: selectedEmployeeForBulkAbsent,
                fromDate: startDate,
                toDate: endDate,
              })}
              disabled={!selectedEmployeeForBulkAbsent || bulkMarkAbsentMutation.isPending}
            >
              {bulkMarkAbsentMutation.isPending ? 'Marking...' : 'Mark Absent'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default HRAttendance;