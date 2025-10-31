import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { 
  DollarSign,
  FileText,
  CreditCard,
  TrendingUp,
  Building2,
  Receipt,
  PieChart,
  Wallet
} from "lucide-react";

const FinanceHub = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Financial Dashboard",
      description: "Overview of financial metrics and KPIs",
      icon: PieChart,
      path: "/financial-dashboard",
      color: "text-blue-600"
    },
    {
      title: "Invoices",
      description: "Manage client invoices",
      icon: FileText,
      path: "/financial-dashboard", // Invoices tab
      color: "text-green-600"
    },
    {
      title: "Payments",
      description: "Record and track payments",
      icon: CreditCard,
      path: "/payments-list",
      color: "text-purple-600"
    },
    {
      title: "Expenses",
      description: "Manage business expenses",
      icon: Receipt,
      path: "/expenses",
      color: "text-orange-600"
    },
    {
      title: "Bank Accounts",
      description: "Manage bank accounts and balances",
      icon: Building2,
      path: "/bank-accounts",
      color: "text-indigo-600"
    },
    {
      title: "Owner Equity",
      description: "Track owner equity accounts",
      icon: Wallet,
      path: "/owner-equity",
      color: "text-teal-600"
    },
    {
      title: "Refunds & Credits",
      description: "Process refunds and credit notes",
      icon: DollarSign,
      path: "/refunds-approval",
      color: "text-red-600"
    },
    {
      title: "Financial Reports",
      description: "Generate and view financial reports",
      icon: TrendingUp,
      path: "/financial-dashboard",
      color: "text-amber-600"
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Finance & Accounting Hub</h1>
          <p className="text-muted-foreground">
            Manage finances, invoices, payments, and financial reporting
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

export default FinanceHub;
