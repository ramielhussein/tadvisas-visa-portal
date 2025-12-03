import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Car, ChevronUp, ChevronDown, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  transfer_number: string;
  from_location: string;
  to_location: string;
  transfer_date: string;
  driver_status: string | null;
  driver_id: string | null;
  driver_name?: string;
}

const DriversFloatingIsland = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setIsLoading(false);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
      
      const channel = supabase
        .channel('driver-tasks-island')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'worker_transfers' }, () => fetchTasks())
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [isAuthenticated]);

  const fetchTasks = async () => {
    try {
      // @ts-ignore
      const { data, error } = await supabase
        .from("worker_transfers")
        .select("id, transfer_number, from_location, to_location, transfer_date, driver_status, driver_id")
        .or("driver_status.is.null,driver_status.in.(accepted,pickup,in_transit)")
        .order("transfer_date", { ascending: true })
        .limit(5);

      if (error) throw error;

      const tasksWithDrivers = await Promise.all(
        (data || []).map(async (task: any) => {
          if (task.driver_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", task.driver_id)
              .single();
            return { ...task, driver_name: profile?.full_name || "Unknown" };
          }
          return task;
        })
      );
      setTasks(tasksWithDrivers);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // Don't show while loading or if not authenticated
  if (isLoading || !isAuthenticated) return null;

  const activeCount = tasks.filter(t => t.driver_id).length;
  const pendingCount = tasks.filter(t => !t.driver_id).length;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-auto max-w-sm">
      <Card className={cn(
        "bg-slate-900/95 backdrop-blur-lg border-slate-700 shadow-xl transition-all duration-200",
        isExpanded ? "rounded-xl" : "rounded-full"
      )}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-3 py-2 text-white"
        >
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium">Tasks</span>
            <span className="text-xs text-emerald-400">{activeCount}</span>
            <span className="text-xs text-slate-500">/</span>
            <span className="text-xs text-yellow-400">{pendingCount}</span>
          </div>
          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>

        {isExpanded && (
          <div className="px-3 pb-3 max-h-48 overflow-y-auto">
            <div className="border-t border-slate-700 pt-2 space-y-1.5">
              {tasks.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-2">No tasks</p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="bg-slate-800/50 rounded-md p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-white font-medium truncate">
                        {task.transfer_number || task.id.slice(0, 6)}
                      </span>
                      <Badge variant="outline" className={cn(
                        "text-[10px] px-1.5 py-0",
                        !task.driver_id ? "text-yellow-400 border-yellow-500/50" :
                        task.driver_status === "in_transit" ? "text-emerald-400 border-emerald-500/50" :
                        "text-blue-400 border-blue-500/50"
                      )}>
                        {!task.driver_id ? "Open" : task.driver_status === "in_transit" ? "Transit" : "Active"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      <span className="truncate">{task.from_location} → {task.to_location}</span>
                    </div>
                    {task.driver_name && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-0.5">
                        <User className="w-2.5 h-2.5" />
                        <span>{task.driver_name}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DriversFloatingIsland;
