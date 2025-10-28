import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Users,
  FileText,
  DollarSign,
  Briefcase,
  Building2,
  Shield,
  Settings,
  Images,
  MapPin,
  FileSpreadsheet,
  Coins,
  Plus,
  ArrowRight,
  UserPlus,
  ListChecks,
} from "lucide-react";

export default function Admin() {
  const navigate = useNavigate();

  const sections = [
    {
      title: "CRM & Sales",
      description: "Lead management and sales pipeline",
      icon: BarChart3,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      items: [
        { title: "CRM Dashboard", path: "/crm/dashboard", icon: BarChart3, description: "Overview and analytics" },
        { title: "Lead Management", path: "/crm/leads", icon: Shield, description: "View and manage leads" },
        { title: "Deals & Sales", path: "/deals", icon: Briefcase, description: "Manage deals pipeline" },
        { title: "Create Deal", path: "/deals/create", icon: Plus, description: "Add new deal" },
      ],
    },
    {
      title: "Finance & Accounting",
      description: "Financial management and reporting",
      icon: Coins,
      color: "text-green-600",
      bgColor: "bg-green-50",
      items: [
        { title: "Financial Dashboard", path: "/financial", icon: Coins, description: "Revenue and accounts receivable" },
        { title: "Expenses", path: "/expenses", icon: DollarSign, description: "Track business expenses" },
        { title: "Suppliers & A/P", path: "/suppliers", icon: Building2, description: "Supplier accounts payable" },
        { title: "Bank Accounts", path: "/bank-accounts", icon: DollarSign, description: "Manage bank accounts" },
        { title: "Bank Transfers", path: "/bank-transfers", icon: DollarSign, description: "Transfer between accounts" },
        { title: "Equity Accounts", path: "/equity-accounts", icon: Coins, description: "Owner equity accounts" },
        { title: "Owner Equity", path: "/owner-equity", icon: Coins, description: "Capital & drawings" },
        { title: "Contracts Management", path: "/contracts", icon: FileText, description: "View and manage contracts" },
        { title: "Create Contract", path: "/contracts/create", icon: Plus, description: "New client contract" },
      ],
    },
    {
      title: "Forms & Submissions",
      description: "Client applications and refunds",
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      items: [
        { title: "Client Submissions", path: "/client-submissions", icon: FileText, description: "Start Here form submissions" },
        { title: "Refund Calculator", path: "/refund", icon: DollarSign, description: "Calculate client refunds" },
        { title: "Finalized Refunds", path: "/refundslist", icon: FileSpreadsheet, description: "View all refunds" },
      ],
    },
    {
      title: "Worker Management",
      description: "CV wizard and worker database",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      items: [
        { title: "My CVs", path: "/my-cvs", icon: FileText, description: "View your submitted CVs" },
        { title: "CV Wizard Form", path: "/cvwizard", icon: FileText, description: "Create new worker CV" },
        { title: "CV Review & Approval", path: "/admin/cvwizard-review", icon: ListChecks, description: "Review submitted CVs" },
        { title: "Worker Album", path: "/wizardalbum", icon: Images, description: "Browse available workers" },
        { title: "CV Wizard Settings", path: "/admin/cvwizard-settings", icon: Settings, description: "Configure CV wizard" },
      ],
    },
    {
      title: "User Management",
      description: "Manage team and permissions",
      icon: UserPlus,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      items: [
        { title: "Create User", path: "/admin/user-management", icon: UserPlus, description: "Add new team member" },
        { title: "Manage Users", path: "/admin/user-list", icon: Users, description: "Edit users and permissions" },
      ],
    },
    {
      title: "System & Tools",
      description: "Configuration and utilities",
      icon: Settings,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      items: [
        { title: "Country Albums Hub", path: "/hub", icon: MapPin, description: "Country-specific albums" },
        { title: "Site Guide", path: "/siteguide", icon: FileText, description: "Documentation and guide" },
        { title: "Reset Admin Password", path: "/admin/reset-admin", icon: Shield, description: "Reset admin credentials" },
      ],
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              Admin Hub
            </h1>
            <p className="text-muted-foreground text-lg">
              Comprehensive management dashboard for all system features
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section) => (
              <Card key={section.title} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className={`${section.bgColor} border-b`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white shadow-sm ${section.color}`}>
                      <section.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {section.items.map((item) => (
                      <Button
                        key={item.path}
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-start gap-2 hover:bg-accent hover:shadow-md transition-all group"
                        onClick={() => navigate(item.path)}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <item.icon className={`h-5 w-5 ${section.color}`} />
                          <span className="font-semibold text-left flex-1">{item.title}</span>
                          <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-muted-foreground text-left w-full">
                          {item.description}
                        </p>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Stats or Info Box */}
          <Card className="mt-8 bg-gradient-primary text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Need Quick Access?</h3>
                  <p className="text-blue-100 text-sm">
                    Use <kbd className="px-2 py-1 bg-white/20 rounded text-xs">Ctrl+Shift+A</kbd> to open the floating admin menu from anywhere
                  </p>
                </div>
                <Shield className="h-12 w-12 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
