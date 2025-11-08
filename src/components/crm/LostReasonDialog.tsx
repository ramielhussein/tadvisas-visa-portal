import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface LostReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  leadName: string;
}

export const LostReasonDialog = ({
  open,
  onOpenChange,
  onConfirm,
  leadName,
}: LostReasonDialogProps) => {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason.trim() || "No reason provided");
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Lead as LOST</DialogTitle>
          <DialogDescription>
            You're about to mark "{leadName}" as LOST. Please provide a reason:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for marking as LOST</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Found another provider, Budget constraints, No longer interested..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            Note: This lead will be unassigned and returned to the incoming pool. It will be marked
            as "Previously Lost" if picked up again.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Mark as LOST
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
