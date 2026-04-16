import mohreBanner from "@/assets/mohre-banner.jpg";

const FacilityBanner = () => {
  return (
    <section className="w-full border-y border-border">
      {/* Header Banner with background image */}
      <div
        className="relative bg-cover bg-center py-10 lg:py-14"
        style={{ backgroundImage: `url(${mohreBanner})` }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <h2 className="relative z-10 text-center text-3xl lg:text-5xl font-light text-white tracking-wide">
          Approved Services Centers Details
        </h2>
      </div>

      {/* Facility Info */}
      <div className="bg-white px-4 py-6 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-bold text-foreground mb-1">Facility Number: 1909607</p>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <h3 className="text-xl lg:text-2xl font-bold text-foreground">
              TADMAIDS DOMESTIC WORKERS SERVICES CENTER L.L.C
            </h3>
            <p className="text-xl lg:text-2xl font-semibold text-muted-foreground" dir="rtl">
              مركز تادمايدز لخدمات العمالة المساعدة ش.ذ.م.م
            </p>
          </div>
        </div>
      </div>

      {/* Address + Map */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Address Details */}
          <div className="bg-white rounded-lg border border-border p-6 space-y-4">
            <div className="flex gap-4">
              <span className="text-muted-foreground font-medium min-w-[100px]">Address:</span>
              <span className="text-foreground">Khabaisi</span>
            </div>
            <div className="flex gap-4">
              <span className="text-muted-foreground font-medium min-w-[100px]">Emirate:</span>
              <span className="text-foreground">Dubai</span>
            </div>
            <div className="flex gap-4">
              <span className="text-muted-foreground font-medium min-w-[100px]">City:</span>
              <span className="text-foreground">Dubai</span>
            </div>
            <div className="flex gap-4">
              <span className="text-muted-foreground font-medium min-w-[100px]">Telephone:</span>
              <a href="tel:+97156168469" className="text-foreground hover:text-primary flex items-center gap-2">
                📞 056 168 4669
              </a>
            </div>
            <div className="flex gap-4">
              <span className="text-muted-foreground font-medium min-w-[100px]">Email:</span>
              <a href="mailto:joseph@tadmaids.com" className="text-foreground hover:text-primary">
                joseph@tadmaids.com
              </a>
            </div>
            <div className="pt-2">
              <a
                href="https://maps.google.com/?q=25.2631,55.3367"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Directions
              </a>
            </div>
          </div>

          {/* Google Map */}
          <div className="rounded-lg overflow-hidden border border-border min-h-[300px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.5!2d55.3367!3d25.2631!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDE1JzQ3LjIiTiA1NcKwMjAnMTIuMSJF!5e0!3m2!1sen!2sae!4v1"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "300px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="TADMAIDS location map"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FacilityBanner;
