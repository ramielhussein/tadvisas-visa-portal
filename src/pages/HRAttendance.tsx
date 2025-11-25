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
  TrendingUp
} from "lucide-react";
import { format, formatDistance } from "date-fns";

const HRAttendance = () => {
  const queryClient = useQueryClient();
  const [onBreak, setOnBreak] = useState(false);

  // Fetch current user's attendance for today
  const { data: todayAttendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ['today-attendance'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get employee record for current user
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('created_by', user.id)
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
        .eq('created_by', user.id)
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
      if (!todayAttendance?.id) throw new Error('No check-in record found');

      // Find the active break (no break_back_time)
      const { data: activeBreak } = await supabase
        .from('break_records')
        .select('*')
        .eq('attendance_record_id', todayAttendance.id)
        .is('break_back_time', null)
        .order('break_out_time', { ascending: false })
        .limit(1)
        .single();

      if (!activeBreak) throw new Error('No active break found');

      const breakBackTime = new Date();
      const breakDuration = Math.floor(
        (breakBackTime.getTime() - new Date(activeBreak.break_out_time).getTime()) / 60000
      );

      const { error: breakError } = await supabase
        .from('break_records')
        .update({
          break_back_time: breakBackTime.toISOString(),
          break_duration_minutes: breakDuration,
        })
        .eq('id', activeBreak.id);

      if (breakError) throw breakError;

      // Update total break minutes on attendance record
      const { data: allBreaks } = await supabase
        .from('break_records')
        .select('break_duration_minutes')
        .eq('attendance_record_id', todayAttendance.id)
        .not('break_duration_minutes', 'is', null);

      const totalBreakMinutes = allBreaks?.reduce((sum, b) => sum + (b.break_duration_minutes || 0), 0) || 0;

      const { error: statusError } = await supabase
        .from('attendance_records')
        .update({ 
          status: 'checked_in',
          total_break_minutes: totalBreakMinutes,
        })
        .eq('id', todayAttendance.id);

      if (statusError) throw statusError;
    },
    onSuccess: () => {
      setOnBreak(false);
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['staff-attendance-today'] });
      toast.success('Break ended');
    },
    onError: (error: Error) => {
      toast.error('Failed to end break: ' + error.message);
    },
  });

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
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Clock className="h-4 w-4 mr-2" />
            {format(new Date(), 'EEEE, MMMM dd, yyyy')}
          </Badge>
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

                {todayAttendance.status !== 'checked_out' && (
                  <div className="flex gap-2">
                    {todayAttendance.status !== 'on_break' ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => breakOutMutation.mutate()}
                          disabled={breakOutMutation.isPending}
                        >
                          <Coffee className="h-4 w-4 mr-2" />
                          Break Out
                        </Button>
                        <Button
                          onClick={() => checkOutMutation.mutate()}
                          disabled={checkOutMutation.isPending}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Check Out
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => breakBackMutation.mutate()}
                        disabled={breakBackMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Break Back
                      </Button>
                    )}
                  </div>
                )}

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
            <div className="space-y-3">
              {staffAttendance?.map((attendance: any) => (
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
                      <div className="text-right">
                        <p className="text-sm font-medium">{format(new Date(attendance.check_in_time), 'hh:mm a')}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistance(new Date(attendance.check_in_time), new Date(), { addSuffix: true })}
                        </p>
                      </div>
                    )}
                    {getStatusBadge(attendance.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default HRAttendance;