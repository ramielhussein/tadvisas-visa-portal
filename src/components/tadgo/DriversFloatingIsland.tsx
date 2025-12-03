import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Car, 
  ChevronUp, 
  ChevronDown, 
  MapPin, 
  User,
  Clock,
  CheckCircle
} from "lucide-react";
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

  useEffect(() => {
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      setIsAuthenticated(event === 'SIGNED_IN' || event === 'INITIAL_SESSION');
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('driver-tasks-island')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'worker_transfers' },
          () => fetchTasks()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const fetchTasks = async () => {
    try {
      // @ts-ignore - Supabase types too deep
      const { data, error } = await supabase
        .from("worker_transfers")
        .select("id, transfer_number, from_location, to_location, transfer_date, driver_status, driver_id")
        .in("status", ["Pending", "In Progress"])
        .order("transfer_date", { ascending: true })
        .limit(10);

      if (error) throw error;

      // Fetch driver names for assigned tasks
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

  if (!isAuthenticated) return null;

  const activeCount = tasks.filter(t => t.driver_id).length;
  const pendingCount = tasks.filter(t => !t.driver_id).length;

  const getStatusBadge = (task: Task) => {
    if (!task.driver_id) {
      return <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 text-xs">Available</Badge>;
    }
    switch (task.driver_status) {
      case "in_transit":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 text-xs">In Transit</Badge>;
      case "pickup":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50 text-xs">Pickup</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 text-xs">Accepted</Badge>;
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl">
      <Card className={cn(
        "bg-slate-900/95 backdrop-blur-lg border-slate-700 shadow-2xl transition-all duration-300",
        isExpanded ? "rounded-2xl" : "rounded-full"
      )}>
        {/* Collapsed Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 text-white"
        >
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-full">
              <Car className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-left">
              <span className="font-semibold text-sm">Driver Tasks</span>
              <div className="flex gap-2 text-xs text-slate-400">
                <span className="text-emerald-400">{activeCount} active</span>
                <span>•</span>
                <span className="text-yellow-400">{pendingCount} pending</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-4 pb-4 max-h-72 overflow-y-auto">
            <div className="border-t border-slate-700 pt-3 space-y-2">
              {tasks.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No active tasks</p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm truncate">
                          {task.transfer_number || task.id.slice(0, 8)}
                        </span>
                        {getStatusBadge(task)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{task.from_location}</span>
                        <span>→</span>
                        <span className="truncate">{task.to_location}</span>
                      </div>
                      {task.driver_name && (
                        <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1">
                          <User className="w-3 h-3" />
                          <span>{task.driver_name}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 ml-2">
                      {new Date(task.transfer_date).toLocaleDateString()}
                    </div>
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
