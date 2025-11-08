import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";

interface AssignPreviouslyLostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  leadName: string;
  lostBy?: string;
  lostAt?: string;
  lostReason?: string;
}

export const AssignPreviouslyLostDialog = ({
  open,
  onOpenChange,
  onConfirm,
  leadName,
  lostBy,
  lostAt,
  lostReason,
}: AssignPreviouslyLostDialogProps) => {
  const formattedDate = lostAt
    ? new Date(lostAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Unknown date';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Previously Lost Lead
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This lead "<strong>{leadName}</strong>" was previously marked as LOST.
            </p>
            <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
              <p>
                <strong>Lost Date:</strong> {formattedDate}
              </p>
              {lostBy && (
                <p>
                  <strong>Lost By:</strong> {lostBy}
                </p>
              )}
              {lostReason && (
                <p>
                  <strong>Reason:</strong> <span className="italic">{lostReason}</span>
                </p>
              )}
            </div>
            <p className="text-foreground">
              Are you sure you want to assign this lead to yourself?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Yes, Assign to Me
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
