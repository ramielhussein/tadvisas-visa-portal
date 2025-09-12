
import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle, X } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  const [selectedService, setSelectedService] = useState<'standard' | 'vip' | 'premium'>('standard');

  const pricingData = [
    {
      nationality: "Philippines",
      price: "3,500",
      popular: true
    },
    {
      nationality: "Indonesia",
      price: "3,200",
      popular: false
    },
    {
      nationality: "Sri Lanka",
      price: "3,800",
      popular: false
    },
    {
      nationality: "Nepal",
      price: "3,600",
      popular: false
    },
    {
      nationality: "Bangladesh",
      price: "3,400",
      popular: false
    },
    {
      nationality: "India",
      price: "3,700",
      popular: false
    }
  ];

  const standardIncluded = [
    "Complete visa processing",
    "Direct Debit for WPS salary Process",
    "VIP Chauffeur Service for TAWJEEH/MEDICAL/BIOMETRIC",
    "Medical examination",
    "Emirates ID processing",
    "All government fees",
    "NOC to travel with you",
    "ILOE Insurance for 2 years",
    "Legal compliance guarantee"
  ];

  const standardNotIncluded = [
    "Medical Insurance",
    "Monthly admin fees (We charge ZERO!)",
    "Hidden charges",
    "End Of service (pay your worker direct)",
    "Return Home Ticket"
  ];

  const vipIncluded = [
    "Complete visa processing",
    "Direct Debit for WPS salary Process",
    "VIP Chauffeur Service for TAWJEEH/MEDICAL/BIOMETRIC",
    "Medical examination",
    "Emirates ID processing",
    "All government fees",
    "NOC to travel with you",
    "Medical Insurance (2 years)",
    "ILOE Insurance for 2 years",
    "Legal compliance guarantee"
  ];

  const vipNotIncluded = [
    "Monthly admin fees (We charge ZERO!)",
    "Hidden charges",
    "End Of service (pay your worker direct)",
    "Return Home Ticket",
    "Fake Promises to keep you hooked"
  ];

  const premiumIncluded = [
    "Complete visa processing",
    "Direct Debit for WPS salary Process",
    "VIP Chauffeur Service for TAWJEEH/MEDICAL/BIOMETRIC",
    "Medical examination",
    "Emirates ID processing",
    "All government fees",
    "NOC to travel with you",
    "Medical Insurance (2 years)",
    "ILOE Insurance for 2 years",
    "End of Service Benefits (EOSB)",
    "Return Home Ticket",
    "Legal compliance guarantee"
  ];

  const premiumNotIncluded = [
    "Monthly admin fees (We charge ZERO!)",
    "Hidden charges",
    "Fake Promises to keep you hooked"
  ];

  const included = selectedService === 'premium' ? premiumIncluded : selectedService === 'vip' ? vipIncluded : standardIncluded;
  const notIncluded = selectedService === 'premium' ? premiumNotIncluded : selectedService === 'vip' ? vipNotIncluded : standardNotIncluded;

  return (
    <Layout>
      <div className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-6">
              Visa Pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              No hidden fees, no surprises. Our pricing is straightforward and includes everything 
              you need for your 2-year maid visa processing.
            </p>
          </div>

          {/* Zero Monthly Fees Callout */}
          <div className="bg-gradient-gold text-white rounded-2xl p-8 text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Choose what works for you</h2>
            <p className="text-xl mb-4">
              Unlike other providers who charge 150-200 AED monthly, we give you the option to pay absolutely nothing after your visa is processed! Choose the limited time option of 8925 and zero monthly fee. But be careful, this does not include medical insurance.
            </p>
            <p className="text-xl">
              Want a medical insurance? You can choose the standard service that is inclusive of 2 years medical insurance.
            </p>
          </div>

          {/* Pricing Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
            {/* Standard Service */}
            <div 
              onMouseEnter={() => setSelectedService('standard')}
              onClick={() => setSelectedService('standard')}
              className={`relative bg-white rounded-2xl p-8 shadow-lg hover-lift cursor-pointer transition-all ${
                selectedService === 'standard' 
                  ? 'border-4 border-accent scale-105' 
                  : 'border-2 border-accent hover:border-4'
              }`}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-accent text-white px-4 py-1 rounded-full text-sm font-semibold">
                  TADVISA
                </span>
              </div>
              <div className="absolute -top-3 right-4">
                <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                  Limited Time
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-primary mb-4">2 Years Maid Visa</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-primary">8,925</span>
                  <span className="text-gray-600"> AED</span>
                </div>
                <div className="mb-6">
                  <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg">
                    <p className="text-sm font-medium">Visa only. Big Saving</p>
                    <p className="text-sm font-medium">Zero Per month</p>
                  </div>
                </div>
                <Button asChild className="w-full bg-primary hover:bg-primary-700 text-white">
                  <Link to="/start-here">Get TADVISA with zero monthly</Link>
                </Button>
              </div>
            </div>

            {/* VIP Service */}
            <div 
              onMouseEnter={() => setSelectedService('vip')}
              onClick={() => setSelectedService('vip')}
              className={`relative bg-white rounded-2xl p-8 shadow-lg hover-lift cursor-pointer transition-all ${
                selectedService === 'vip' 
                  ? 'border-4 border-primary scale-105' 
                  : 'border-2 border-primary hover:border-4'
              }`}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                  TADVISA+
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-primary mb-4">2 Years Maid Visa</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-primary">8,400</span>
                  <span className="text-gray-600"> AED</span>
                </div>
                <div className="mb-6">
                  <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg">
                    <p className="text-sm font-medium">Visa & Medical Insurance</p>
                    <p className="text-sm font-medium">150 Per month</p>
                  </div>
                </div>
                <Button asChild className="w-full bg-primary hover:bg-primary-700 text-white">
                  <Link to="/start-here">Get TADVISA+ with insurance</Link>
                </Button>
              </div>
            </div>

            {/* Premium Service */}
            <div 
              onMouseEnter={() => setSelectedService('premium')}
              onClick={() => setSelectedService('premium')}
              className={`relative bg-white rounded-2xl p-8 shadow-lg hover-lift cursor-pointer transition-all ${
                selectedService === 'premium' 
                  ? 'border-4 border-yellow-500 scale-105' 
                  : 'border-2 border-yellow-500 hover:border-4'
              }`}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-gold text-white px-4 py-1 rounded-full text-sm font-semibold">
                  TADVISA++
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-primary mb-4">2 Years Maid Visa</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-primary">10,500</span>
                  <span className="text-gray-600"> AED</span>
                </div>
                <div className="mb-6">
                  <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg">
                    <p className="text-sm font-medium">Visa, Medical, EOSB & Ticket</p>
                    <p className="text-sm font-medium">168 Per month</p>
                  </div>
                </div>
                <Button asChild className="w-full bg-gradient-gold hover:bg-gradient-primary text-white">
                  <Link to="/start-here">Get TADVISA++ the premium package</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Service Selection Indicator */}
          <div className="text-center mb-8">
            <p className="text-lg text-gray-600">
              Currently viewing: <span className="font-bold text-primary">{selectedService === 'premium' ? 'TADVISA++' : selectedService === 'vip' ? 'TADVISA+' : 'TADVISA'}</span> benefits
            </p>
            <p className="text-sm text-gray-500 mt-2">Hover over or click a service box above to see what's included</p>
          </div>

          {/* What's Included/Not Included */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Included */}
            <div className="bg-green-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-primary mb-6 flex items-center">
                <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                What's Included
              </h3>
              <ul className="space-y-3">
                {included.map((item, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Not Included */}
            <div className="bg-red-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-primary mb-6 flex items-center">
                <X className="w-8 h-8 text-red-500 mr-3" />
                What is NOT included
              </h3>
              <ul className="space-y-3">
                {notIncluded.map((item, index) => (
                  <li key={index} className="flex items-center">
                    <X className="w-5 h-5 text-red-500 mr-3" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Payment Options */}
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-16">
            <h2 className="text-3xl font-bold text-primary text-center mb-8">
              Addons you can buy, only IF YOU WISH
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-6 border-2 border-gray-200 rounded-xl">
                <h4 className="text-xl font-semibold text-primary mb-3">Medical Insurance</h4>
                <p className="text-gray-600">750 One Year Medical Insurance</p>
                <p className="text-sm text-gray-500">Only with TADVISA</p>
              </div>
              <div className="text-center p-6 border-2 border-gray-200 rounded-xl">
                <h4 className="text-xl font-semibold text-primary mb-3">Medical Insurance</h4>
                <p className="text-gray-600">1500 Two Years Medical Insurance</p>
                <p className="text-sm text-gray-500">Only with TADVISA</p>
              </div>
              <div className="text-center p-6 border-2 border-gray-200 rounded-xl">
                <h4 className="text-xl font-semibold text-primary mb-3">4 Installments</h4>
                <p className="text-gray-600">800 Dhs Split your payment into 4 easy installments.</p>
              </div>
              <div className="text-center p-6 border-2 border-gray-200 rounded-xl">
                <h4 className="text-xl font-semibold text-primary mb-3">Early Visa Cancellation</h4>
                <p className="text-gray-600">300 AED if you wish us to cancel the visa of the worker for any reason</p>
                <p className="text-sm text-gray-500">Free with TADVISA++</p>
              </div>
              <div className="text-center p-6 border-2 border-gray-200 rounded-xl">
                <h4 className="text-xl font-semibold text-primary mb-3">Absconding Report</h4>
                <p className="text-gray-600">700 Dhs If the worker leaves the work place without proper reporting and your knowledge</p>
                <p className="text-sm text-gray-500">Free with TADVISA++</p>
              </div>
              <div className="text-center p-6 border-2 border-gray-200 rounded-xl">
                <h4 className="text-xl font-semibold text-primary mb-3">Legal/Fines Support</h4>
                <p className="text-gray-600">If your worker have fines or absconding, we can help, mediate and appeal to the authorities but we do not guarantee the outcome.</p>
                <p className="text-sm text-gray-500">Free</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-primary rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
            <p className="text-xl text-primary-100 mb-6">
              Make sure you have your <u>Emirates ID photo, your Utility Bill, your worker's Passport Copy, your worker's Photo, your workers Entry Permit or Cancellation</u>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-green-500 hover:bg-green-600 text-white px-8 py-3">
                <Link to="/start-here">Start Here & Now</Link>
              </Button>
              <Button variant="outline" className="border-white text-green-500 hover:bg-white hover:text-primary px-8 py-3" onClick={() => {
                window.location.href = "tel:+971565822258";
              }}>
                Call 0565822258 for help
                </Button>
                <Button variant="outline" className="border-white text-green-500 hover:bg-white hover:text-primary px-8 py-3" onClick={() => {
                  window.location.href = "tel:+971565822258";
                }}>
                  Call 0565822258 for help
                </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Pricing;
