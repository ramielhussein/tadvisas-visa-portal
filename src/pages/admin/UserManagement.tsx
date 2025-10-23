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
import { Loader2, UserPlus } from "lucide-react";
import { useAdminCheck } from "@/hooks/useAdminCheck";

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
}

export default function UserManagement() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [creating, setCreating] = useState(false);
  const [permissions, setPermissions] = useState<Permissions>({
    cv: { create: false, edit: false, delete: false },
    refund: { create: false },
    leads: { create: false, assign: false }
  });

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
          permissions
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
        setPermissions({
          cv: { create: false, edit: false, delete: false },
          refund: { create: false },
          leads: { create: false, assign: false }
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
              Create user accounts with specific permissions for CV submission, refunds, and lead management
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
