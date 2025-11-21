import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface NationalityData {
  nationality_code: string;
  staff_count: number;
  worker_count: number;
  total_count: number;
  percentage: number;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF6B9D', '#8DD1E1', '#D084D0'
];

export default function NationalityDashboard() {
  const [loading, setLoading] = useState(true);
  const [nationalityData, setNationalityData] = useState<NationalityData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadNationalityData();
  }, []);

  const loadNationalityData = async () => {
    try {
      setLoading(true);

      // Get staff nationalities
      const { data: staffData, error: staffError } = await supabase
        .from('employees')
        .select('nationality_code')
        .eq('employment_status', 'Active');

      if (staffError) throw staffError;

      // Get worker nationalities (excluding staff workers)
      const { data: workerData, error: workerError } = await supabase
        .from('workers')
        .select('nationality_code')
        .eq('staff', false)
        .in('status', ['Available', 'Ready for Market', 'With Client']);

      if (workerError) throw workerError;

      // Combine and count by nationality
      const nationalityCounts = new Map<string, { staff: number; workers: number }>();

      staffData?.forEach(item => {
        if (item.nationality_code) {
          const current = nationalityCounts.get(item.nationality_code) || { staff: 0, workers: 0 };
          current.staff += 1;
          nationalityCounts.set(item.nationality_code, current);
        }
      });

      workerData?.forEach(item => {
        if (item.nationality_code) {
          const current = nationalityCounts.get(item.nationality_code) || { staff: 0, workers: 0 };
          current.workers += 1;
          nationalityCounts.set(item.nationality_code, current);
        }
      });

      // Calculate totals and percentages
      const total = (staffData?.length || 0) + (workerData?.length || 0);
      setTotalCount(total);

      const nationalityBreakdown: NationalityData[] = Array.from(nationalityCounts.entries())
        .map(([nationality_code, counts]) => {
          const totalCount = counts.staff + counts.workers;
          return {
            nationality_code,
            staff_count: counts.staff,
            worker_count: counts.workers,
            total_count: totalCount,
            percentage: total > 0 ? (totalCount / total) * 100 : 0,
          };
        })
        .sort((a, b) => b.total_count - a.total_count);

      setNationalityData(nationalityBreakdown);
    } catch (error: any) {
      console.error('Error loading nationality data:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getNationalityName = (code: string) => {
    const nationalities: Record<string, string> = {
      'PH': 'Philippines',
      'ID': 'Indonesia',
      'ET': 'Ethiopia',
      'AF': 'Afghanistan',
      'MY': 'Myanmar',
      'IN': 'India',
      'PK': 'Pakistan',
      'BD': 'Bangladesh',
      'NP': 'Nepal',
      'LK': 'Sri Lanka',
      'AE': 'UAE',
    };
    return nationalities[code] || code;
  };

  const chartData = nationalityData.map(item => ({
    name: getNationalityName(item.nationality_code),
    value: item.total_count,
    percentage: item.percentage,
  }));

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Nationality Distribution</h1>
            <p className="text-muted-foreground">
              Breakdown of staff and workers by nationality
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total People
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Staff + Workers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Nationalities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{nationalityData.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Different countries represented
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Largest Group</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {nationalityData[0]?.percentage.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getNationalityName(nationalityData[0]?.nationality_code || '')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution Chart</CardTitle>
            <CardDescription>Visual representation of nationality breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any, props: any) => [
                    `${value} people (${props.payload.percentage.toFixed(1)}%)`,
                    props.payload.name
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Breakdown</CardTitle>
            <CardDescription>Staff and worker counts by nationality</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted">
                  <tr>
                    <th className="px-6 py-3">Nationality</th>
                    <th className="px-6 py-3 text-right">Staff</th>
                    <th className="px-6 py-3 text-right">Workers</th>
                    <th className="px-6 py-3 text-right">Total</th>
                    <th className="px-6 py-3 text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {nationalityData.map((item) => (
                    <tr key={item.nationality_code} className="border-b">
                      <td className="px-6 py-4 font-medium">
                        {getNationalityName(item.nationality_code)}
                      </td>
                      <td className="px-6 py-4 text-right">{item.staff_count}</td>
                      <td className="px-6 py-4 text-right">{item.worker_count}</td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {item.total_count}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-primary">
                        {item.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="font-bold bg-muted">
                  <tr>
                    <td className="px-6 py-4">TOTAL</td>
                    <td className="px-6 py-4 text-right">
                      {nationalityData.reduce((sum, item) => sum + item.staff_count, 0)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {nationalityData.reduce((sum, item) => sum + item.worker_count, 0)}
                    </td>
                    <td className="px-6 py-4 text-right">{totalCount}</td>
                    <td className="px-6 py-4 text-right">100.0%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
