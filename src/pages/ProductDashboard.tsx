import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  Users, 
  ClipboardList, 
  RefreshCw,
  Globe
} from "lucide-react";

const ProductDashboard = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Purchase Orders",
      description: "Manage worker procurement and supplier POs",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      path: "/product/purchase-orders",
    },
    {
      title: "Receipt Orders",
      description: "Record worker arrivals at center or accommodation",
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50",
      path: "/product/receipt-orders",
    },
    {
      title: "Delivery Orders",
      description: "Track worker handover to clients",
      icon: Truck,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      path: "/product/delivery-orders",
    },
    {
      title: "Worker Transfers",
      description: "Log all worker movements between locations",
      icon: RefreshCw,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      path: "/product/worker-transfers",
    },
    {
      title: "Daily Headcount",
      description: "Monitor and verify daily worker counts",
      icon: Users,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      path: "/product/daily-headcount",
    },
    {
      title: "Worker Returns",
      description: "Process returned workers and redeployment checklist",
      icon: ClipboardList,
      color: "text-red-600",
      bgColor: "bg-red-50",
      path: "/product/worker-returns",
    },
    {
      title: "Nationality Workflows",
      description: "Track visa and processing by nationality",
      icon: Globe,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      path: "/product/nationality-workflows",
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Product Department</h1>
          <p className="text-muted-foreground">
            Comprehensive worker procurement, tracking, and movement management
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
                  <div className={`w-12 h-12 ${section.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${section.color}`} />
                  </div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default ProductDashboard;
