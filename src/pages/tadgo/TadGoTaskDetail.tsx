import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDriverLocation } from "@/hooks/useDriverLocation";
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  User, 
  Camera,
  CheckCircle2,
  Truck,
  Package,
  Phone,
  Navigation,
  Upload,
  Loader2,
  Radio,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: string;
  transfer_number: string;
  title: string | null;
  worker_id: string;
  from_location: string;
  to_location: string;
  from_lat: number | null;
  from_lng: number | null;
  to_lat: number | null;
  to_lng: number | null;
  transfer_date: string;
  transfer_time: string | null;
  transfer_type: string;
  notes: string | null;
  driver_status: string;
  driver_id: string | null;
  client_name: string | null;
  proof_photo_url: string | null;
  signature_url: string | null;
  accepted_at: string | null;
  pickup_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  gmap_link: string | null;
  worker?: {
    name: string;
    center_ref: string;
    nationality_code: string;
  };
}

const STATUS_FLOW = ['pending', 'accepted', 'pickup', 'in_transit', 'delivered', 'completed'];

const TadGoTaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [driverNotes, setDriverNotes] = useState("");

  // Location tracking hook
  const { isTracking, error: locationError, startTracking, stopTracking } = useDriverLocation(id || null);

  // Start tracking when task is active (accepted to delivered)
  useEffect(() => {
    if (task && ['accepted', 'pickup', 'in_transit'].includes(task.driver_status)) {
      console.log('[TadGoTask] Starting tracking for status:', task.driver_status);
      startTracking();
    }
  }, [task?.driver_status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('worker_transfers')
        .select(`
          *,
          worker:workers(name, center_ref, nationality_code)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setTask(data as any);
    } catch (error: any) {
      console.error('Error fetching task:', error);
      toast({
        title: "Error",
        description: "Failed to load task details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex < STATUS_FLOW.length - 1) {
      return STATUS_FLOW[currentIndex + 1];
    }
    return null;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Accept Task';
      case 'accepted': return 'Start Pickup';
      case 'pickup': return 'Start Transit';
      case 'in_transit': return 'Mark Delivered';
      case 'delivered': return 'Complete Task';
      default: return 'Update';
    }
  };

  const handleUpdateStatus = async () => {
    if (!task) return;
    
    const nextStatus = getNextStatus(task.driver_status);
    if (!nextStatus) return;

    try {
      setUpdating(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        driver_status: nextStatus,
      };

      // Set appropriate timestamp
      if (nextStatus === 'accepted') {
        updateData.driver_id = user?.id;
        updateData.accepted_at = new Date().toISOString();
      } else if (nextStatus === 'pickup') {
        updateData.pickup_at = new Date().toISOString();
      } else if (nextStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      } else if (nextStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('worker_transfers')
        .update(updateData)
        .eq('id', task.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Task is now: ${nextStatus.replace('_', ' ')}`,
      });

      fetchTask();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${task.id}-proof-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('tadgo-proofs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tadgo-proofs')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('worker_transfers')
        .update({ proof_photo_url: publicUrl })
        .eq('id', task.id);

      if (updateError) throw updateError;

      toast({
        title: "Photo Uploaded",
        description: "Proof photo has been saved",
      });

      fetchTask();
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const openMaps = (location: string, lat?: number | null, lng?: number | null) => {
    // Use coordinates if available for precise navigation
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else {
      const encodedLocation = encodeURIComponent(location + ", Dubai, UAE");
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-slate-500';
      case 'accepted': return 'bg-blue-500';
      case 'pickup': return 'bg-yellow-500';
      case 'in_transit': return 'bg-purple-500';
      case 'delivered': return 'bg-emerald-500';
      case 'completed': return 'bg-green-600';
      default: return 'bg-slate-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Task not found</p>
      </div>
    );
  }

  const nextStatus = getNextStatus(task.driver_status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-10 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/tadgo/app')}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white">{task.title || task.transfer_number}</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-400">{task.transfer_number} • {task.transfer_type}</p>
                {isTracking ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <Radio className="w-3 h-3 animate-pulse" />
                    Live
                  </span>
                ) : (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-xs text-yellow-400 h-6 px-2"
                    onClick={startTracking}
                  >
                    Start GPS
                  </Button>
                )}
                {locationError && (
                  <span className="text-xs text-red-400 max-w-[150px] truncate">GPS: {locationError}</span>
                )}
              </div>
            </div>
            <Badge className={`${getStatusColor(task.driver_status)} text-white`}>
              {task.driver_status?.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Status Timeline */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {STATUS_FLOW.map((status, index) => {
                const isActive = STATUS_FLOW.indexOf(task.driver_status) >= index;
                const isCurrent = task.driver_status === status;
                return (
                  <div key={status} className="flex items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                      ${isActive ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-500'}
                      ${isCurrent ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-800' : ''}
                    `}>
                      {index + 1}
                    </div>
                    {index < STATUS_FLOW.length - 1 && (
                      <div className={`w-6 h-1 mx-1 ${isActive ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Worker Info */}
        {task.worker && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Worker Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">{task.worker.name}</p>
                  <p className="text-sm text-slate-400">
                    {task.worker.center_ref} • {task.worker.nationality_code}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Locations */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-1">PICKUP FROM</p>
                <p className="text-white font-medium">{task.from_location}</p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-emerald-500 text-emerald-400"
                onClick={() => openMaps(task.from_location, task.from_lat, task.from_lng)}
              >
                <Navigation className="w-4 h-4" />
              </Button>
            </div>

            <div className="border-l-2 border-dashed border-slate-700 ml-5 h-4" />

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-1">DELIVER TO</p>
                <p className="text-white font-medium">
                  {task.to_location || (task.gmap_link ? 'See Google Maps Link' : 'Not specified')}
                </p>
                {task.client_name && (
                  <p className="text-sm text-slate-400">{task.client_name}</p>
                )}
              </div>
              {/* Only show navigation button if we have coordinates or to_location (not just gmap_link) */}
              {(task.to_location || (task.to_lat && task.to_lng)) && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-red-500 text-red-400"
                  onClick={() => openMaps(task.to_location || '', task.to_lat, task.to_lng)}
                >
                  <Navigation className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Google Maps Link */}
        {task.gmap_link && (
          <Card className="bg-blue-900/30 border-blue-500/50">
            <CardContent className="p-4">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => window.open(task.gmap_link!, '_blank')}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Open Client's Google Maps Link
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Schedule */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-white">
                  {format(new Date(task.transfer_date), 'EEEE, MMMM d, yyyy')}
                </p>
                {task.transfer_time && (
                  <p className="text-sm text-emerald-400">At {task.transfer_time}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {task.notes && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white">{task.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Proof Photo */}
        {task.driver_status !== 'pending' && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Proof of Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              {task.proof_photo_url ? (
                <img 
                  src={task.proof_photo_url} 
                  alt="Proof" 
                  className="w-full rounded-lg"
                />
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    className="w-full border-dashed border-slate-600 text-slate-400 h-24"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-5 h-5 mr-2" />
                        Take Photo
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Button */}
        {nextStatus && (
          <Button 
            className="w-full h-14 text-lg bg-emerald-500 hover:bg-emerald-600"
            onClick={handleUpdateStatus}
            disabled={updating}
          >
            {updating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {task.driver_status === 'pickup' && <Truck className="w-5 h-5 mr-2" />}
                {task.driver_status === 'in_transit' && <CheckCircle2 className="w-5 h-5 mr-2" />}
                {task.driver_status === 'delivered' && <CheckCircle2 className="w-5 h-5 mr-2" />}
                {getStatusLabel(task.driver_status)}
              </>
            )}
          </Button>
        )}

        {task.driver_status === 'completed' && (
          <div className="text-center py-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-3" />
            <p className="text-xl font-semibold text-white">Task Completed!</p>
            <p className="text-slate-400">Great work, driver!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TadGoTaskDetail;
