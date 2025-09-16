import { FileText, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FloatingButtons = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex gap-3">
      <button
        onClick={() => navigate("/get-a-visa")}
        className="group flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-[#c9a227]/30 text-[#c9a227] px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-[#c9a227]/10 transition-all transform hover:scale-105"
      >
        <FileText className="w-5 h-5" />
        <span className="font-semibold">Apply for a Maid Visa</span>
      </button>
      <button
        onClick={() => navigate("/hire-a-maid")}
        className="group flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-[#c9a227]/30 text-[#c9a227] px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-[#c9a227]/10 transition-all transform hover:scale-105"
      >
        <Users className="w-5 h-5" />
        <span className="font-semibold">Hire a Maid</span>
      </button>
    </div>
  );
};

export default FloatingButtons;