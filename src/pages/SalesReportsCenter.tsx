import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { 
  Target, 
  TrendingUp, 
  Users, 
  BarChart3,
  FileBarChart,
  Award,
  ClipboardCheck,
  Mail
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

const SalesReportsCenter = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();

  const reports = [
    {
      title: "Sales Targets & Leaderboard",
      description: "View all sales team members, set targets, and see team rankings with tier achievements",
      icon: Target,
      path: "/crm/sales-targets",
      color: "text-indigo-600",
      adminOnly: true
    },
    {
      title: "Salesperson Deals Report",
      description: "View deals by salesperson with date filtering and download reports as PDF",
      icon: FileBarChart,
      path: "/crm/salesperson-deals-report",
      color: "text-green-600",
      adminOnly: false
    },
    {
      title: "Daily Sales Report",
      description: "Track daily activity for each salesperson - leads picked up, updated, and closed",
      icon: BarChart3,
      path: "/crm/daily-sales-report",
      color: "text-amber-600",
      adminOnly: false
    },
    {
      title: "Lead Attendance Report",
      description: "View all leads added today, updated today, and breakdown by staff member activity",
      icon: ClipboardCheck,
      path: "/crm/lead-attendance-report",
      color: "text-rose-600",
      adminOnly: false
    },
    {
      title: "My Performance Dashboard",
      description: "View your personal KPIs: revenue, deals closed, conversion rate, and activity metrics",
      icon: TrendingUp,
      path: "/crm/dashboard",
      color: "text-emerald-600",
      adminOnly: false
    },
    {
      title: "Team Performance Overview",
      description: "Compare all team members with revenue, deals count, and achievement tiers",
      icon: Award,
      path: "/crm/sales-targets",
      color: "text-purple-600",
      adminOnly: true
    },
    {
      title: "Lead Analytics",
      description: "Analyze lead funnel, conversion rates, and win rates by source",
      icon: Users,
      path: "/crm/dashboard",
      color: "text-blue-600",
      adminOnly: false
    },
    {
      title: "Contracts Management",
      description: "View and manage all contracts, track pipeline and revenue",
      icon: FileBarChart,
      path: "/crm/contracts",
      color: "text-teal-600",
      adminOnly: false
    },
    {
      title: "Personal Sales Reports",
      description: "Generate and email daily activity reports for all sales team members",
      icon: Mail,
      path: "/admin/send-personal-reports",
      color: "text-cyan-600",
      adminOnly: true
    }
  ];

  const visibleReports = reports.filter(report => !report.adminOnly || isAdmin);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Sales Reports Center</h1>
          <p className="text-muted-foreground">
            Access all sales performance reports and analytics in one place
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleReports.map((report) => {
            const Icon = report.icon;
            return (
              <Card 
                key={report.path + report.title}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(report.path)}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-background border`}>
                      <Icon className={`h-6 w-6 ${report.color}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{report.title}</CardTitle>
                      <CardDescription>
                        {report.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats Summary */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/crm/leads")}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold mb-1">Lead Management</h3>
                  <p className="text-sm text-muted-foreground">Manage your leads</p>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/crm/contracts")}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <FileBarChart className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h3 className="font-semibold mb-1">Contracts Pipeline</h3>
                  <p className="text-sm text-muted-foreground">Track your contracts</p>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/crm/contracts")}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <FileBarChart className="h-8 w-8 mx-auto mb-2 text-teal-600" />
                  <h3 className="font-semibold mb-1">Contracts</h3>
                  <p className="text-sm text-muted-foreground">Manage contracts</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SalesReportsCenter;
