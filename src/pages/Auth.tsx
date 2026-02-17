import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/hooks/useUserRole";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const from = (location.state as { from?: string })?.from;

  const redirectUser = async (userId: string) => {
    try {
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        navigate("/hub", { replace: true });
        return;
      }

      if (roles && roles.length > 0) {
        const userRoles = roles.map(r => r.role as UserRole);
        
        if (userRoles.includes('super_admin') || userRoles.includes('admin')) {
          navigate("/admin", { replace: true });
        } else if (userRoles.includes('finance')) {
          navigate("/hub/finance", { replace: true });
        } else if (userRoles.includes('sales')) {
          navigate("/sales-dashboard", { replace: true });
        } else if (userRoles.includes('product')) {
          navigate("/product-dashboard", { replace: true });
        } else if (userRoles.includes('client')) {
          navigate("/hub/client", { replace: true });
        } else {
          navigate("/hub", { replace: true });
        }
      } else {
        navigate("/hub", { replace: true });
      }
    } catch (err) {
      navigate("/hub", { replace: true });
    }
  };

  // If user is already logged in, redirect immediately
  useEffect(() => {
    if (user) {
      redirectUser(user.id);
    }
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Logged in successfully!",
      });

      // Auth context will update, useEffect above will redirect
      setTimeout(() => setLoading(false), 5000);
    } catch (error: any) {
      setLoading(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Enter your credentials to access the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait...
                    </>
                  ) : (
                    <>Login</>
                  )}
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Only authorized users can access this system. Contact your administrator for credentials.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
