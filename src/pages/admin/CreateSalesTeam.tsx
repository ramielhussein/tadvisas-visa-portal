import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus } from "lucide-react";
import Layout from "@/components/Layout";

const CreateSalesTeam = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCreateTeam = async () => {
    try {
      setIsCreating(true);
      setResult(null);
      
      const { data, error } = await supabase.functions.invoke("create-sales-team");

      if (error) throw error;

      setResult(data);
      
      toast({
        title: "Sales Team Creation Complete",
        description: `Created ${data.created?.length || 0} users. ${data.errors?.length || 0} errors.`,
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
              <CardTitle>Create Sales Team</CardTitle>
              <CardDescription>
                Create 7 sales team members with emails sales1@tadmaids.com through sales7@tadmaids.com.
                All users will have the password: mirami98
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

              {result && (
                <div className="mt-6 space-y-4">
                  <div className="text-sm font-medium">Results:</div>
                  
                  {result.created && result.created.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm text-green-600 font-medium">
                        Successfully Created ({result.created.length}):
                      </div>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {result.created.map((user: any) => (
                          <li key={user.id}>{user.email}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.errors && result.errors.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm text-red-600 font-medium">
                        Errors ({result.errors.length}):
                      </div>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {result.errors.map((err: any, idx: number) => (
                          <li key={idx} className="text-red-600">
                            {err.email}: {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CreateSalesTeam;
