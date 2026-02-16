import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { UserRole } from "@/hooks/useUserRole";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get the intended destination from state, or fall back to role-based redirect
  const from = (location.state as { from?: string })?.from;

  const redirectUser = async (userId: string) => {
    // If there's a stored "from" path, go there instead of role-based redirect
    if (from) {
      navigate(from, { replace: true });
      return;
    }

    // Fall back to role-based redirect
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (roles && roles.length > 0) {
      const userRoles = roles.map(r => r.role as UserRole);
      
      // Priority-based redirect
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
  };

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await redirectUser(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await redirectUser(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, from]);

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

      // onAuthStateChange will handle the redirect
      // Add a safety timeout in case redirect doesn't happen
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
