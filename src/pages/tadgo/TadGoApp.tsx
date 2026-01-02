import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useDriverLocation } from "@/hooks/useDriverLocation";
import { 
  Car, 
  MapPin, 
  Clock, 
  User, 
  LogOut,
  RefreshCw,
  CheckCircle2,
  Truck,
  Package,
  Users,
  Bell,
  BellOff,
  ExternalLink,
  Phone,
  MessageCircle,
  Radio,
  History,
  Navigation
} from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: string;
  transfer_number: string;
  title: string | null;
  worker_id: string;
  from_location: string;
  to_location: string;
  transfer_date: string;
  transfer_time: string | null;
  transfer_type: string;
  notes: string | null;
  driver_status: string;
  driver_id: string | null;
  client_name: string | null;
  client_phone: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  gmap_link: string | null;
  worker?: {
    name: string;
    center_ref: string;
  };
}

interface Driver {
  id: string;
  full_name: string;
  email: string;
}

const TadGoApp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available");
  const [isDriverManager, setIsDriverManager] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const { isSupported, isSubscribed, permission, subscribe } = usePushNotifications();
  
  // Location tracking for active tasks
  const { isTracking, startTracking, stopTracking } = useDriverLocation(null);
  const trackingStartedRef = useRef(false);

  // Request push notification permission on mount - always ask when not subscribed
  useEffect(() => {
    const requestNotificationPermission = async () => {
      // Always try to prompt for notifications if supported and not already subscribed
      if (isSupported && !isSubscribed) {
        // Only auto-prompt if permission is 'default' (not yet asked)
        if (permission === 'default') {
          setTimeout(async () => {
            const result = await subscribe();
            if (result) {
              toast({
                title: "Notifications Enabled",
                description: "You'll receive alerts for new tasks and updates",
              });
            }
          }, 1000);
        } else if (permission === 'denied') {
          // Show a toast to guide users to enable manually in browser settings
          toast({
            title: "Notifications Blocked",
            description: "Please enable notifications in your browser settings to receive task alerts",
            variant: "destructive",
          });
        }
      }
    };

    requestNotificationPermission();
  }, [isSupported, isSubscribed, permission, subscribe, toast]);

  useEffect(() => {
    checkAuth();
    fetchTasks();

    // Set up realtime subscription
    const channel = supabase
      .channel('tadgo-tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'worker_transfers' },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Start tracking when there are active tasks
  useEffect(() => {
    const myActiveTasks = tasks.filter(t => 
      t.driver_id === user?.id && 
      ['accepted', 'pickup', 'in_transit'].includes(t.driver_status)
    );
    
    if (myActiveTasks.length > 0 && !trackingStartedRef.current) {
      trackingStartedRef.current = true;
      startTracking();
    }
    
    return () => {
      if (trackingStartedRef.current) {
        stopTracking();
        trackingStartedRef.current = false;
      }
    };
  }, [tasks, user?.id]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/tadgo/login');
      return;
    }
    setUser(user);
    
    // Check if user is a driver manager
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'driver_manager')
      .maybeSingle();
    
    if (roleData) {
      setIsDriverManager(true);
      fetchDrivers();
    }
  };

  const fetchDrivers = async () => {
    try {
      const { data: driverRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'driver');
      
      if (driverRoles && driverRoles.length > 0) {
        const driverIds = driverRoles.map(d => d.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', driverIds);
        
        if (profiles) {
          const filteredDrivers = profiles.filter(
            driver => driver.email?.toLowerCase() !== 'nour@tadmaids.com'
          );
          setDrivers(filteredDrivers);
        }
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('worker_transfers')
        .select(`
          *,
          worker:workers(name, center_ref)
        `)
        .order('transfer_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('worker_transfers')
        .update({
          driver_id: user.id,
          driver_status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;

      // Send push notification to self (useful when accepting from PC, phone will get notified)
      await supabase.functions.invoke('notify-transfer', {
        body: {
          transferId: taskId,
          eventType: 'assigned',
          driverId: user.id,
        },
      });

      toast({
        title: "Task Accepted",
        description: "The task has been assigned to you",
      });

      fetchTasks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAssignTask = async (taskId: string, driverId: string) => {
    try {
      const { error } = await supabase
        .from('worker_transfers')
        .update({
          driver_id: driverId,
          driver_status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;

      // Send push notification to the assigned driver
      await supabase.functions.invoke('notify-transfer', {
        body: {
          transferId: taskId,
          eventType: 'assigned',
          driverId: driverId,
        },
      });

      const assignedDriver = drivers.find(d => d.id === driverId);
      toast({
        title: "Task Assigned",
        description: `Task assigned to ${assignedDriver?.full_name || 'driver'}`,
      });

      fetchTasks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/tadgo');
  };

  // One-tap call handler
  const handleCall = (phone: string | null, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!phone) {
      toast({ title: "No phone number", description: "Client phone not available", variant: "destructive" });
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  // One-tap WhatsApp handler
  const handleWhatsApp = (phone: string | null, workerName: string | null, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!phone) {
      toast({ title: "No phone number", description: "Client phone not available", variant: "destructive" });
      return;
    }
    // Remove any non-digit characters and add UAE country code if needed
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '971' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('971')) {
      cleanPhone = '971' + cleanPhone;
    }
    const message = encodeURIComponent(`Hi, I'm your TADGo driver. I'm on my way${workerName ? ` with ${workerName}` : ''}.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const availableTasks = tasks.filter(t => !t.driver_id && t.driver_status === 'pending');
  const myTasks = tasks.filter(t => 
    t.driver_id === user?.id && 
    !['completed', 'cancelled', 'delivered'].includes(t.driver_status)
  );
  const historyTasks = tasks.filter(t => 
    t.driver_id === user?.id && 
    ['completed', 'cancelled', 'delivered'].includes(t.driver_status)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-slate-500';
      case 'accepted': return 'bg-blue-500';
      case 'pickup': return 'bg-yellow-500';
      case 'in_transit': return 'bg-purple-500';
      case 'delivered': return 'bg-emerald-500';
      case 'completed': return 'bg-green-600';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'accepted': return <CheckCircle2 className="w-4 h-4" />;
      case 'pickup': return <Package className="w-4 h-4" />;
      case 'in_transit': return <Truck className="w-4 h-4" />;
      case 'delivered': return <MapPin className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const TaskCard = ({ task, showAccept = false, isHistory = false }: { task: Task; showAccept?: boolean; isHistory?: boolean }) => (
    <Card 
      className={`border-slate-700 cursor-pointer hover:bg-slate-800/70 transition-colors ${isHistory ? 'bg-slate-800/30' : 'bg-slate-800/50'}`}
      onClick={() => navigate(`/tadgo/task/${task.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold text-white">{task.title || task.transfer_number}</p>
            <p className="text-sm text-slate-400">{task.transfer_number} • {task.transfer_type}</p>
          </div>
          <Badge className={`${getStatusColor(task.driver_status)} text-white`}>
            {getStatusIcon(task.driver_status)}
            <span className="ml-1 capitalize">{task.driver_status?.replace('_', ' ')}</span>
          </Badge>
        </div>

        {task.worker && (
          <div className="flex items-center gap-2 mb-3 text-sm text-slate-300">
            <User className="w-4 h-4 text-slate-500" />
            <span>{task.worker.name}</span>
            <span className="text-slate-500">({task.worker.center_ref})</span>
          </div>
        )}

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">From:</span>
            <span className="text-white truncate">{task.from_location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-red-400" />
            <span className="text-slate-400">To:</span>
            <span className="text-white truncate">{task.to_location}</span>
          </div>
        </div>

        {/* One-tap communication buttons - show for assigned tasks */}
        {task.driver_id && !isHistory && (
          <div className="flex gap-2 mb-3">
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 border-green-500 text-green-400 hover:bg-green-500/10"
              onClick={(e) => handleCall(task.client_phone, e)}
            >
              <Phone className="w-4 h-4 mr-1" />
              Call
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 border-emerald-500 text-emerald-400 hover:bg-emerald-500/10"
              onClick={(e) => handleWhatsApp(task.client_phone, task.worker?.name || null, e)}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              WhatsApp
            </Button>
          </div>
        )}

        {/* Google Maps Link */}
        {task.gmap_link && task.driver_id && (
          <div className="mb-3">
            <Button 
              size="sm" 
              variant="outline"
              className="w-full border-blue-500 text-blue-400 hover:bg-blue-500/10"
              onClick={(e) => {
                e.stopPropagation();
                window.open(task.gmap_link!, '_blank');
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Google Maps
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            <span>
              {format(new Date(task.transfer_date), 'MMM d, yyyy')}
              {task.transfer_time && ` at ${task.transfer_time}`}
            </span>
          </div>

          {showAccept && !isDriverManager && (
            <Button 
              size="sm" 
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={(e) => {
                e.stopPropagation();
                handleAcceptTask(task.id);
              }}
            >
              Accept
            </Button>
          )}
        </div>

        {/* Driver Manager Assignment Dropdown */}
        {showAccept && isDriverManager && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-400 font-medium">Assign to Driver</span>
            </div>
            <Select onValueChange={(driverId) => handleAssignTask(task.id, driverId)}>
              <SelectTrigger 
                className="bg-slate-700 border-slate-600 text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <SelectValue placeholder="Select a driver..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {drivers.map((driver) => (
                  <SelectItem 
                    key={driver.id} 
                    value={driver.id}
                    className="text-white hover:bg-slate-700"
                  >
                    {driver.full_name || driver.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {task.notes && !isHistory && (
          <p className="mt-3 text-sm text-slate-400 bg-slate-700/50 p-2 rounded">
            {task.notes}
          </p>
        )}

        {/* History completion date */}
        {isHistory && task.completed_at && (
          <p className="mt-2 text-xs text-slate-500">
            Completed: {format(new Date(task.completed_at), 'MMM d, yyyy h:mm a')}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-10 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">TADGo</h1>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-400">{user?.email}</p>
                  {isDriverManager && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50 text-[10px]">
                      Manager
                    </Badge>
                  )}
                  {isTracking && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 text-[10px] animate-pulse">
                      <Radio className="w-2 h-2 mr-1" />
                      Live
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSupported && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={async () => {
                    if (!isSubscribed) {
                      const result = await subscribe();
                      toast({
                        title: result ? "Notifications Enabled" : "Permission Denied",
                        description: result 
                          ? "You'll receive alerts for new tasks" 
                          : "Please enable notifications in browser settings",
                        variant: result ? "default" : "destructive",
                      });
                    } else {
                      toast({
                        title: "Already Enabled",
                        description: "Push notifications are active",
                      });
                    }
                  }}
                  className={isSubscribed ? "text-emerald-400 hover:text-emerald-300" : "text-slate-400 hover:text-white"}
                  title={isSubscribed ? "Notifications enabled" : "Enable notifications"}
                >
                  {isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={fetchTasks}
                className="text-slate-400 hover:text-white"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                className="text-slate-400 hover:text-white"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-slate-800/50 border border-slate-700 mb-4">
            <TabsTrigger 
              value="available" 
              className="flex-1 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-xs"
            >
              Available ({availableTasks.length})
            </TabsTrigger>
            <TabsTrigger 
              value="my-tasks" 
              className="flex-1 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-xs"
            >
              My Tasks ({myTasks.length})
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex-1 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-xs"
            >
              <History className="w-3 h-3 mr-1" />
              History ({historyTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                Loading tasks...
              </div>
            ) : availableTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No available tasks</p>
                <p className="text-sm">Check back later for new tasks</p>
              </div>
            ) : (
              availableTasks.map(task => (
                <TaskCard key={task.id} task={task} showAccept />
              ))
            )}
          </TabsContent>

          <TabsContent value="my-tasks" className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                Loading tasks...
              </div>
            ) : myTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active tasks</p>
                <p className="text-sm">Accept tasks from the Available tab</p>
              </div>
            ) : (
              myTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                Loading history...
              </div>
            ) : historyTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No completed tasks yet</p>
                <p className="text-sm">Your completed tasks will appear here</p>
              </div>
            ) : (
              historyTasks.map(task => (
                <TaskCard key={task.id} task={task} isHistory />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-3 z-20">
        <div className="flex justify-around max-w-md mx-auto">
          <Button
            variant="ghost"
            className="flex-col h-auto py-2 text-emerald-400"
            onClick={() => setActiveTab("my-tasks")}
          >
            <Car className="w-5 h-5 mb-1" />
            <span className="text-xs">Tasks</span>
          </Button>
          <Button
            variant="ghost"
            className={`flex-col h-auto py-2 ${activeTab === 'available' ? 'text-emerald-400' : 'text-slate-400'}`}
            onClick={() => setActiveTab("available")}
          >
            <Package className="w-5 h-5 mb-1" />
            <span className="text-xs">Available</span>
          </Button>
          <Button
            variant="ghost"
            className={`flex-col h-auto py-2 ${activeTab === 'history' ? 'text-emerald-400' : 'text-slate-400'}`}
            onClick={() => setActiveTab("history")}
          >
            <History className="w-5 h-5 mb-1" />
            <span className="text-xs">History</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TadGoApp;
