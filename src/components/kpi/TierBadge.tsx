import { Trophy, Medal, Award } from "lucide-react";
import { TierLevel } from "@/hooks/useSalesKPIs";

interface TierBadgeProps {
  level: TierLevel;
  size?: "sm" | "md" | "lg";
}

export const TierBadge = ({ level, size = "md" }: TierBadgeProps) => {
  if (level === 'none') return null;

  const iconSize = size === "sm" ? 14 : size === "md" ? 16 : 20;
  const textSize = size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base";

  const config = {
    gold: {
      icon: Trophy,
      label: "Gold",
      className: "text-yellow-500",
      bgClass: "bg-yellow-500/10",
    },
    silver: {
      icon: Medal,
      label: "Silver",
      className: "text-gray-400",
      bgClass: "bg-gray-400/10",
    },
    bronze: {
      icon: Award,
      label: "Bronze",
      className: "text-orange-600",
      bgClass: "bg-orange-600/10",
    },
  };

  const tierConfig = config[level];
  const Icon = tierConfig.icon;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${tierConfig.bgClass}`}>
      <Icon className={tierConfig.className} size={iconSize} />
      <span className={`${textSize} font-semibold ${tierConfig.className}`}>
        {tierConfig.label}
      </span>
    </div>
  );
};
