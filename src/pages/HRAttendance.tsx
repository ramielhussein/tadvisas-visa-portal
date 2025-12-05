import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
  Calculator
} from "lucide-react";
import { format, formatDistance } from "date-fns";
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
  const [onBreak, setOnBreak] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);

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

      const { error } = await supabase
        .from('attendance_records')
        .update({
          check_out_time: new Date().toISOString(),
          status: 'checked_out',
        })
        .eq('id', todayAttendance.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['staff-attendance-today'] });
      toast.success('Checked out successfully!');
    },
    onError: (error: Error) => {
      toast.error('Failed to check out: ' + error.message);
    },
  });

  // Break out mutation
  const breakOutMutation = useMutation({
    mutationFn: async () => {
      if (!todayAttendance?.id) throw new Error('No check-in record found');

      const { error: breakError } = await supabase
        .from('break_records')
        .insert({
          attendance_record_id: todayAttendance.id,
          break_out_time: new Date().toISOString(),
        });

      if (breakError) throw breakError;

      const { error: statusError } = await supabase
        .from('attendance_records')
        .update({ status: 'on_break' })
        .eq('id', todayAttendance.id);

      if (statusError) throw statusError;
    },
    onSuccess: () => {
      setOnBreak(true);
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['staff-attendance-today'] });
      toast.success('Break started');
    },
    onError: (error: Error) => {
      toast.error('Failed to start break: ' + error.message);
    },
  });

  // Break back mutation
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
        .single();

      if (!lastBreak.data) throw new Error("No active break found");

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

      const totalBreakMinutes = todayAttendance.total_break_minutes + breakDuration;
      await supabase
        .from("attendance_records")
        .update({
          status: "checked_in",
          total_break_minutes: totalBreakMinutes,
        })
        .eq("id", todayAttendance.id);
    },
    onSuccess: () => {
      setOnBreak(false);
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['staff-attendance-today'] });
      toast.success("Break ended successfully");
    },
    onError: (error: Error) => {
      toast.error('Failed to end break: ' + error.message);
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={generatePDF}>
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={() => navigate("/hr/payroll")}>
              <Calculator className="mr-2 h-4 w-4" />
              Payroll
            </Button>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Clock className="h-4 w-4 mr-2" />
              {format(new Date(), 'EEEE, MMMM dd, yyyy')}
            </Badge>
          </div>
        </div>

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
              
              const checkOutTimes = staffAttendance
                ?.filter((a: any) => a.check_out_time)
                .map((a: any) => new Date(a.check_out_time).getTime());
              const lastCheckOut = checkOutTimes?.length ? new Date(Math.max(...checkOutTimes)) : null;
              
              // Check if opened after 10 AM
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
                // Calculate working hours
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
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
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
    </Layout>
  );
};

export default HRAttendance;