import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Briefcase, UserCheck, UserX, TrendingUp, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface HRStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  byDepartment: { department: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byEmploymentType: { type: string; count: number }[];
}

const HRDashboard = () => {
  const navigate = useNavigate();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['hr-stats'],
    queryFn: async () => {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('employment_status, department, employment_type');

      if (error) throw error;

      const totalEmployees = employees?.length || 0;
      const activeEmployees = employees?.filter(e => e.employment_status === 'Active').length || 0;
      const inactiveEmployees = totalEmployees - activeEmployees;

      // Group by department
      const deptMap = new Map<string, number>();
      employees?.forEach(e => {
        const dept = e.department || 'Unassigned';
        deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
      });
      const byDepartment = Array.from(deptMap.entries()).map(([department, count]) => ({
        department,
        count
      })).sort((a, b) => b.count - a.count);

      // Group by status
      const statusMap = new Map<string, number>();
      employees?.forEach(e => {
        const status = e.employment_status || 'Unknown';
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
      });
      const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        count
      })).sort((a, b) => b.count - a.count);

      // Group by employment type
      const typeMap = new Map<string, number>();
      employees?.forEach(e => {
        const type = e.employment_type || 'Unknown';
        typeMap.set(type, (typeMap.get(type) || 0) + 1);
      });
      const byEmploymentType = Array.from(typeMap.entries()).map(([type, count]) => ({
        type,
        count
      })).sort((a, b) => b.count - a.count);

      return {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        byDepartment,
        byStatus,
        byEmploymentType
      } as HRStats;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'on leave': return 'bg-yellow-500';
      case 'terminated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">HR Dashboard</h1>
              <p className="text-muted-foreground">
                Admin staff headcount and workforce analytics
              </p>
            </div>
            <Button onClick={() => navigate('/hr/attendance')}>
              <Clock className="h-4 w-4 mr-2" />
              Smart Attendance
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Total Admin Staff
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{stats?.totalEmployees || 0}</p>
                    <p className="text-xs text-muted-foreground">All admin staff members</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-green-600" />
                      Active
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">
                      {stats?.activeEmployees || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Currently working</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <UserX className="w-4 h-4 text-gray-600" />
                      Inactive
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-gray-600">
                      {stats?.inactiveEmployees || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Not currently active</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Departments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{stats?.byDepartment.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Active departments</p>
                  </CardContent>
                </Card>
              </div>

              {/* Breakdown Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* By Department */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      By Department
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Department</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats?.byDepartment.map((dept, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{dept.department}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">{dept.count}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* By Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      By Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats?.byStatus.map((status, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Badge className={getStatusColor(status.status)}>
                                {status.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">{status.count}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* By Employment Type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      By Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats?.byEmploymentType.map((type, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{type.type}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">{type.count}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HRDashboard;
