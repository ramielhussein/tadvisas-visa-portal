import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { 
  FileText,
  Upload,
  Eye,
  MessageCircle,
  HelpCircle,
  User
} from "lucide-react";

const ClientPortal = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "My Applications",
      description: "View your submitted applications",
      icon: FileText,
      path: "/admin/client-submissions",
      color: "text-blue-600"
    },
    {
      title: "Submit New Application",
      description: "Apply for maid services",
      icon: Upload,
      path: "/hire-a-maid",
      color: "text-green-600"
    },
    {
      title: "My CVs",
      description: "View submitted worker CVs",
      icon: Eye,
      path: "/my-cvs",
      color: "text-purple-600"
    },
    {
      title: "Contact Us",
      description: "Get in touch with our team",
      icon: MessageCircle,
      path: "/contact",
      color: "text-orange-600"
    },
    {
      title: "FAQ & Help",
      description: "Frequently asked questions",
      icon: HelpCircle,
      path: "/faq",
      color: "text-indigo-600"
    },
    {
      title: "My Profile",
      description: "View and update your information",
      icon: User,
      path: "/dashboard",
      color: "text-teal-600"
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Client Portal</h1>
          <p className="text-muted-foreground">
            Access your applications and manage your services
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

export default ClientPortal;
