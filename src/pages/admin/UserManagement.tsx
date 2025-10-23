import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UserPlus, Users } from "lucide-react";
import { useAdminCheck } from "@/hooks/useAdminCheck";

export default function UserManagement() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();

  // Single user creation
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [creating, setCreating] = useState(false);

  // Bulk sales team creation
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamResult, setTeamResult] = useState<string>("");

  const salesEmails = [
    "sales1@tadmaids.com",
    "sales2@tadmaids.com", 
    "sales3@tadmaids.com",
    "sales4@tadmaids.com",
    "sales5@tadmaids.com"
  ];

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
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { 
          email, 
          password,
          fullName 
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
        setEmail("");
        setPassword("");
        setFullName("");
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

  const handleCreateTeam = async () => {
    setIsCreatingTeam(true);
    setTeamResult("");
    
    const results: string[] = [];
    
    for (const email of salesEmails) {
      try {
        const { data, error } = await supabase.functions.invoke('create-user', {
          body: { 
            email, 
            password: 'TadVisas2024!',
            fullName: email.split('@')[0]
          }
        });

        if (error) {
          results.push(`❌ ${email}: ${error.message}`);
        } else if (data.error) {
          results.push(`❌ ${email}: ${data.error}`);
        } else {
          results.push(`✅ ${email}: Created successfully`);
        }
      } catch (error: any) {
        results.push(`❌ ${email}: ${error.message}`);
      }
    }
    
    setTeamResult(results.join('\n'));
    setIsCreatingTeam(false);
    
    toast({
      title: "Sales Team Setup Complete",
      description: "Check the results below",
    });
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
              Create and manage user accounts for CV submission and sales team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Single User
                </TabsTrigger>
                <TabsTrigger value="bulk">
                  <Users className="h-4 w-4 mr-2" />
                  Setup Sales Team
                </TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-4">
                <form onSubmit={handleCreateUser} className="space-y-4">
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

                  <Button type="submit" className="w-full" disabled={creating}>
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create User
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="bulk" className="space-y-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Create multiple sales team accounts at once:
                  </p>
                  <ul className="text-sm space-y-1">
                    {salesEmails.map((email) => (
                      <li key={email}>• {email}</li>
                    ))}
                  </ul>

                  <Button 
                    onClick={handleCreateTeam}
                    disabled={isCreatingTeam}
                    className="w-full"
                  >
                    {isCreatingTeam && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isCreatingTeam ? "Creating Sales Team..." : "Create All Sales Users"}
                  </Button>

                  {teamResult && (
                    <div className="mt-4 p-4 bg-muted rounded-md">
                      <pre className="text-sm whitespace-pre-wrap">{teamResult}</pre>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
