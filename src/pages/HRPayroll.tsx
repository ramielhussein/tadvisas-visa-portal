import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { FileText, Calendar, DollarSign } from "lucide-react";
import html2pdf from "html2pdf.js";
import { toast } from "sonner";

interface PayrollData {
  employee_id: string;
  full_name: string;
  position: string;
  base_salary: number;
  regular_hours: number;
  overtime_hours: number;
  total_break_minutes: number;
  late_minutes: number;
  days_worked: number;
  allowances: any[];
  deductions: any[];
}

export default function HRPayroll() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [otRate, setOtRate] = useState(1.5);
  const [latePenalty, setLatePenalty] = useState(0.5); // AED per minute

  const { data: payrollData, isLoading } = useQuery({
    queryKey: ["payroll", selectedMonth],
    queryFn: async () => {
      const monthStart = startOfMonth(new Date(selectedMonth));
      const monthEnd = endOfMonth(new Date(selectedMonth));

      const { data: attendance, error: attendanceError } = await supabase
        .from("attendance_records")
        .select(`
          employee_id,
          check_in_time,
          check_out_time,
          regular_hours,
          overtime_hours,
          total_break_minutes,
          late_minutes,
          employees (
            full_name,
            position,
            base_salary,
            allowances,
            deductions
          )
        `)
        .gte("attendance_date", format(monthStart, "yyyy-MM-dd"))
        .lte("attendance_date", format(monthEnd, "yyyy-MM-dd"))
        .not("check_in_time", "is", null);

      if (attendanceError) throw attendanceError;

      // Aggregate by employee
      const employeeMap = new Map<string, PayrollData>();

      attendance?.forEach((record: any) => {
        const empId = record.employee_id;
        if (!employeeMap.has(empId)) {
          employeeMap.set(empId, {
            employee_id: empId,
            full_name: record.employees?.full_name || "Unknown",
            position: record.employees?.position || "N/A",
            base_salary: record.employees?.base_salary || 0,
            regular_hours: 0,
            overtime_hours: 0,
            total_break_minutes: 0,
            late_minutes: 0,
            days_worked: 0,
            allowances: record.employees?.allowances || [],
            deductions: record.employees?.deductions || [],
          });
        }

        const emp = employeeMap.get(empId)!;
        emp.regular_hours += record.regular_hours || 0;
        emp.overtime_hours += record.overtime_hours || 0;
        emp.total_break_minutes += record.total_break_minutes || 0;
        emp.late_minutes += record.late_minutes || 0;
        emp.days_worked += record.check_in_time ? 1 : 0;
      });

      return Array.from(employeeMap.values());
    },
  });

  const calculateSalary = (emp: PayrollData) => {
    const baseSalary = emp.base_salary;
    
    // Calculate hourly rate (assuming 8 hours/day, 22 working days/month)
    const hourlyRate = baseSalary / (22 * 8);
    
    // OT pay
    const otPay = emp.overtime_hours * hourlyRate * otRate;
    
    // Late penalty
    const latePenaltyAmount = (emp.late_minutes / 60) * hourlyRate * latePenalty;
    
    // Allowances
    const allowancesTotal = emp.allowances.reduce((sum: number, a: any) => sum + (a.amount || 0), 0);
    
    // Deductions
    const deductionsTotal = emp.deductions.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
    
    // Net salary
    const netSalary = baseSalary + otPay + allowancesTotal - deductionsTotal - latePenaltyAmount;

    return {
      baseSalary,
      hourlyRate,
      otPay,
      latePenaltyAmount,
      allowancesTotal,
      deductionsTotal,
      netSalary,
    };
  };

  const generatePayslip = (emp: PayrollData) => {
    const salary = calculateSalary(emp);
    
    const element = document.createElement("div");
    element.innerHTML = `
      <div style="padding: 40px; font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px;">
          <h1 style="color: #1a1a1a; margin: 0;">Tadmaids</h1>
          <h2 style="color: #666; margin: 10px 0 0 0; font-weight: normal;">Payslip</h2>
          <p style="color: #666; margin: 5px 0 0 0;">${format(new Date(selectedMonth), "MMMM yyyy")}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div>
            <p style="margin: 5px 0;"><strong>Employee:</strong> ${emp.full_name}</p>
            <p style="margin: 5px 0;"><strong>Position:</strong> ${emp.position}</p>
            <p style="margin: 5px 0;"><strong>Employee ID:</strong> ${emp.employee_id.slice(0, 8)}</p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Days Worked:</strong> ${emp.days_worked}</p>
            <p style="margin: 5px 0;"><strong>Regular Hours:</strong> ${emp.regular_hours.toFixed(2)}h</p>
            <p style="margin: 5px 0;"><strong>Overtime Hours:</strong> ${emp.overtime_hours.toFixed(2)}h</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 12px; text-align: left;">Description</th>
              <th style="padding: 12px; text-align: right;">Amount (AED)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px;">Base Salary</td>
              <td style="padding: 12px; text-align: right;">${salary.baseSalary.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px;">Overtime Pay (${emp.overtime_hours.toFixed(2)}h × ${otRate}x)</td>
              <td style="padding: 12px; text-align: right; color: #16a34a;">+${salary.otPay.toFixed(2)}</td>
            </tr>
            ${emp.allowances.map((a: any) => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px;">${a.name || 'Allowance'}</td>
                <td style="padding: 12px; text-align: right; color: #16a34a;">+${a.amount?.toFixed(2) || '0.00'}</td>
              </tr>
            `).join('')}
            ${emp.late_minutes > 0 ? `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px;">Late Penalty (${emp.late_minutes} min)</td>
                <td style="padding: 12px; text-align: right; color: #dc2626;">-${salary.latePenaltyAmount.toFixed(2)}</td>
              </tr>
            ` : ''}
            ${emp.deductions.map((d: any) => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px;">${d.name || 'Deduction'}</td>
                <td style="padding: 12px; text-align: right; color: #dc2626;">-${d.amount?.toFixed(2) || '0.00'}</td>
              </tr>
            `).join('')}
            <tr style="background: #f0f9ff; border-top: 2px solid #3b82f6;">
              <td style="padding: 15px; font-weight: bold; font-size: 18px;">Net Salary</td>
              <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; color: #1a1a1a;">
                ${salary.netSalary.toFixed(2)} AED
              </td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 40px; padding: 20px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e; font-size: 12px;">
            <strong>Note:</strong> This payslip is generated based on attendance records for ${format(new Date(selectedMonth), "MMMM yyyy")}. 
            Hourly rate calculated at ${salary.hourlyRate.toFixed(2)} AED/hour.
          </p>
        </div>

        <div style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          <p>Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
          <p>Tadmaids HR Management System</p>
        </div>
      </div>
    `;

    const opt = {
      margin: 10,
      filename: `payslip-${emp.full_name.replace(/\s+/g, "-")}-${selectedMonth}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
    };

    html2pdf().set(opt).from(element).save();
    toast.success(`Payslip generated for ${emp.full_name}`);
  };

  const totalPayroll = payrollData?.reduce((sum, emp) => sum + calculateSalary(emp).netSalary, 0) || 0;

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="month">Month:</Label>
              <Input
                id="month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPayroll.toFixed(2)} AED</div>
              <p className="text-xs text-muted-foreground mt-1">
                For {format(new Date(selectedMonth), "MMMM yyyy")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">OT Rate</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={otRate}
                  onChange={(e) => setOtRate(parseFloat(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">× base rate</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late Penalty</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={latePenalty}
                  onChange={(e) => setLatePenalty(parseFloat(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">AED/min</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Payroll Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-1/4 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Employee</th>
                      <th className="text-right p-3">Days</th>
                      <th className="text-right p-3">Regular Hours</th>
                      <th className="text-right p-3">OT Hours</th>
                      <th className="text-right p-3">Base Salary</th>
                      <th className="text-right p-3">OT Pay</th>
                      <th className="text-right p-3">Deductions</th>
                      <th className="text-right p-3 font-bold">Net Salary</th>
                      <th className="text-right p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollData?.map((emp) => {
                      const salary = calculateSalary(emp);
                      return (
                        <tr key={emp.employee_id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{emp.full_name}</p>
                              <p className="text-sm text-muted-foreground">{emp.position}</p>
                            </div>
                          </td>
                          <td className="text-right p-3">{emp.days_worked}</td>
                          <td className="text-right p-3">{emp.regular_hours.toFixed(1)}h</td>
                          <td className="text-right p-3 text-blue-600">{emp.overtime_hours.toFixed(1)}h</td>
                          <td className="text-right p-3">{salary.baseSalary.toFixed(0)}</td>
                          <td className="text-right p-3 text-green-600">+{salary.otPay.toFixed(0)}</td>
                          <td className="text-right p-3 text-red-600">
                            -{(salary.deductionsTotal + salary.latePenaltyAmount).toFixed(0)}
                          </td>
                          <td className="text-right p-3 font-bold">{salary.netSalary.toFixed(2)}</td>
                          <td className="text-right p-3">
                            <Button size="sm" variant="outline" onClick={() => generatePayslip(emp)}>
                              <FileText className="h-4 w-4 mr-1" />
                              Payslip
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
