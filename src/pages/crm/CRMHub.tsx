import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Handshake, 
  Target,
  FileText,
  Settings,
  Package,
  TrendingUp,
  Database
} from "lucide-react";

const CRMHub = () => {
  const navigate = useNavigate();

  const modules = [
    {
      title: "Leads Management",
      description: "Track and manage all your leads",
      icon: Users,
      path: "/crm/leads",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Deals Management",
      description: "Manage deals and close opportunities",
      icon: Handshake,
      path: "/crm/deals",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Contracts",
      description: "Create and manage client contracts",
      icon: FileText,
      path: "/crm/contracts",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Sales Targets",
      description: "Set and track sales targets",
      icon: Target,
      path: "/crm/sales-targets",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Dashboard & KPIs",
      description: "View sales performance metrics",
      icon: TrendingUp,
      path: "/crm/dashboard",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      title: "Lead Sources",
      description: "Manage lead sources and channels",
      icon: Database,
      path: "/crm/lead-sources",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      title: "Inquiry Packages",
      description: "Configure inquiry package options",
      icon: Package,
      path: "/crm/inquiry-packages",
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      title: "Sales Packages",
      description: "Manage sales package offerings",
      icon: Settings,
      path: "/crm/sales-packages",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">CRM & Sales Center</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships, leads, deals, and sales operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((module) => (
            <Card
              key={module.path}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
              onClick={() => navigate(module.path)}
            >
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-2`}>
                  <module.icon className={`h-6 w-6 ${module.color}`} />
                </div>
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <CardDescription className="text-sm">
                  {module.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default CRMHub;
