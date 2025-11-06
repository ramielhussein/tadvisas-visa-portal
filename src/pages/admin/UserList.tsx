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
import { Loader2, Users, Save, UserPlus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    
    console.log('Attempting to update user:', editedUser.id);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editedUser.full_name,
        permissions: editedUser.permissions as any,
      })
      .eq('id', editedUser.id);

    if (error) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: `Failed to update user: ${error.message}`,
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

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to delete users",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: userToDelete.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      // Remove user from list without reloading
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
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
      <div className="container max-w-6xl mx-auto py-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  User List
                </CardTitle>
                <CardDescription className="text-xs">
                  Manage users and permissions
                </CardDescription>
              </div>
              <Button onClick={() => navigate('/admin/user-management')} size="sm">
                <UserPlus className="mr-1 h-3 w-3" />
                New User
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 border rounded hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs truncate">{user.email}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {user.full_name || <span className="italic">No name</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {user.permissions?.cv?.create && " CV-Create"}
                      {user.permissions?.cv?.edit && " CV-Edit"}
                      {user.permissions?.cv?.delete && " CV-Delete"}
                      {user.permissions?.refund?.create && " Refund"}
                      {user.permissions?.leads?.create && " Leads-Create"}
                      {user.permissions?.leads?.assign && " Leads-Assign"}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button onClick={() => handleEditUser(user)} variant="outline" size="sm" className="h-7 text-xs">
                      Edit
                    </Button>
                    <Button 
                      onClick={() => setUserToDelete(user)} 
                      variant="destructive" 
                      size="sm" 
                      className="h-7 text-xs"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={selectedUser !== null} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">Edit User</DialogTitle>
            <DialogDescription className="text-xs">
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>

          {editedUser && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input value={editedUser.email} disabled className="h-8 text-xs" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-fullName" className="text-xs">Full Name</Label>
                <Input
                  id="edit-fullName"
                  value={editedUser.full_name || ""}
                  onChange={(e) => setEditedUser({ ...editedUser, full_name: e.target.value })}
                  placeholder="Enter full name"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2 pt-2 border-t">
                <h3 className="font-semibold text-sm">Permissions</h3>
                
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">CV Management</Label>
                    <div className="space-y-1 ml-2">
                      <div className="flex items-center space-x-1.5">
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
                          className="h-3 w-3"
                        />
                        <label htmlFor="edit-cv-create" className="text-xs">
                          Create CV
                        </label>
                      </div>
                      <div className="flex items-center space-x-1.5">
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
                          className="h-3 w-3"
                        />
                        <label htmlFor="edit-cv-edit" className="text-xs">
                          Edit CV
                        </label>
                      </div>
                      <div className="flex items-center space-x-1.5">
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
                          className="h-3 w-3"
                        />
                        <label htmlFor="edit-cv-delete" className="text-xs">
                          Delete CV
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Refunds</Label>
                    <div className="space-y-1 ml-2">
                      <div className="flex items-center space-x-1.5">
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
                          className="h-3 w-3"
                        />
                        <label htmlFor="edit-refund-create" className="text-xs">
                          Create Refund
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Lead Management</Label>
                    <div className="space-y-1 ml-2">
                      <div className="flex items-center space-x-1.5">
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
                          className="h-3 w-3"
                        />
                        <label htmlFor="edit-leads-create" className="text-xs">
                          Create Leads
                        </label>
                      </div>
                      <div className="flex items-center space-x-1.5">
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
                          className="h-3 w-3"
                        />
                        <label htmlFor="edit-leads-assign" className="text-xs">
                          Assign Leads
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveUser} disabled={saving} className="flex-1 h-8 text-xs">
                  {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  <Save className="mr-1 h-3 w-3" />
                  Save
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedUser(null)}
                  disabled={saving}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={userToDelete !== null} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.email}? This action cannot be undone.
              This will permanently delete the user account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser} 
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
