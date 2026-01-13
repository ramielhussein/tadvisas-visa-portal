import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  DollarSign,
  CreditCard,
  Receipt,
  Building2,
  Wallet,
  ArrowLeftRight,
  Package,
  Truck,
  RefreshCw,
  ClipboardList,
  Globe,
  ShoppingCart,
  UserCheck,
  Calendar,
  BarChart3,
  TrendingUp,
  Settings,
  Shield,
  Database,
  Home,
  Phone,
  HelpCircle,
  PieChart,
  Target,
  UserPlus,
  Images,
  ChevronDown,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface NavSection {
  title: string;
  icon: React.ElementType;
  items: {
    title: string;
    path: string;
    icon: React.ElementType;
  }[];
  roles?: string[];
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { role, isAdmin, isSuperAdmin, isSales, isFinance, isProduct, isClient, user } = useUserRole();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");
  
  // Check if any item in a section is active
  const isSectionActive = (items: { path: string }[]) => 
    items.some(item => isActive(item.path));

  // Define navigation sections based on roles
  const getNavSections = (): NavSection[] => {
    const sections: NavSection[] = [];

    // Public/Client sections
    if (!user || isClient) {
      sections.push({
        title: "Navigation",
        icon: Home,
        items: [
          { title: "Home", path: "/", icon: Home },
          { title: "Hire a Maid", path: "/hire-a-maid", icon: UserPlus },
          { title: "Get a Visa", path: "/get-a-visa", icon: FileText },
          { title: "Monthly Packages", path: "/monthly-packages", icon: Package },
          { title: "FAQ", path: "/faq", icon: HelpCircle },
          { title: "Contact", path: "/contact", icon: Phone },
        ],
      });
      
      if (isClient) {
        sections.push({
          title: "My Account",
          icon: Users,
          items: [
            { title: "My Applications", path: "/admin/client-submissions", icon: FileText },
            { title: "My CVs", path: "/my-cvs", icon: Images },
          ],
        });
      }
      return sections;
    }

    // Dashboard for authenticated users
    sections.push({
      title: "Overview",
      icon: LayoutDashboard,
      items: [
        { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      ],
    });

    // CRM & Sales section
    if (isSales || isAdmin || isSuperAdmin) {
      sections.push({
        title: "CRM & Sales",
        icon: Users,
        items: [
          { title: "Lead Management", path: "/crm", icon: Users },
          { title: "Contracts", path: "/crm/contracts", icon: Briefcase },
          { title: "Book Worker", path: "/book-worker", icon: Calendar },
          { title: "Client Submissions", path: "/admin/client-submissions", icon: FileText },
          { title: "Daily Sales Report", path: "/crm/daily-sales-report", icon: BarChart3 },
          { title: "Sales Reports", path: "/crm/sales-reports", icon: TrendingUp },
        ],
      });
    }

    // Finance section
    if (isFinance || isAdmin || isSuperAdmin) {
      sections.push({
        title: "Finance",
        icon: DollarSign,
        items: [
          { title: "Dashboard", path: "/finance/dashboard", icon: PieChart },
          { title: "Contract Revenue", path: "/finance/contract-revenue", icon: TrendingUp },
          { title: "Payments", path: "/finance/payments", icon: CreditCard },
          { title: "Client Statements", path: "/finance/client-statement", icon: FileText },
          { title: "Expenses", path: "/finance/expenses", icon: Receipt },
          { title: "Bank Accounts", path: "/finance/bank-accounts", icon: Building2 },
          { title: "Bank Transfers", path: "/finance/bank-transfers", icon: ArrowLeftRight },
          { title: "Owner Equity", path: "/finance/owner-equity", icon: Wallet },
          { title: "Refunds", path: "/finance/refunds-approval", icon: ArrowLeftRight },
        ],
      });
    }

    // Product/Workers section
    if (isProduct || isAdmin || isSuperAdmin) {
      sections.push({
        title: "Product & Workers",
        icon: Package,
        items: [
          { title: "Worker Album", path: "/my-cvs", icon: Images },
          { title: "Create Worker CV", path: "/cvwizard", icon: FileText },
          { title: "Purchase Orders", path: "/product/purchase-orders", icon: ShoppingCart },
          { title: "Receipt Orders", path: "/product/receipt-orders", icon: Package },
          { title: "Delivery Orders", path: "/product/delivery-orders", icon: Truck },
          { title: "Worker Transfers", path: "/product/worker-transfers", icon: RefreshCw },
          { title: "Worker Returns", path: "/product/worker-returns", icon: ClipboardList },
          { title: "Daily Headcount", path: "/product/daily-headcount", icon: UserCheck },
          { title: "Nationality Workflows", path: "/product/nationality-workflows", icon: Globe },
        ],
      });
    }

    // HR section (admin only)
    if (isAdmin || isSuperAdmin) {
      sections.push({
        title: "HR",
        icon: UserCheck,
        items: [
          { title: "Dashboard", path: "/hr/dashboard", icon: LayoutDashboard },
          { title: "Attendance", path: "/hr/attendance", icon: Calendar },
          { title: "Payroll", path: "/hr/payroll", icon: DollarSign },
        ],
      });
    }

    // Admin section
    if (isAdmin || isSuperAdmin) {
      sections.push({
        title: "Administration",
        icon: Settings,
        items: [
          { title: "Admin Panel", path: "/admin", icon: Shield },
          { title: "User Management", path: "/admin/users", icon: Users },
          { title: "CV Settings", path: "/admin/cvwizard-settings", icon: Settings },
          { title: "Lead Sources", path: "/crm/lead-sources", icon: Target },
          { title: "Audit Logs", path: "/admin/audit-logs", icon: FileText },
          { title: "Data Backup", path: "/admin/data-backup", icon: Database },
        ],
      });
    }

    return sections;
  };

  const navSections = getNavSections();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/4e5c7620-b6a4-438c-a61b-eaa4f96ea0c2.png" 
            alt="TADMAIDS" 
            className="h-8 w-auto"
          />
          {!collapsed && (
            <span className="font-semibold text-lg">TADMAIDS</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {navSections.map((section) => {
          const sectionActive = isSectionActive(section.items);
          const SectionIcon = section.icon;

          return (
            <Collapsible
              key={section.title}
              defaultOpen={sectionActive}
              className="group/collapsible"
            >
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent rounded-md px-2 py-1.5 flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <SectionIcon className="h-4 w-4" />
                      {!collapsed && <span>{section.title}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    )}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item) => {
                        const ItemIcon = item.icon;
                        const active = isActive(item.path);
                        
                        return (
                          <SidebarMenuItem key={item.path}>
                            <SidebarMenuButton
                              asChild
                              isActive={active}
                              tooltip={collapsed ? item.title : undefined}
                            >
                              <NavLink
                                to={item.path}
                                className="flex items-center gap-2"
                                activeClassName=""
                              >
                                <ItemIcon className="h-4 w-4" />
                                {!collapsed && <span>{item.title}</span>}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        {!collapsed && user && (
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground truncate">{user.email}</p>
            <p className="capitalize">{role || 'User'}</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
