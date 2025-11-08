import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PreviouslyLostBadgeProps {
  lostBy?: string;
  lostAt?: string;
  lostReason?: string;
}

export const PreviouslyLostBadge = ({ lostBy, lostAt, lostReason }: PreviouslyLostBadgeProps) => {
  const formattedDate = lostAt
    ? new Date(lostAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Unknown date';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className="bg-orange-600 hover:bg-orange-700">
            <AlertCircle className="w-3 h-3 mr-1" />
            Previously Lost
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">Lost History</p>
            <p className="text-sm">When: {formattedDate}</p>
            {lostBy && <p className="text-sm">By: {lostBy}</p>}
            {lostReason && (
              <p className="text-sm">
                Reason: <span className="italic">{lostReason}</span>
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
