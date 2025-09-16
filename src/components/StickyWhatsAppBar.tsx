import { MessageCircle } from "lucide-react";

const StickyWhatsAppBar = () => {
  const handleWhatsAppClick = () => {
    const phoneNumber = "971508499064";
    const message = "Hi, I need help with visa and maid services";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="sticky top-16 z-40 bg-green-500 hover:bg-green-600 transition-colors shadow-md">
      <button
        onClick={handleWhatsAppClick}
        className="w-full px-4 py-2 flex items-center justify-center gap-2 text-white font-semibold"
      >
        <MessageCircle className="w-5 h-5" fill="currentColor" />
        <span>WhatsApp Now</span>
      </button>
    </div>
  );
};

export default StickyWhatsAppBar;