import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { 
  Users, 
  DollarSign, 
  Package, 
  UserCog,
  Settings,
  BarChart3,
  FileText,
  Shield
} from "lucide-react";

const AdminHub = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "CRM & Sales",
      description: "Manage leads, deals, and sales operations",
      icon: Users,
      path: "/crm/leads",
      color: "text-blue-600"
    },
    {
      title: "Finance & Accounting",
      description: "Financial dashboard, invoices, and payments",
      icon: DollarSign,
      path: "/financial-dashboard",
      color: "text-green-600"
    },
    {
      title: "Product & Operations",
      description: "Worker management, contracts, and logistics",
      icon: Package,
      path: "/product-dashboard",
      color: "text-purple-600"
    },
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: UserCog,
      path: "/admin/users",
      color: "text-orange-600"
    },
    {
      title: "Reports & Analytics",
      description: "View system reports and analytics",
      icon: BarChart3,
      path: "/audit-logs",
      color: "text-indigo-600"
    },
    {
      title: "System Settings",
      description: "Configure system-wide settings",
      icon: Settings,
      path: "/admin",
      color: "text-gray-600"
    },
    {
      title: "Client Submissions",
      description: "Review and manage client applications",
      icon: FileText,
      path: "/admin/client-submissions",
      color: "text-teal-600"
    },
    {
      title: "CV Wizard Management",
      description: "Manage CV wizard settings and reviews",
      icon: Shield,
      path: "/admin/cv-wizard-settings",
      color: "text-red-600"
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Control Center</h1>
          <p className="text-muted-foreground">
            Full system access - manage all aspects of the platform
          </p>
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

export default AdminHub;
