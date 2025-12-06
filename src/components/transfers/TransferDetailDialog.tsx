import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { 
  MapPin, 
  Clock, 
  User, 
  Truck, 
  FileText, 
  Users, 
  CheckCircle2, 
  Phone, 
  Car,
  Image as ImageIcon,
  ExternalLink
} from "lucide-react";
import AuthorizedDriverLocationMap from "@/components/mapbox/AuthorizedDriverLocationMap";

interface TransferDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: any;
}

const TransferDetailDialog = ({ open, onOpenChange, transfer }: TransferDetailDialogProps) => {
  if (!transfer) return null;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in transit":
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "accepted":
        return "bg-indigo-100 text-indigo-800";
      case "pickup":
        return "bg-orange-100 text-orange-800";
      case "delivered":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case "ADMIN":
        return <FileText className="w-5 h-5 text-orange-500" />;
      case "HR":
        return <Users className="w-5 h-5 text-blue-500" />;
      default:
        return <Truck className="w-5 h-5 text-primary" />;
    }
  };

  const formatHRSubtype = (subtype: string | null) => {
    if (!subtype) return "";
    const labels: Record<string, string> = {
      ATTEND_MEDICAL: "Attend Medical",
      TAWJEEH: "Tawjeeh",
      BIOMETRICS: "Biometrics",
      PASSPORT_DELIVERY: "Passport Delivery",
    };
    return labels[subtype] || subtype;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getCategoryIcon(transfer.transfer_category)}
            <span>{transfer.title || transfer.transfer_number || transfer.id.slice(0, 8)}</span>
            {transfer.driver_status && (
              <Badge className={getStatusColor(transfer.driver_status)}>
                {transfer.driver_status.replace('_', ' ')}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title & Category */}
          {transfer.title && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Task Title</p>
              <p className="font-medium">{transfer.title}</p>
            </div>
          )}

          {/* Category Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">
              {transfer.transfer_category || "TRANSPORT"}
              {transfer.hr_subtype && ` - ${formatHRSubtype(transfer.hr_subtype)}`}
            </Badge>
            <span className="text-sm text-muted-foreground">
              #{transfer.transfer_number || transfer.id.slice(0, 8)}
            </span>
          </div>

          {/* Admin Details */}
          {transfer.admin_details && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/30">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Admin Task Details</p>
                <p className="text-sm mt-1">{transfer.admin_details}</p>
              </CardContent>
            </Card>
          )}

          {/* Worker Info */}
          {transfer.worker && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Worker</p>
                </div>
                <p className="mt-1">{transfer.worker.name}</p>
                <p className="text-sm text-muted-foreground">{transfer.worker.center_ref}</p>
              </CardContent>
            </Card>
          )}

          {/* Locations */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="font-medium">{transfer.from_location}</p>
                </div>
              </div>
              <div className="border-l-2 border-dashed ml-2 h-4" />
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">To</p>
                  <p className="font-medium">{transfer.to_location}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{format(new Date(transfer.transfer_date), "PPP")}</span>
            </div>
            {transfer.transfer_time && (
              <span className="text-muted-foreground">at {transfer.transfer_time}</span>
            )}
          </div>

          {/* Driver Assignment */}
          {transfer.driver_id && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium">Assigned Driver</p>
                </div>
                <p className="font-medium">{transfer.driver?.full_name || "Driver"}</p>
                {transfer.driver?.email && (
                  <p className="text-sm text-muted-foreground">{transfer.driver.email}</p>
                )}
                {transfer.vehicle_number && (
                  <p className="text-sm mt-1">
                    <span className="text-muted-foreground">Vehicle:</span> {transfer.vehicle_number}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Real-Time Driver Location Map (Authorized Users Only) */}
          {transfer.driver_id && (
            <AuthorizedDriverLocationMap transfer={transfer} />
          )}

          {/* Timeline */}
          {(transfer.accepted_at || transfer.pickup_at || transfer.delivered_at || transfer.completed_at) && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm font-medium mb-3">Task Timeline</p>
                <div className="space-y-2">
                  {transfer.accepted_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                      <span className="font-medium">Accepted:</span>
                      <span className="text-muted-foreground">
                        {format(new Date(transfer.accepted_at), "PPp")}
                      </span>
                    </div>
                  )}
                  {transfer.pickup_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-orange-500" />
                      <span className="font-medium">Pickup:</span>
                      <span className="text-muted-foreground">
                        {format(new Date(transfer.pickup_at), "PPp")}
                      </span>
                    </div>
                  )}
                  {transfer.delivered_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium">Delivered:</span>
                      <span className="text-muted-foreground">
                        {format(new Date(transfer.delivered_at), "PPp")}
                      </span>
                    </div>
                  )}
                  {transfer.completed_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="font-medium">Completed:</span>
                      <span className="text-muted-foreground">
                        {format(new Date(transfer.completed_at), "PPp")}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {transfer.notes && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{transfer.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Proof Photo */}
          {transfer.proof_photo_url && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Proof of Delivery
                    </p>
                  </div>
                  <a 
                    href={transfer.proof_photo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Photo
                    </Button>
                  </a>
                </div>
                <img 
                  src={transfer.proof_photo_url} 
                  alt="Proof of delivery"
                  className="mt-3 rounded-lg max-h-48 object-cover w-full"
                />
              </CardContent>
            </Card>
          )}

          {/* Created Info */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Created: {format(new Date(transfer.created_at), "PPp")}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransferDetailDialog;
