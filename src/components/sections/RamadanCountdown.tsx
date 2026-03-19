import { Star } from "lucide-react";

const RamadanCountdown = () => {
  return (
    <div className="relative inline-flex items-center gap-3 text-white px-5 py-2.5 rounded-full shadow-lg overflow-hidden">
      {/* UAE flag stripe background */}
      <div className="absolute inset-0 flex">
        <div className="w-1/4 bg-[#00732F]" />
        <div className="w-1/4 bg-white" />
        <div className="w-1/4 bg-black" />
        <div className="w-1/4 bg-[#FF0000]" />
      </div>
      <div className="absolute inset-0 bg-black/50 rounded-full" />
      <Star className="relative z-10 w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" />
      <span className="relative z-10 text-lg font-bold tracking-wide text-yellow-300">
        EID MUBARAK 2026
      </span>
      <Star className="relative z-10 w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" />
    </div>
  );
};

export default RamadanCountdown;
