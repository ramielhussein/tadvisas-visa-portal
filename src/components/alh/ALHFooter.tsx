const ALHFooter = () => {
  return (
    <footer id="footer" className="bg-[#1E1E1E] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-[#F58220]">ALH Properties</h3>
            <p className="text-[#B6BBC4] text-sm">
              Premium real estate solutions in the UAE
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 text-[#F58220]">TADMAIDS</h3>
            <p className="text-[#B6BBC4] text-sm">
              UAE's 5-Star Domestic Workforce Brand<br />
              MOHRE Licensed & Insured
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 text-[#F58220]">Contact</h3>
            <div className="space-y-2 text-[#B6BBC4] text-sm">
              <p>Phone: +971 4 355 1186</p>
              <p>WhatsApp: +971 56 582 2258</p>
              <p>Email: info@tadmaids.com</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#4A4A4A] pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[#B6BBC4] text-sm text-center md:text-left">
              © {new Date().getFullYear()} ALH Properties × TADMAIDS. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-[#B6BBC4] hover:text-white transition-colors">
                Terms & Conditions
              </a>
              <a href="#" className="text-[#B6BBC4] hover:text-white transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>

          <p className="text-xs text-[#B6BBC4] mt-6 text-center max-w-5xl mx-auto">
            Buyer perk delivered as a service credit redeemable against eligible services (P1 Direct-Hire / P4 monthly). 
            Not a promise to employ or sponsor a worker. Services are subject to scheduling, availability, and PDPL-compliant consent.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default ALHFooter;
