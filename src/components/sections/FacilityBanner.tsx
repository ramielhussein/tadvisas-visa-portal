const FacilityBanner = () => {
  return (
    <section className="w-full bg-muted/50 border-y border-border">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <div>
              <p className="text-sm text-muted-foreground font-medium">MOHRE Facility Number</p>
              <p className="text-2xl font-bold text-foreground">1909607</p>
            </div>
            <div className="hidden sm:block h-10 w-px bg-border" />
            <div>
              <p className="text-lg font-bold text-foreground">TADMAIDS DOMESTIC WORKERS SERVICES CENTER L.L.C</p>
              <p className="text-base font-semibold text-muted-foreground" dir="rtl">مركز تادمايدز لخدمات العمالة المساعدة ش.ذ.م.م</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>📍 Khabaisi, Dubai</span>
            <span className="hidden sm:inline">|</span>
            <span>📧 joseph@tadmaids.com</span>
            <span className="hidden sm:inline">|</span>
            <span>📞 056 168 4669</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FacilityBanner;
