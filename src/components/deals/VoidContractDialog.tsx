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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle } from "lucide-react";

interface VoidContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workerName: string | null;
  onConfirm: (workerStatus: string | null) => void;
  isLoading?: boolean;
}

const WORKER_STATUS_OPTIONS = [
  { value: "Available", label: "Available", description: "Worker can be assigned to new contracts" },
  { value: "Absconded", label: "Absconded", description: "Worker has absconded/run away" },
  { value: "Returned", label: "Returned", description: "Worker has been returned to supplier" },
  { value: "On Hold", label: "On Hold", description: "Worker is temporarily unavailable" },
  { value: "keep", label: "Keep Current Status", description: "Don't change the worker's status" },
];

const VoidContractDialog = ({
  open,
  onOpenChange,
  workerName,
  onConfirm,
  isLoading = false,
}: VoidContractDialogProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string>("Available");

  const handleConfirm = () => {
    onConfirm(selectedStatus === "keep" ? null : selectedStatus);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Void Contract
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The contract will be marked as void.
          </DialogDescription>
        </DialogHeader>

        {workerName && (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Worker: {workerName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                What should happen to this worker?
              </p>
            </div>

            <RadioGroup
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              className="space-y-2"
            >
              {WORKER_STATUS_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedStatus(option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {!workerName && (
          <p className="text-sm text-muted-foreground">
            No worker is assigned to this contract.
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Voiding..." : "Void Contract"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoidContractDialog;
