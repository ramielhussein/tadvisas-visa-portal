import visaWhatsApp from "@/assets/visa-whatsapp.png";

const TopBanner = () => {

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Hello! I want to apply for my maid's visa online.");
    window.open(`https://wa.me/971508882480?text=${message}`, "_blank");
  };

  return (
    <>
      <section className="relative w-full bg-white overflow-hidden">
        <div className="container mx-auto px-4 py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Left side - WhatsApp visa confirmation */}
            <div className="relative w-full lg:w-1/2 h-[400px] lg:h-[500px] overflow-hidden">
              <img
                src={visaWhatsApp}
                alt="TadMaids visa WhatsApp confirmation"
                className="w-full h-full object-contain animate-slide-up"
              />
            </div>

            {/* Right side - Call to action */}
            <div className="w-full lg:w-1/2 text-center lg:text-left space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Apply for Your Maid's Visa in <span className="text-primary">5 Minutes</span>
              </h2>
              <p className="text-muted-foreground text-base">
                Just send us your maid's passport through WhatsApp and get it done in 1 week!
              </p>
              <div className="hidden md:flex items-center gap-6 justify-center lg:justify-start text-sm text-muted-foreground mt-4">
                <span className="flex items-center gap-1">
                  ✅ Licensed by DLD
                </span>
                <span className="flex items-center gap-1">
                  ⚡ 1 Week Processing
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default TopBanner;