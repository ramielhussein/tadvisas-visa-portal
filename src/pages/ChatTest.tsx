import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";

const ChatTest = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)] bg-muted/30">
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Team Chat Demo</h1>
                <p className="text-muted-foreground mt-1">
                  The team chat is now integrated into the floating buttons at the bottom of the page. Click the "Team Chat" button to open it!
                </p>
              </div>
            </div>

            <Card className="p-6 mb-4">
              <h2 className="text-xl font-semibold mb-4">Demo: My Leads</h2>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                    <div>
                      <p className="font-medium">Client {i}</p>
                      <p className="text-sm text-muted-foreground">+971 50 123 456{i}</p>
                    </div>
                    <Badge variant="secondary">New</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Activity Feed</h2>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 border-l-4 border-primary bg-background rounded">
                    <p className="text-sm font-medium">Activity Update {i}</p>
                    <p className="text-xs text-muted-foreground mt-1">Recent activity on lead #{i}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChatTest;
