import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { 
  Users, 
  UserPlus,
  Target,
  TrendingUp,
  Calendar,
  FileText,
  Briefcase,
  Phone,
  BarChart3
} from "lucide-react";
import { SalesKPIDashboard } from "@/components/kpi/SalesKPIDashboard";
import { ConversionMetrics } from "@/components/kpi/ConversionMetrics";

const SalesHub = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Lead Management",
      description: "View and manage your assigned leads",
      icon: Users,
      path: "/crm/leads",
      color: "text-blue-600"
    },
    {
      title: "Create New Lead",
      description: "Add a new lead to the system",
      icon: UserPlus,
      path: "/crm/leads", // Will open quick entry
      color: "text-green-600"
    },
    {
      title: "My Deals",
      description: "Track your deals and pipeline",
      icon: Briefcase,
      path: "/crm/deals",
      color: "text-purple-600"
    },
    {
      title: "Book a Worker",
      description: "Create bookings for clients",
      icon: Calendar,
      path: "/book-worker",
      color: "text-orange-600"
    },
    {
      title: "My Performance",
      description: "View your sales KPIs and targets",
      icon: Target,
      path: "/crm/dashboard",
      color: "text-indigo-600"
    },
    {
      title: "Client Submissions",
      description: "Review client applications",
      icon: FileText,
      path: "/admin/client-submissions",
      color: "text-teal-600"
    },
    {
      title: "Contact Clients",
      description: "Quick access to communication tools",
      icon: Phone,
      path: "/crm/leads",
      color: "text-pink-600"
    },
    {
      title: "Daily Sales Report",
      description: "View daily activity and closures",
      icon: BarChart3,
      path: "/crm/daily-sales-report",
      color: "text-amber-600"
    },
    {
      title: "Sales Reports Center",
      description: "Access all sales reports and analytics",
      icon: TrendingUp,
      path: "/crm/sales-reports",
      color: "text-emerald-600"
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Sales & CRM Hub</h1>
          <p className="text-muted-foreground">
            Manage leads, close deals, and track your performance
          </p>
        </div>

        {/* Conversion Metrics Dashboard */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Lead Conversion Metrics</h2>
          <ConversionMetrics />
        </div>

        {/* KPI Dashboard */}
        <div className="mb-8">
          <SalesKPIDashboard showTeamLeaderboard={false} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card 
                key={section.path}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(section.path)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className={`h-8 w-8 ${section.color}`} />
                    <div>
                      <CardTitle>{section.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default SalesHub;
