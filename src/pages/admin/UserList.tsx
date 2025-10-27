import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Users, Save, UserPlus } from "lucide-react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  permissions: Permissions;
}

export default function UserList() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editedUser, setEditedUser] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, permissions')
      .order('email');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } else {
      setUsers((data || []) as unknown as UserProfile[]);
    }
    setLoading(false);
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setEditedUser({ ...user });
  };

  const handleSaveUser = async () => {
    if (!editedUser) return;

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editedUser.full_name,
        permissions: editedUser.permissions as any,
      })
      .eq('id', editedUser.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      loadUsers();
      setSelectedUser(null);
      setEditedUser(null);
    }
    setSaving(false);
  };

  if (adminLoading || loading) {
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

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto py-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  User List
                </CardTitle>
                <CardDescription>
                  View and manage existing users and their permissions
                </CardDescription>
              </div>
              <Button onClick={() => navigate('/admin/user-management')}>
                <UserPlus className="mr-2 h-4 w-4" />
                Create New User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{user.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.full_name || <span className="italic">No name set</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Permissions: 
                      {user.permissions?.cv?.create && " CV-Create"}
                      {user.permissions?.cv?.edit && " CV-Edit"}
                      {user.permissions?.cv?.delete && " CV-Delete"}
                      {user.permissions?.refund?.create && " Refund"}
                      {user.permissions?.leads?.create && " Leads-Create"}
                      {user.permissions?.leads?.assign && " Leads-Assign"}
                    </div>
                  </div>
                  <Button onClick={() => handleEditUser(user)} variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={selectedUser !== null} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>

          {editedUser && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={editedUser.email} disabled />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-fullName">Full Name</Label>
                <Input
                  id="edit-fullName"
                  value={editedUser.full_name || ""}
                  onChange={(e) => setEditedUser({ ...editedUser, full_name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-3 pt-3 border-t">
                <h3 className="font-semibold text-base">Permissions</h3>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">CV Management</Label>
                    <div className="space-y-1.5 ml-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-cv-create"
                          checked={editedUser.permissions.cv.create}
                          onCheckedChange={(checked) => 
                            setEditedUser({
                              ...editedUser,
                              permissions: {
                                ...editedUser.permissions,
                                cv: { ...editedUser.permissions.cv, create: checked as boolean }
                              }
                            })
                          }
                        />
                        <label htmlFor="edit-cv-create" className="text-sm font-medium">
                          Create CV
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-cv-edit"
                          checked={editedUser.permissions.cv.edit}
                          onCheckedChange={(checked) => 
                            setEditedUser({
                              ...editedUser,
                              permissions: {
                                ...editedUser.permissions,
                                cv: { ...editedUser.permissions.cv, edit: checked as boolean }
                              }
                            })
                          }
                        />
                        <label htmlFor="edit-cv-edit" className="text-sm font-medium">
                          Edit CV
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-cv-delete"
                          checked={editedUser.permissions.cv.delete}
                          onCheckedChange={(checked) => 
                            setEditedUser({
                              ...editedUser,
                              permissions: {
                                ...editedUser.permissions,
                                cv: { ...editedUser.permissions.cv, delete: checked as boolean }
                              }
                            })
                          }
                        />
                        <label htmlFor="edit-cv-delete" className="text-sm font-medium">
                          Delete CV
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Refunds</Label>
                    <div className="space-y-1.5 ml-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-refund-create"
                          checked={editedUser.permissions.refund.create}
                          onCheckedChange={(checked) => 
                            setEditedUser({
                              ...editedUser,
                              permissions: {
                                ...editedUser.permissions,
                                refund: { create: checked as boolean }
                              }
                            })
                          }
                        />
                        <label htmlFor="edit-refund-create" className="text-sm font-medium">
                          Create Refund
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Lead Management</Label>
                    <div className="space-y-1.5 ml-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-leads-create"
                          checked={editedUser.permissions.leads.create}
                          onCheckedChange={(checked) => 
                            setEditedUser({
                              ...editedUser,
                              permissions: {
                                ...editedUser.permissions,
                                leads: { ...editedUser.permissions.leads, create: checked as boolean }
                              }
                            })
                          }
                        />
                        <label htmlFor="edit-leads-create" className="text-sm font-medium">
                          Create Leads
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-leads-assign"
                          checked={editedUser.permissions.leads.assign}
                          onCheckedChange={(checked) => 
                            setEditedUser({
                              ...editedUser,
                              permissions: {
                                ...editedUser.permissions,
                                leads: { ...editedUser.permissions.leads, assign: checked as boolean }
                              }
                            })
                          }
                        />
                        <label htmlFor="edit-leads-assign" className="text-sm font-medium">
                          Assign Leads
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <Button onClick={handleSaveUser} disabled={saving} className="flex-1">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedUser(null)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
