import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Moon } from "lucide-react";

const TestFront = () => {
  const [daysToRamadan, setDaysToRamadan] = useState(0);

  useEffect(() => {
    const calculateDays = () => {
      // Ramadan 2026 expected to start around February 17, 2026
      const ramadanStart = new Date("2026-02-17T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = ramadanStart.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      setDaysToRamadan(Math.max(0, diffDays));
    };

    calculateDays();
    
    // Update daily at midnight
    const interval = setInterval(calculateDays, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Moon className="w-12 h-12 text-yellow-300 animate-pulse" />
          </div>
          
          <h2 className="text-white/80 text-xl mb-2">Days to Ramadan 2026</h2>
          
          <div className="relative">
            <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-400">
              {daysToRamadan}
            </div>
            <div className="text-white/60 text-lg mt-2">
              {daysToRamadan === 1 ? "day remaining" : "days remaining"}
            </div>
          </div>
          
          <div className="mt-6 text-white/50 text-sm">
            Expected: February 17, 2026
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestFront;
