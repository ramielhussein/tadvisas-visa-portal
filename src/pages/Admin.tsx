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
  Package,
  Download,
  Database,
  Upload,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);

  const handleTrelloImport = async () => {
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-trello-leads", {
        body: { boardId: "Q0g7eEjZ" },
      });

      if (error) throw error;

      toast({
        title: "Import Complete",
        description: `${data.imported} leads imported, ${data.skipped} skipped (already exist)`,
      });
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const sections = [
    {
      title: "Workforce Operations",
      description: "Domestic workers & admin staff management",
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      items: [
        { title: "HR Dashboard", path: "/hr/dashboard", icon: Users, description: "Admin staff headcount & analytics" },
        { title: "Create Domestic Worker CV", path: "/cvwizard", icon: FileText, description: "Add new domestic worker profiles" },
        { title: "Domestic Worker Album", path: "/wizardalbum", icon: Images, description: "Browse available domestic workers" },
        { title: "CV Review & Approval", path: "/admin/cvwizard-review", icon: ListChecks, description: "Review submitted CVs" },
        { title: "Product Dashboard", path: "/product/dashboard", icon: Package, description: "Operations overview" },
        { title: "Purchase Orders", path: "/product/purchase-orders", icon: FileText, description: "Domestic worker procurement POs" },
        { title: "Daily Headcount", path: "/product/daily-headcount", icon: Users, description: "Workforce count tracking" },
        { title: "Domestic Worker Returns", path: "/product/worker-returns", icon: Package, description: "Process returned domestic workers" },
        { title: "Domestic Worker Transfers", path: "/product/worker-transfers", icon: Package, description: "Track worker movements" },
      ],
    },
    {
      title: "CRM & Sales",
      description: "Lead management and sales pipeline",
      icon: BarChart3,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      items: [
        { title: "CRM Dashboard", path: "/crm/dashboard", icon: BarChart3, description: "Overview and analytics" },
        { title: "Lead Management", path: "/crm/leads", icon: Shield, description: "View and manage leads" },
        { title: "Import from Trello", action: handleTrelloImport, icon: Download, description: "Import leads from Trello board", loading: importing },
        { title: "Lead Sources", path: "/crm/lead-sources", icon: Settings, description: "Manage lead sources" },
        { title: "Inquiry Packages", path: "/crm/inquiry-packages", icon: Package, description: "Lead service interests" },
        { title: "Sales Packages", path: "/crm/sales-packages", icon: Package, description: "Products you sell" },
        { title: "Sales Reports Center", path: "/crm/sales-reports", icon: BarChart3, description: "All sales reports & analytics" },
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
        { title: "Finance Hub", path: "/hub/finance", icon: Coins, description: "Central finance dashboard" },
        { title: "Financial Dashboard", path: "/financial", icon: Coins, description: "Revenue and accounts receivable" },
        { title: "Contract Revenue & A/R", path: "/finance/contract-revenue", icon: FileText, description: "Track 2-year contracts and recurring revenue" },
        { title: "Import Contracts (Excel)", path: "/admin/import-contracts", icon: Upload, description: "Import workers and contracts from Excel" },
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
        { title: "My CVs", path: "/my-cvs", icon: FileText, description: "View your submitted CVs" },
        { title: "CV Wizard Settings", path: "/admin/cvwizard-settings", icon: Settings, description: "Configure CV wizard" },
        { title: "Data Backup & Export", path: "/admin/data-backup", icon: Database, description: "Download database backups" },
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
                    {section.items.map((item, idx) => (
                      <Button
                        key={item.path || idx}
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-start gap-2 hover:bg-accent hover:shadow-md transition-all group"
                        onClick={() => item.action ? item.action() : navigate(item.path)}
                        disabled={item.loading}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <item.icon className={`h-5 w-5 ${section.color}`} />
                          <span className="font-semibold text-left flex-1">{item.title}</span>
                          {item.loading ? (
                            <span className="text-xs">Loading...</span>
                          ) : !item.action && (
                            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
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
