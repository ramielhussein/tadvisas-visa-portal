import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CheckCircle2, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Smartphone className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-2">Install TADVISAS App</h1>
            <p className="text-muted-foreground">
              Get quick access to our visa services right from your home screen
            </p>
          </div>

          {isInstalled ? (
            <Card className="border-2 border-primary">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                  <CardTitle>App Already Installed</CardTitle>
                </div>
                <CardDescription>
                  TADVISAS is installed on your device. You can launch it from your home screen.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Why Install the App?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Quick Access</p>
                      <p className="text-sm text-muted-foreground">
                        Launch directly from your home screen
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Works Offline</p>
                      <p className="text-sm text-muted-foreground">
                        Access key features even without internet
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">App-Like Experience</p>
                      <p className="text-sm text-muted-foreground">
                        Full-screen native app feel
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Always Updated</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically gets latest features
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {deferredPrompt ? (
                <Button 
                  onClick={handleInstallClick} 
                  size="lg" 
                  className="w-full"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Install App Now
                </Button>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>How to Install</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">On iPhone (Safari):</h3>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Tap the Share button (square with arrow)</li>
                        <li>Scroll down and tap "Add to Home Screen"</li>
                        <li>Tap "Add" to confirm</li>
                      </ol>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">On Android (Chrome):</h3>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Tap the menu (three dots)</li>
                        <li>Tap "Install app" or "Add to Home screen"</li>
                        <li>Tap "Install" to confirm</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default InstallApp;
