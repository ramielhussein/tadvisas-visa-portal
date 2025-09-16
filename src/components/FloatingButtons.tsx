import { FileText, Users } from "lucide-react";

const FloatingButtons = () => {
  const handleMaidVisaClick = () => {
    const phoneNumber = "971567222248";
    const message = "Hi, I need help with maid visa services";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleHireMaidClick = () => {
    const phoneNumber = "971565822258";
    const message = "Hi, I need help hiring a maid";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-nowrap gap-3 whitespace-nowrap">
      <button
        onClick={handleMaidVisaClick}
        className="group shrink-0 flex items-center gap-2 bg-white backdrop-blur-sm border border-[#c9a227]/30 text-[#c9a227] px-3 py-2 md:px-5 md:py-3 rounded-none md:rounded-full shadow-lg hover:shadow-xl hover:bg-[#c9a227]/10 transition-all transform hover:scale-105 whitespace-nowrap"
      >
        <FileText className="w-4 h-4" />
        <span className="text-xs font-semibold">Apply for a Maid Visa</span>
      </button>
      <button
        onClick={handleHireMaidClick}
        className="group shrink-0 flex items-center gap-2 bg-white backdrop-blur-sm border border-[#0f73bd]/30 text-[#0f73bd] px-3 py-2 md:px-5 md:py-3 rounded-none md:rounded-full shadow-lg hover:shadow-xl hover:bg-[#0f73bd]/10 transition-all transform hover:scale-105 whitespace-nowrap"
      >
        <Users className="w-4 h-4" />
        <span className="text-xs font-semibold">Hire a Maid</span>
      </button>
    </div>
  );
};

export default FloatingButtons;