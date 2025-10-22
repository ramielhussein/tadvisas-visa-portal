import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus } from "lucide-react";
import Layout from "@/components/Layout";

const SetupSalesTeam = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<any[]>([]);

  const salesEmails = [
    'sales1@tadmaids.com',
    'sales2@tadmaids.com',
    'sales3@tadmaids.com',
    'sales4@tadmaids.com',
    'sales5@tadmaids.com',
    'sales6@tadmaids.com',
    'sales7@tadmaids.com',
  ];

  const handleCreateTeam = async () => {
    try {
      setIsCreating(true);
      setResult([]);
      const results: any[] = [];
      
      for (const email of salesEmails) {
        try {
          const { data, error } = await supabase.functions.invoke("create-user", {
            body: {
              email,
              password: "mirami98",
              fullName: email.split('@')[0],
            },
          });

          if (error) {
            results.push({ email, success: false, error: error.message });
          } else {
            results.push({ email, success: true });
          }
        } catch (err: any) {
          results.push({ email, success: false, error: err.message });
        }
      }

      setResult(results);
      
      const successCount = results.filter(r => r.success).length;
      toast({
        title: "Sales Team Setup Complete",
        description: `Created ${successCount} users out of ${salesEmails.length}`,
      });
    } catch (error: any) {
      console.error("Error creating sales team:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Setup Sales Team</CardTitle>
              <CardDescription>
                Create 7 sales team members (sales1@tadmaids.com through sales7@tadmaids.com).
                Password: mirami98
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleCreateTeam}
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Users...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Sales Team
                  </>
                )}
              </Button>

              {result.length > 0 && (
                <div className="mt-6 space-y-2">
                  <div className="text-sm font-medium">Results:</div>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {result.map((r, idx) => (
                      <li key={idx} className={r.success ? 'text-green-600' : 'text-red-600'}>
                        {r.email}: {r.success ? '✓ Created' : `✗ ${r.error}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SetupSalesTeam;
