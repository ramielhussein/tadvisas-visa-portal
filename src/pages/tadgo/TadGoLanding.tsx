import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Car, 
  MapPin, 
  Camera, 
  RefreshCw, 
  Download,
  Phone,
  MessageCircle,
  CheckCircle2
} from "lucide-react";

const TadGoLanding = () => {
  const navigate = useNavigate();
  const [isDriver, setIsDriver] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    checkDriverStatus();
    
    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const checkDriverStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setIsLoggedIn(true);
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const hasDriverRole = roles?.some(r => 
        r.role === 'driver' || r.role === 'admin' || r.role === 'super_admin' || r.role === 'product'
      );
      setIsDriver(hasDriverRole || false);
    }
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleOpenApp = () => {
    if (isLoggedIn && isDriver) {
      navigate('/tadgo/app');
    } else if (isLoggedIn) {
      navigate('/auth');
    } else {
      navigate('/tadgo/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500 mb-6 shadow-lg shadow-emerald-500/30">
            <Car className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            TADGo
          </h1>
          <p className="text-xl text-emerald-200 mb-2">
            The Official Driver App by TADMAIDS
          </p>
          <p className="text-slate-400 max-w-md mx-auto">
            From maid deliveries to passport runs, TADGo keeps everything on time and stress-free.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-2xl mx-auto">
          <Card className="bg-white/10 border-white/20 backdrop-blur">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-white text-sm font-medium">View Tasks</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-white/20 backdrop-blur">
            <CardContent className="p-4 text-center">
              <MapPin className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-white text-sm font-medium">Track Progress</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-white/20 backdrop-blur">
            <CardContent className="p-4 text-center">
              <Camera className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-white text-sm font-medium">Upload Proof</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-white/20 backdrop-blur">
            <CardContent className="p-4 text-center">
              <RefreshCw className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-white text-sm font-medium">Real-time Updates</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-4 max-w-sm mx-auto mb-12">
          <Button 
            size="lg" 
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-14 text-lg"
            onClick={handleOpenApp}
          >
            <Car className="w-5 h-5 mr-2" />
            {isLoggedIn && isDriver ? "Open App" : "Driver Login"}
          </Button>
          
          {deferredPrompt && (
            <Button 
              size="lg" 
              variant="outline"
              className="w-full border-emerald-400 text-emerald-400 hover:bg-emerald-400/10 h-14 text-lg"
              onClick={handleInstall}
            >
              <Download className="w-5 h-5 mr-2" />
              Install App
            </Button>
          )}
        </div>

        {/* Support Section */}
        <div className="text-center">
          <p className="text-slate-400 text-sm mb-4">Only for TADMAIDS drivers</p>
          <div className="flex justify-center gap-4">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <Phone className="w-4 h-4 mr-2" />
              Driver Support
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Dispatcher
            </Button>
          </div>
        </div>

        {/* Onboarding Info */}
        <Card className="mt-12 bg-white/5 border-white/10 max-w-2xl mx-auto">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">How TADGo Works</h3>
            <ol className="space-y-3 text-slate-300 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">1</span>
                <span>Log in with your TADMAIDS staff account</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">2</span>
                <span>View Available Tasks and My Tasks</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">3</span>
                <span>Tap a task to accept it, view location and instructions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">4</span>
                <span>Update status: Pickup → In Transit → Delivered</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">5</span>
                <span>Upload photo or signature as proof</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TadGoLanding;
