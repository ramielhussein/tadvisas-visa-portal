import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useQZTray } from "@/hooks/useQZTray";
import { formatTaskReceipt, playAlertSound, TaskData } from "@/utils/thermalReceiptFormatter";
import { Printer, Wifi, WifiOff, Volume2, VolumeX, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";

interface PrintLog {
  id: string;
  taskId: string;
  taskTitle: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'pending';
  error?: string;
}

const PrintStation = () => {
  const [autoPrint, setAutoPrint] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [printLogs, setPrintLogs] = useState<PrintLog[]>([]);
  const [pendingTasks, setPendingTasks] = useState<TaskData[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const processedTaskIds = useRef<Set<string>>(new Set());
  
  const qz = useQZTray();

  // Subscribe to new tasks in worker_transfers
  useEffect(() => {
    const channel = supabase
      .channel('print-station-tasks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'worker_transfers'
        },
        async (payload) => {
          console.log('New task received:', payload);
          
          const newTask = payload.new as any;
          
          // Prevent duplicate processing
          if (processedTaskIds.current.has(newTask.id)) {
            return;
          }
          processedTaskIds.current.add(newTask.id);
          
          // Fetch worker details if worker_id exists
          let workerData = null;
          if (newTask.worker_id) {
            const { data } = await supabase
              .from('workers')
              .select('name, center_ref')
              .eq('id', newTask.worker_id)
              .single();
            workerData = data;
          }
          
          const taskData: TaskData = {
            id: newTask.id,
            transfer_number: newTask.transfer_number,
            title: newTask.title,
            from_location: newTask.from_location,
            to_location: newTask.to_location,
            transfer_date: newTask.transfer_date,
            transfer_time: newTask.transfer_time,
            transfer_category: newTask.transfer_category,
            hr_subtype: newTask.hr_subtype,
            notes: newTask.notes,
            worker: workerData,
            client_name: newTask.client_name,
          };
          
          // Play alert sound
          if (soundEnabled) {
            playAlertSound();
          }
          
          // Auto-print if enabled
          if (autoPrint && qz.isConnected) {
            await handlePrintTask(taskData);
          } else {
            // Add to pending queue
            setPendingTasks(prev => [taskData, ...prev]);
            addPrintLog(taskData.id, taskData.title || taskData.transfer_number || 'Task', 'pending');
          }
        }
      )
      .subscribe((status) => {
        setIsSubscribed(status === 'SUBSCRIBED');
        console.log('Print station subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [autoPrint, soundEnabled, qz.isConnected]);

  const handlePrintTask = async (task: TaskData) => {
    const logId = Date.now().toString();
    const taskTitle = task.title || task.transfer_number || `Task #${task.id.slice(0, 8)}`;
    
    addPrintLog(task.id, taskTitle, 'pending');
    
    try {
      const receiptData = formatTaskReceipt(task);
      await qz.printReceipt(receiptData);
      
      updatePrintLog(task.id, 'success');
      
      // Remove from pending if it was there
      setPendingTasks(prev => prev.filter(t => t.id !== task.id));
    } catch (error: any) {
      console.error('Print failed:', error);
      updatePrintLog(task.id, 'failed', error.message);
    }
  };

  const addPrintLog = (taskId: string, taskTitle: string, status: PrintLog['status'], error?: string) => {
    const log: PrintLog = {
      id: Date.now().toString(),
      taskId,
      taskTitle,
      timestamp: new Date(),
      status,
      error,
    };
    setPrintLogs(prev => [log, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  const updatePrintLog = (taskId: string, status: PrintLog['status'], error?: string) => {
    setPrintLogs(prev => prev.map(log => 
      log.taskId === taskId && log.status === 'pending'
        ? { ...log, status, error, timestamp: new Date() }
        : log
    ));
  };

  const handleReprintTask = (task: TaskData) => {
    handlePrintTask(task);
  };

  const getStatusIcon = (status: PrintLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <Printer className="w-8 h-8" />
            TadGo Print Station
          </h1>
          <p className="text-muted-foreground">
            Automatic thermal receipt printing for driver tasks
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Connection Status */}
          <Card className={qz.isConnected ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {qz.isConnected ? (
                    <Wifi className="w-6 h-6 text-green-500" />
                  ) : (
                    <WifiOff className="w-6 h-6 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">QZ Tray</p>
                    <p className="text-sm text-muted-foreground">
                      {qz.isConnected ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                </div>
                {!qz.isConnected && (
                  <Button size="sm" onClick={qz.connect}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reconnect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card className={isSubscribed ? 'border-green-500/50 bg-green-500/5' : 'border-yellow-500/50 bg-yellow-500/5'}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {isSubscribed ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-yellow-500 animate-pulse" />
                )}
                <div>
                  <p className="font-medium">Task Listener</p>
                  <p className="text-sm text-muted-foreground">
                    {isSubscribed ? 'Listening for new tasks...' : 'Connecting...'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pending Tasks</p>
                  <p className="text-2xl font-bold">{pendingTasks.length}</p>
                </div>
                {pendingTasks.length > 0 && (
                  <Button 
                    size="sm" 
                    onClick={() => pendingTasks.forEach(handleReprintTask)}
                    disabled={!qz.isConnected}
                  >
                    Print All
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Printer Selection */}
            <div className="space-y-2">
              <Label>Thermal Printer</Label>
              {!qz.isLoaded ? (
                <p className="text-sm text-muted-foreground">Loading QZ Tray library...</p>
              ) : !qz.isConnected ? (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-600">
                    QZ Tray is not connected. Make sure it's installed and running.
                  </p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={qz.connect}>
                    Try Connect
                  </Button>
                </div>
              ) : qz.printers.length === 0 ? (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-600">
                    No printers detected. Make sure your printer is connected and turned on.
                  </p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={qz.connect}>
                    Refresh Printers
                  </Button>
                </div>
              ) : (
                <Select 
                  value={qz.selectedPrinter || ''} 
                  onValueChange={qz.selectPrinter}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select a printer..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {qz.printers.map(printer => (
                      <SelectItem key={printer} value={printer}>
                        {printer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {qz.selectedPrinter && (
                <p className="text-sm text-green-600">✓ Selected: {qz.selectedPrinter}</p>
              )}
            </div>

            {/* Toggles */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Printer className="w-5 h-5" />
                <div>
                  <Label htmlFor="auto-print">Auto-Print</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically print new tasks when they arrive
                  </p>
                </div>
              </div>
              <Switch
                id="auto-print"
                checked={autoPrint}
                onCheckedChange={setAutoPrint}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                <div>
                  <Label htmlFor="sound">Sound Alert</Label>
                  <p className="text-sm text-muted-foreground">
                    Play a sound when new tasks arrive
                  </p>
                </div>
              </div>
              <Switch
                id="sound"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>

            {/* Test Print */}
            <Button 
              variant="outline" 
              onClick={() => {
                const testTask: TaskData = {
                  id: 'test-' + Date.now(),
                  title: 'TEST PRINT',
                  from_location: 'Office',
                  to_location: 'Client Location',
                  transfer_date: new Date().toISOString(),
                  transfer_time: '10:00',
                  transfer_category: 'TRANSPORT',
                  notes: 'This is a test print to verify printer connection.',
                };
                handlePrintTask(testTask);
              }}
              disabled={!qz.isConnected || !qz.selectedPrinter}
            >
              <Printer className="w-4 h-4 mr-2" />
              Test Print
            </Button>

            {qz.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-500">{qz.error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Tasks ({pendingTasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingTasks.map(task => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {task.title || task.transfer_number || `Task #${task.id.slice(0, 8)}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {task.from_location} → {task.to_location}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleReprintTask(task)}
                      disabled={!qz.isConnected}
                    >
                      Print
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Print History */}
        <Card>
          <CardHeader>
            <CardTitle>Print History</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {printLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No print history yet. Waiting for tasks...
                </div>
              ) : (
                <div className="space-y-2">
                  {printLogs.map(log => (
                    <div 
                      key={log.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <p className="font-medium">{log.taskTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.timestamp.toLocaleTimeString()}
                          </p>
                          {log.error && (
                            <p className="text-xs text-red-500">{log.error}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={
                        log.status === 'success' ? 'default' : 
                        log.status === 'failed' ? 'destructive' : 
                        'secondary'
                      }>
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-medium">Setup Instructions</h3>
              <ol className="text-sm text-muted-foreground text-left list-decimal list-inside space-y-1">
                <li>Download and install <a href="https://qz.io/download/" target="_blank" rel="noopener" className="text-primary hover:underline">QZ Tray</a> on this computer</li>
                <li>Connect your 80mm thermal printer via USB</li>
                <li>Start QZ Tray (it runs in the system tray)</li>
                <li>Refresh this page and select your printer above</li>
                <li>Keep this page open 24/7 for automatic printing</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrintStation;
