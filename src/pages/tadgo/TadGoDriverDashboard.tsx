import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDriverLocation } from "@/hooks/useDriverLocation";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { 
  Car, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Navigation,
  RefreshCw,
  Radio,
  Bell
} from "lucide-react";

interface Task {
  id: string;
  transfer_number: string;
  from_location: string;
  to_location: string;
  transfer_date: string;
  transfer_time: string | null;
  transfer_category: string | null;
  hr_subtype: string | null;
  admin_details: string | null;
  driver_status: string | null;
  notes: string | null;
  worker?: {
    name: string;
    center_ref: string;
  };
}

const TadGoDriverDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Start location tracking when driver has active tasks
  const { isTracking, error: trackingError, startTracking, stopTracking } = useDriverLocation(null);
  const trackingStartedRef = useRef(false);
  
  // Push notifications
  const { isSupported, isSubscribed, permission, subscribe } = usePushNotifications();

  useEffect(() => {
    checkAuthAndFetch();
    // Auto-subscribe to push notifications for drivers
    if (isSupported && !isSubscribed && permission !== 'denied') {
      subscribe().then(success => {
        if (success) {
          console.log('TadGo: Push notifications enabled');
        }
      });
    }
  }, [isSupported, isSubscribed, permission]);

  // Start tracking when there are active tasks - only once
  useEffect(() => {
    if (myTasks.length > 0 && !trackingStartedRef.current) {
      console.log('TadGo Dashboard: Starting location tracking - active tasks found');
      trackingStartedRef.current = true;
      startTracking();
    }
    
    // Cleanup on unmount only
    return () => {
      if (trackingStartedRef.current) {
        stopTracking();
        trackingStartedRef.current = false;
      }
    };
  }, [myTasks.length]); // Removed startTracking and stopTracking from deps to prevent re-runs

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/tadgo");
      return;
    }
    setUserId(user.id);
    await fetchTasks(user.id);
  };

  const fetchTasks = async (driverId: string) => {
    try {
      setLoading(true);
      
      // Fetch my assigned tasks
      // @ts-ignore - Supabase types too deep
      const myResult = await supabase
        .from("worker_transfers")
        .select("*")
        .eq("driver_id", driverId);

      if (myResult.error) throw myResult.error;
      
      // Filter for active statuses client-side
      const activeTasks = (myResult.data || []).filter(
        (t: any) => ["accepted", "pickup", "in_transit"].includes(t.driver_status)
      );
      setMyTasks(activeTasks as Task[]);

      // Fetch available (unassigned) tasks
      // @ts-ignore - Supabase types too deep
      const availableResult = await supabase
        .from("worker_transfers")
        .select("*")
        .eq("status", "Pending")
        .limit(20);

      if (availableResult.error) throw availableResult.error;
      
      // Filter for unassigned client-side
      const unassignedTasks = (availableResult.data || []).filter((t: any) => !t.driver_id);
      setAvailableTasks(unassignedTasks as Task[]);

    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptTask = async (taskId: string) => {
    if (!userId) return;
    
    try {
      // @ts-ignore - Supabase types too deep
      const result = await supabase
        .from("worker_transfers")
        .update({
          driver_id: userId,
          driver_status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (result.error) throw result.error;

      toast({
        title: "Task Accepted",
        description: "You have accepted this task",
      });
      
      await fetchTasks(userId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case "pickup":
        return <MapPin className="w-4 h-4 text-orange-500" />;
      case "in_transit":
        return <Car className="w-4 h-4 text-emerald-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "accepted":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "pickup":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "in_transit":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">TadGo Dashboard</h1>
          <p className="text-slate-400 text-sm">Your tasks at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          {isTracking && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 animate-pulse">
              <Radio className="w-3 h-3 mr-1" />
              Live
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => userId && fetchTasks(userId)}
            className="border-slate-600"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* My Active Tasks */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Car className="w-5 h-5 text-emerald-500" />
          My Active Tasks ({myTasks.length})
        </h2>
        
        {myTasks.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-8 text-center text-slate-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No active tasks</p>
              <p className="text-sm">Pick up a task from available list below</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myTasks.map((task) => (
              <Card 
                key={task.id} 
                className="bg-slate-800 border-slate-700 cursor-pointer hover:border-emerald-500/50 transition-colors"
                onClick={() => navigate(`/tadgo/task/${task.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.driver_status)}
                      <span className="font-semibold text-emerald-400">
                        {task.transfer_number || task.id.slice(0, 8)}
                      </span>
                    </div>
                    <Badge className={getStatusColor(task.driver_status)}>
                      {task.driver_status?.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  {task.worker && (
                    <p className="text-sm text-slate-300 mb-2">
                      Worker: {task.worker.name}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="w-3 h-3" />
                    <span>{task.from_location}</span>
                    <Navigation className="w-3 h-3" />
                    <span>{task.to_location}</span>
                  </div>
                  
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(task.transfer_date).toLocaleDateString()}
                    {task.transfer_time && ` at ${task.transfer_time}`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Available Tasks */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-500" />
          Available Tasks ({availableTasks.length})
        </h2>
        
        {availableTasks.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-8 text-center text-slate-400">
              <p>No available tasks right now</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {availableTasks.map((task) => (
              <Card key={task.id} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-slate-300">
                      {task.transfer_number || task.id.slice(0, 8)}
                    </span>
                    <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                      {task.transfer_category || "Transport"}
                    </Badge>
                  </div>
                  
                  {task.worker && (
                    <p className="text-sm text-slate-400 mb-2">
                      Worker: {task.worker.name}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                    <MapPin className="w-3 h-3" />
                    <span>{task.from_location}</span>
                    <span>→</span>
                    <span>{task.to_location}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      {new Date(task.transfer_date).toLocaleDateString()}
                    </p>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        acceptTask(task.id);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Accept Task
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4">
        <div className="flex justify-around">
          <Button
            variant="ghost"
            className="flex-col h-auto py-2 text-emerald-400"
            onClick={() => navigate("/tadgo/dashboard")}
          >
            <Car className="w-5 h-5 mb-1" />
            <span className="text-xs">Dashboard</span>
          </Button>
          <Button
            variant="ghost"
            className="flex-col h-auto py-2 text-slate-400"
            onClick={() => navigate("/tadgo/app")}
          >
            <MapPin className="w-5 h-5 mb-1" />
            <span className="text-xs">Tasks</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TadGoDriverDashboard;
