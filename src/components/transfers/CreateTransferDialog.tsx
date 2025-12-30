import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, Truck, FileText, Users, MapPin, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import LocationSearch from "@/components/mapbox/LocationSearch";

interface CreateTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type TransferCategory = "TRANSPORT" | "ADMIN" | "HR";
type HRSubtype = "ATTEND_MEDICAL" | "TAWJEEH" | "BIOMETRICS" | "PASSPORT_DELIVERY";

const HR_SUBTYPES: { value: HRSubtype; label: string }[] = [
  { value: "ATTEND_MEDICAL", label: "Attend Medical" },
  { value: "TAWJEEH", label: "Tawjeeh" },
  { value: "BIOMETRICS", label: "Biometrics" },
  { value: "PASSPORT_DELIVERY", label: "Passport Delivery" },
];

// Available drivers for assignment
const AVAILABLE_DRIVERS = [
  { id: "9aa615f1-1aba-4c6d-8038-c11246e6d650", name: "Nagath" },
  { id: "496c8a50-7828-4fee-b4e5-030ae7338455", name: "Yasin" },
  { id: "5af01730-5863-473f-b7be-e2261e6e22fa", name: "Mohd Talal" },
];

const CreateTransferDialog = ({ open, onOpenChange, onSuccess }: CreateTransferDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [category, setCategory] = useState<TransferCategory>("TRANSPORT");
  const [hrSubtype, setHRSubtype] = useState<HRSubtype | "">("");
  const [adminDetails, setAdminDetails] = useState("");
  
  const [searchWorkerQuery, setSearchWorkerQuery] = useState("");
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [gmapLink, setGmapLink] = useState("");
  
  const [fromLocation, setFromLocation] = useState({ address: "", lat: 0, lng: 0 });
  const [toLocation, setToLocation] = useState({ address: "", lat: 0, lng: 0 });
  
  const [formData, setFormData] = useState({
    title: "",
    transfer_date: format(new Date(), "yyyy-MM-dd"),
    transfer_time: "",
    notes: "",
  });

  const searchWorkers = async (query: string) => {
    if (query.length < 2) {
      setWorkers([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("workers")
        .select("id, name, center_ref, nationality_code")
        .or(`name.ilike.%${query}%,center_ref.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;
      setWorkers(data || []);
    } catch (error) {
      console.error("Error searching workers:", error);
    }
  };

  const notifyTransferCreated = async (transferId: string, transferNumber: string, assignedDriverId?: string) => {
    try {
      // Call the notify-transfer edge function to notify managers
      await supabase.functions.invoke('notify-transfer', {
        body: {
          transferId,
          eventType: 'created',
          transferNumber,
          pickupLocation: fromLocation.address,
          dropoffLocation: toLocation.address,
          gmapLink: gmapLink || undefined,
        }
      });
      console.log('Managers notified about new transfer');

      // If a driver is assigned, also notify them
      if (assignedDriverId) {
        await supabase.functions.invoke('notify-transfer', {
          body: {
            transferId,
            eventType: 'assigned',
            driverId: assignedDriverId,
            transferNumber,
            pickupLocation: fromLocation.address,
            dropoffLocation: toLocation.address,
            gmapLink: gmapLink || undefined,
          }
        });
        console.log('Driver notified about assignment');
      }
    } catch (error) {
      console.error("Error notifying about transfer:", error);
    }
  };

  const handleCreateTransfer = async () => {
    if (category === "HR" && !hrSubtype) {
      toast({
        title: "Error",
        description: "Please select an HR task type",
        variant: "destructive",
      });
      return;
    }

    if (category === "ADMIN" && !adminDetails.trim()) {
      toast({
        title: "Error",
        description: "Please enter admin task details",
        variant: "destructive",
      });
      return;
    }

    if (!fromLocation.address || !toLocation.address) {
      toast({
        title: "Error",
        description: "Please select both from and to locations",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Let database generate transfer_number automatically via default
      const { data: newTransfer, error } = await supabase.from("worker_transfers").insert({
        title: formData.title.trim() || null,
        worker_id: selectedWorker?.id || null,
        from_location: fromLocation.address,
        to_location: toLocation.address,
        from_lat: fromLocation.lat || null,
        from_lng: fromLocation.lng || null,
        to_lat: toLocation.lat || null,
        to_lng: toLocation.lng || null,
        transfer_date: formData.transfer_date,
        transfer_time: formData.transfer_time || null,
        transfer_type: "Internal",
        transfer_category: category,
        hr_subtype: category === "HR" ? hrSubtype : null,
        admin_details: category === "ADMIN" ? adminDetails : null,
        notes: formData.notes || null,
        handled_by: user.id,
        gmap_link: gmapLink.trim() || null,
        driver_id: selectedDriverId && selectedDriverId !== "unassigned" ? selectedDriverId : null,
        driver_status: selectedDriverId && selectedDriverId !== "unassigned" ? "accepted" : "pending",
      }).select("id, transfer_number").single();

      if (error) throw error;

      // Notify managers about the new transfer and driver if assigned
      const driverToNotify = selectedDriverId && selectedDriverId !== "unassigned" ? selectedDriverId : undefined;
      await notifyTransferCreated(newTransfer?.id || "", newTransfer?.transfer_number || "", driverToNotify);

      toast({
        title: "Success",
        description: "Transfer request created and drivers notified",
      });

      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error("Error creating transfer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create transfer request",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setStep(1);
    setCategory("TRANSPORT");
    setHRSubtype("");
    setAdminDetails("");
    setSelectedWorker(null);
    setSearchWorkerQuery("");
    setWorkers([]);
    setFromLocation({ address: "", lat: 0, lng: 0 });
    setToLocation({ address: "", lat: 0, lng: 0 });
    setSelectedDriverId("");
    setGmapLink("");
    setFormData({
      title: "",
      transfer_date: format(new Date(), "yyyy-MM-dd"),
      transfer_time: "",
      notes: "",
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Select Transfer Type" : "Transfer Details"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-6 py-4">
            {/* Category Selection */}
            <RadioGroup
              value={category}
              onValueChange={(val) => {
                setCategory(val as TransferCategory);
                setHRSubtype("");
                setAdminDetails("");
              }}
              className="grid grid-cols-1 gap-4"
            >
              <Label
                htmlFor="transport"
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  category === "TRANSPORT" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="TRANSPORT" id="transport" />
                <Truck className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-medium">Transport</p>
                  <p className="text-sm text-muted-foreground">Standard worker transport between locations</p>
                </div>
              </Label>

              <Label
                htmlFor="admin"
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  category === "ADMIN" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="ADMIN" id="admin" />
                <FileText className="w-6 h-6 text-orange-500" />
                <div>
                  <p className="font-medium">Admin</p>
                  <p className="text-sm text-muted-foreground">Administrative tasks with custom details</p>
                </div>
              </Label>

              <Label
                htmlFor="hr"
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  category === "HR" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="HR" id="hr" />
                <Users className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="font-medium">HR</p>
                  <p className="text-sm text-muted-foreground">HR-related tasks and appointments</p>
                </div>
              </Label>
            </RadioGroup>

            {/* Admin Details */}
            {category === "ADMIN" && (
              <div className="space-y-2 animate-in fade-in">
                <Label>Admin Task Details *</Label>
                <Textarea
                  value={adminDetails}
                  onChange={(e) => setAdminDetails(e.target.value)}
                  placeholder="Describe the admin task..."
                  rows={3}
                />
              </div>
            )}

            {/* HR Subtype Selection */}
            {category === "HR" && (
              <div className="space-y-3 animate-in fade-in">
                <Label>HR Task Type *</Label>
                <RadioGroup
                  value={hrSubtype}
                  onValueChange={(val) => setHRSubtype(val as HRSubtype)}
                  className="grid grid-cols-2 gap-3"
                >
                  {HR_SUBTYPES.map((subtype) => (
                    <Label
                      key={subtype.value}
                      htmlFor={subtype.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        hrSubtype === subtype.value 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                          : "border-border hover:border-blue-300"
                      }`}
                    >
                      <RadioGroupItem value={subtype.value} id={subtype.value} />
                      <span className="text-sm font-medium">{subtype.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            )}

            <Button 
              onClick={() => setStep(2)} 
              className="w-full"
              disabled={
                (category === "ADMIN" && !adminDetails.trim()) ||
                (category === "HR" && !hrSubtype)
              }
            >
              Continue
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Category Badge */}
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              {category === "TRANSPORT" && <Truck className="w-4 h-4" />}
              {category === "ADMIN" && <FileText className="w-4 h-4 text-orange-500" />}
              {category === "HR" && <Users className="w-4 h-4 text-blue-500" />}
              <span className="font-medium">
                {category}
                {hrSubtype && ` - ${HR_SUBTYPES.find(s => s.value === hrSubtype)?.label}`}
              </span>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setStep(1)}>
                Change
              </Button>
            </div>

            {adminDetails && (
              <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg text-sm">
                <span className="font-medium">Details:</span> {adminDetails}
              </div>
            )}

            {/* Task Title */}
            <div className="space-y-2">
              <Label>Task Title <span className="text-muted-foreground text-xs">(for quick identification)</span></Label>
              <Input
                placeholder="e.g., Airport Pickup - Maria"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Worker Selection (Optional) */}
            <div className="space-y-2">
              <Label>Worker <span className="text-muted-foreground text-xs">(optional)</span></Label>
              {selectedWorker ? (
                <div className="p-3 bg-primary/10 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedWorker.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedWorker.center_ref}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedWorker(null)}>
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search workers by name or reference..."
                    value={searchWorkerQuery}
                    onChange={(e) => {
                      setSearchWorkerQuery(e.target.value);
                      searchWorkers(e.target.value);
                    }}
                    className="pl-10"
                  />
                  {workers.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {workers.map((worker) => (
                        <div
                          key={worker.id}
                          className="p-3 hover:bg-accent cursor-pointer border-b last:border-0"
                          onClick={() => {
                            setSelectedWorker(worker);
                            setSearchWorkerQuery("");
                            setWorkers([]);
                          }}
                        >
                          <p className="font-medium">{worker.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {worker.center_ref} • {worker.nationality_code}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Location Search with Map */}
            <LocationSearch
              label="From Location *"
              value={fromLocation.address}
              onChange={(address, lat, lng) => setFromLocation({ address, lat: lat || 0, lng: lng || 0 })}
              placeholder="Search pickup location..."
            />

            <LocationSearch
              label="To Location *"
              value={toLocation.address}
              onChange={(address, lat, lng) => setToLocation({ address, lat: lat || 0, lng: lng || 0 })}
              placeholder="Search destination..."
            />

            {/* Google Maps Link */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" />
                Google Maps Link <span className="text-muted-foreground text-xs">(paste client's gmap link)</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://maps.google.com/..."
                  value={gmapLink}
                  onChange={(e) => setGmapLink(e.target.value)}
                  className="flex-1"
                />
                {gmapLink && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(gmapLink, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Driver Assignment */}
            <div className="space-y-2">
              <Label>Assign Driver <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a driver to assign..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Leave Unassigned</SelectItem>
                  {AVAILABLE_DRIVERS.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Date *</Label>
                <Input
                  type="date"
                  value={formData.transfer_date}
                  onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Service Time</Label>
                <Input
                  type="time"
                  value={formData.transfer_time}
                  onChange={(e) => setFormData({ ...formData, transfer_time: e.target.value })}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Instructions / Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Add any additional instructions..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateTransfer} className="flex-1">
                Create Transfer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateTransferDialog;
