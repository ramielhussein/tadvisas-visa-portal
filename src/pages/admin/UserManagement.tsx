import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

interface Permissions {
  cv: {
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  refund: {
    create: boolean;
  };
  leads: {
    create: boolean;
    assign: boolean;
  };
  deals: {
    create: boolean;
    edit: boolean;
    delete: boolean;
    view_all: boolean;
  };
  finance: {
    view_dashboard: boolean;
    manage_invoices: boolean;
    manage_transactions: boolean;
  };
  suppliers: {
    create: boolean;
    edit: boolean;
    view_all: boolean;
  };
}

type UserRole = 'sales' | 'product' | 'finance' | 'super_admin' | 'custom';

export default function UserManagement() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useUserRole();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('custom');
  const [isDriver, setIsDriver] = useState(false);
  const [isWorkerP4, setIsWorkerP4] = useState(false);
  const [isSalesManager, setIsSalesManager] = useState(false);
  const [isFinance, setIsFinance] = useState(false);
  const [permissions, setPermissions] = useState<Permissions>({
    cv: { create: false, edit: false, delete: false },
    refund: { create: false },
    leads: { create: false, assign: false },
    deals: { create: false, edit: false, delete: false, view_all: false },
    finance: { view_dashboard: false, manage_invoices: false, manage_transactions: false },
    suppliers: { create: false, edit: false, view_all: false }
  });

  const rolePresets: Record<UserRole, Permissions> = {
    sales: {
      cv: { create: true, edit: true, delete: false },
      refund: { create: false },
      leads: { create: true, assign: true },
      deals: { create: true, edit: true, delete: false, view_all: true },
      finance: { view_dashboard: true, manage_invoices: false, manage_transactions: false },
      suppliers: { create: false, edit: false, view_all: true }
    },
    product: {
      cv: { create: true, edit: true, delete: true },
      refund: { create: true },
      leads: { create: true, assign: false },
      deals: { create: false, edit: false, delete: false, view_all: true },
      finance: { view_dashboard: true, manage_invoices: false, manage_transactions: false },
      suppliers: { create: true, edit: true, view_all: true }
    },
    finance: {
      cv: { create: false, edit: false, delete: false },
      refund: { create: true },
      leads: { create: false, assign: false },
      deals: { create: false, edit: true, delete: false, view_all: true },
      finance: { view_dashboard: true, manage_invoices: true, manage_transactions: true },
      suppliers: { create: true, edit: true, view_all: true }
    },
    super_admin: {
      cv: { create: true, edit: true, delete: true },
      refund: { create: true },
      leads: { create: true, assign: true },
      deals: { create: true, edit: true, delete: true, view_all: true },
      finance: { view_dashboard: true, manage_invoices: true, manage_transactions: true },
      suppliers: { create: true, edit: true, view_all: true }
    },
    custom: {
      cv: { create: false, edit: false, delete: false },
      refund: { create: false },
      leads: { create: false, assign: false },
      deals: { create: false, edit: false, delete: false, view_all: false },
      finance: { view_dashboard: false, manage_invoices: false, manage_transactions: false },
      suppliers: { create: false, edit: false, view_all: false }
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setPermissions(rolePresets[role]);
  };

  if (adminLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    navigate("/auth");
    return null;
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);

    try {
      // Create the user
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { 
          email, 
          password,
          fullName,
          permissions,
          isDriver,
          isWorkerP4,
          isSalesManager,
          isFinance
        }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `User ${email} created successfully`,
        });
        // Reset form
        setEmail("");
        setPassword("");
        setFullName("");
        setSelectedRole('custom');
        setIsDriver(false);
        setIsWorkerP4(false);
        setIsSalesManager(false);
        setIsFinance(false);
        setPermissions({
          cv: { create: false, edit: false, delete: false },
          refund: { create: false },
          leads: { create: false, assign: false },
          deals: { create: false, edit: false, delete: false, view_all: false },
          finance: { view_dashboard: false, manage_invoices: false, manage_transactions: false },
          suppliers: { create: false, edit: false, view_all: false }
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              User Management
            </CardTitle>
            <CardDescription>
              Create user accounts with role-based permissions or customize access to modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={creating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={creating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={creating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">User Role</Label>
                  <Select value={selectedRole} onValueChange={(value) => handleRoleChange(value as UserRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales Team</SelectItem>
                      <SelectItem value="product">Product Team</SelectItem>
                      <SelectItem value="finance">Finance Team</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="custom">Custom Permissions</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select a role preset or customize permissions below
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-base font-semibold">Special Roles</Label>
                  <div className="space-y-2 ml-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="is-sales-manager"
                        checked={isSalesManager}
                        onCheckedChange={(checked) => setIsSalesManager(checked as boolean)}
                        disabled={creating}
                      />
                      <label htmlFor="is-sales-manager" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Sales Manager (Can Approve Deals)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="is-finance-role"
                        checked={isFinance}
                        onCheckedChange={(checked) => setIsFinance(checked as boolean)}
                        disabled={creating}
                      />
                      <label htmlFor="is-finance-role" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Finance (Can Create Contracts)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="is-driver"
                        checked={isDriver}
                        onCheckedChange={(checked) => setIsDriver(checked as boolean)}
                        disabled={creating}
                      />
                      <label htmlFor="is-driver" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Driver (TadGo Access)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="is-worker-p4"
                        checked={isWorkerP4}
                        onCheckedChange={(checked) => setIsWorkerP4(checked as boolean)}
                        disabled={creating}
                      />
                      <label htmlFor="is-worker-p4" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Worker P4 (Monthly Role)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-lg">Permissions</h3>
                
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">CV Management</Label>
                    <div className="space-y-2 ml-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="cv-create"
                          checked={permissions.cv.create}
                          onCheckedChange={(checked) => 
                            setPermissions(prev => ({
                              ...prev,
                              cv: { ...prev.cv, create: checked as boolean }
                            }))
                          }
                          disabled={creating}
                        />
                        <label htmlFor="cv-create" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Create CV
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="cv-edit"
                          checked={permissions.cv.edit}
                          onCheckedChange={(checked) => 
                            setPermissions(prev => ({
                              ...prev,
                              cv: { ...prev.cv, edit: checked as boolean }
                            }))
                          }
                          disabled={creating}
                        />
                        <label htmlFor="cv-edit" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Edit CV
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="cv-delete"
                          checked={permissions.cv.delete}
                          onCheckedChange={(checked) => 
                            setPermissions(prev => ({
                              ...prev,
                              cv: { ...prev.cv, delete: checked as boolean }
                            }))
                          }
                          disabled={creating}
                        />
                        <label htmlFor="cv-delete" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Delete CV
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Refunds</Label>
                    <div className="space-y-2 ml-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="refund-create"
                          checked={permissions.refund.create}
                          onCheckedChange={(checked) => 
                            setPermissions(prev => ({
                              ...prev,
                              refund: { create: checked as boolean }
                            }))
                          }
                          disabled={creating}
                        />
                        <label htmlFor="refund-create" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Create Refund
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Lead Management</Label>
                    <div className="space-y-2 ml-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="leads-create"
                          checked={permissions.leads.create}
                          onCheckedChange={(checked) => 
                            setPermissions(prev => ({
                              ...prev,
                              leads: { ...prev.leads, create: checked as boolean }
                            }))
                          }
                          disabled={creating}
                        />
                        <label htmlFor="leads-create" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Create Leads
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="leads-assign"
                          checked={permissions.leads.assign}
                          onCheckedChange={(checked) => 
                            setPermissions(prev => ({
                              ...prev,
                              leads: { ...prev.leads, assign: checked as boolean }
                            }))
                          }
                          disabled={creating}
                        />
                        <label htmlFor="leads-assign" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Assign Leads
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Deals & Sales</Label>
                    <div className="space-y-2 ml-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="deals-create"
                          checked={permissions.deals.create}
                          onCheckedChange={(checked) => 
                            setPermissions(prev => ({
                              ...prev,
                              deals: { ...prev.deals, create: checked as boolean }
                            }))
                          }
                          disabled={creating}
                        />
                        <label htmlFor="deals-create" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Create Deals
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="deals-edit"
                          checked={permissions.deals.edit}
                          onCheckedChange={(checked) => 
                            setPermissions(prev => ({
                              ...prev,
                              deals: { ...prev.deals, edit: checked as boolean }
                            }))
                          }
                          disabled={creating}
                        />
                        <label htmlFor="deals-edit" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Edit Deals
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="deals-delete"
                          checked={permissions.deals.delete}
                          onCheckedChange={(checked) => 
                            setPermissions(prev => ({
                              ...prev,
                              deals: { ...prev.deals, delete: checked as boolean }
                            }))
                          }
                          disabled={creating}
                        />
                        <label htmlFor="deals-delete" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Delete Deals
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="deals-view-all"
                          checked={permissions.deals.view_all}
                          onCheckedChange={(checked) => 
                            setPermissions(prev => ({
                              ...prev,
                              deals: { ...prev.deals, view_all: checked as boolean }
                            }))
                          }
                          disabled={creating}
                        />
                        <label htmlFor="deals-view-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          View All Deals
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Finance</Label>
                    <div className="space-y-2 ml-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="finance-dashboard"
                          checked={permissions.finance.view_dashboard}
                          onCheckedChange={(checked) => 
                            setPermissions(prev => ({
                              ...prev,
                              finance: { ...prev.finance, view_dashboard: checked as boolean }
                            }))
                          }
                          disabled={creating}
                        />
                        <label htmlFor="finance-dashboard" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          View Financial Dashboard
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="finance-invoices"
                          checked={permissions.finance.manage_invoices}
                          onCheckedChange={(checked) => 
                            setPermissions(prev => ({
                              ...prev,
                              finance: { ...prev.finance, manage_invoices: checked as boolean }
                            }))
                          }
                          disabled={creating}
                        />
                        <label htmlFor="finance-invoices" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Manage Invoices
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="finance-transactions"
                          checked={permissions.finance.manage_transactions}
                          onCheckedChange={(checked) => 
                            setPermissions(prev => ({
                              ...prev,
                              finance: { ...prev.finance, manage_transactions: checked as boolean }
                            }))
                          }
                          disabled={creating}
                        />
                        <label htmlFor="finance-transactions" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Manage Transactions
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Suppliers</Label>
                    <div className="space-y-2 ml-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="suppliers-create"
                          checked={permissions.suppliers.create}
                          onCheckedChange={(checked) => 
                            setPermissions(prev => ({
                              ...prev,
                              suppliers: { ...prev.suppliers, create: checked as boolean }
                            }))
                          }
                          disabled={creating}
                        />
                        <label htmlFor="suppliers-create" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Create Suppliers
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="suppliers-edit"
                          checked={permissions.suppliers.edit}
                          onCheckedChange={(checked) => 
                            setPermissions(prev => ({
                              ...prev,
                              suppliers: { ...prev.suppliers, edit: checked as boolean }
                            }))
                          }
                          disabled={creating}
                        />
                        <label htmlFor="suppliers-edit" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Edit Suppliers
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="suppliers-view-all"
                          checked={permissions.suppliers.view_all}
                          onCheckedChange={(checked) => 
                            setPermissions(prev => ({
                              ...prev,
                              suppliers: { ...prev.suppliers, view_all: checked as boolean }
                            }))
                          }
                          disabled={creating}
                        />
                        <label htmlFor="suppliers-view-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          View All Suppliers
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
