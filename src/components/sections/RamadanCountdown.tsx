import { useState, useEffect } from "react";
import { Moon } from "lucide-react";

const RamadanCountdown = () => {
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
    const interval = setInterval(calculateDays, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, []);

  if (daysToRamadan <= 0) return null;

  return (
    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full shadow-lg">
      <Moon className="w-5 h-5 text-yellow-300 animate-pulse" />
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-yellow-300">{daysToRamadan}</span>
        <span className="text-sm opacity-90">days to Ramadan</span>
      </div>
    </div>
  );
};

export default RamadanCountdown;
