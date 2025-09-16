import visaWhatsApp from "@/assets/visa-whatsapp.png";

const TopBanner = () => {

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Hello! I want to apply for my maid's visa online.");
    window.open(`https://wa.me/971508882480?text=${message}`, "_blank");
  };

  return (
    <section className="relative w-full bg-white overflow-hidden">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left side - WhatsApp visa confirmation */}
          <div className="relative w-full lg:w-1/2 h-[400px] lg:h-[500px]">
            <img
              src={visaWhatsApp}
              alt="TadMaids visa WhatsApp confirmation"
              className="w-full h-full object-contain animate-vibrate"
            />
          </div>

          {/* Right side - Call to action */}
          <div className="w-full lg:w-1/2 text-center lg:text-left space-y-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
              Apply for Your Maid's Visa in <span className="text-primary">5 Minutes</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Just send us your maid's passport through WhatsApp and get it done in 1 week!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={handleWhatsAppClick}
                className="inline-flex items-center justify-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Start Now on WhatsApp
              </button>
              <button
                onClick={() => window.location.href = "/start-here"}
                className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary-glow text-primary-foreground font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Apply Online
              </button>
            </div>
            <div className="flex items-center gap-6 justify-center lg:justify-start text-sm text-muted-foreground">
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
  );
};

export default TopBanner;