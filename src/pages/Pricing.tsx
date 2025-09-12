
import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, Star, Award, Users, Clock, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  const [selectedService, setSelectedService] = useState<'standard' | 'vip' | 'premium'>('standard');

  const comparison = [
    {
      feature: "Cost 1 Year Visa",
      us: "8925",
      tadvisasPlus: "8400",
      tadvisasPremium: "10500",
      personalSponsorship: "9000",
      others: "8400"
    },
    {
      feature: "Cost 2 Year Visa",
      us: "Zero",
      tadvisasPlus: "Zero",
      tadvisasPremium: "Zero",
      personalSponsorship: "7000",
      others: "Zero"
    },
    {
      feature: "Monthly Admin Fees",
      us: "ZERO",
      tadvisasPlus: "150",
      tadvisasPremium: "168",
      personalSponsorship: "ZERO",
      others: "140-250 AED"
    },
    {
      feature: "WPS ATM card/App & Payroll processing",
      us: true,
      tadvisasPlus: true,
      tadvisasPremium: true,
      personalSponsorship: false,
      others: true
    },
    {
      feature: "Deposit",
      us: false,
      tadvisasPlus: false,
      tadvisasPremium: false,
      personalSponsorship: "2000",
      others: "Up to 5000"
    },
    {
      feature: "Free Transportation",
      us: true,
      tadvisasPlus: true,
      tadvisasPremium: true,
      personalSponsorship: false,
      others: false
    },
    {
      feature: "Complete Documentation Support",
      us: true,
      tadvisasPlus: true,
      tadvisasPremium: true,
      personalSponsorship: false,
      others: true
    },
    {
      feature: "Customer Support",
      us: "10 AM to 10 PM Daily",
      tadvisasPlus: "10 AM to 10 PM Daily",
      tadvisasPremium: "10 AM to 10 PM Daily",
      personalSponsorship: "None",
      others: "Varies"
    },
    {
      feature: "Processing Time",
      us: "7-12 Business Days",
      tadvisasPlus: "7-12 Business Days",
      tadvisasPremium: "7-12 Business Days",
      personalSponsorship: "Varies",
      others: "Varies"
    },
    {
      feature: "Absocond/Fines Removal Support",
      us: true,
      tadvisasPlus: true,
      tadvisasPremium: true,
      personalSponsorship: false,
      others: true
    },
    {
      feature: "NOC to travel with you",
      us: true,
      tadvisasPlus: true,
      tadvisasPremium: true,
      personalSponsorship: "Not required",
      others: "150 to 500 Per permit"
    },
    {
      feature: "Medical Insurance",
      us: "735 Per Year",
      tadvisasPlus: "Free",
      tadvisasPremium: "Free",
      personalSponsorship: false,
      others: "170 per month"
    },
    {
      feature: "WPS Salary Process Fee",
      us: "Free",
      tadvisasPlus: "Free",
      tadvisasPremium: "Free",
      personalSponsorship: false,
      others: "140-250 AED"
    },
    {
      feature: "Cancellation",
      us: "300",
      tadvisasPlus: "300",
      tadvisasPremium: "Free",
      personalSponsorship: "300",
      others: "Varies"
    },
    {
      feature: "ILOE Insurance",
      us: "Free",
      tadvisasPlus: "Free",
      tadvisasPremium: "Free",
      personalSponsorship: "Paid",
      others: "Paid"
    },
    {
      feature: "END OF SERVICE",
      us: false,
      tadvisasPlus: false,
      tadvisasPremium: true,
      personalSponsorship: false,
      others: false
    },
    {
      feature: "Return Home Ticket",
      us: false,
      tadvisasPlus: false,
      tadvisasPremium: true,
      personalSponsorship: false,
      others: false
    }
  ];

  const testimonials = [
    {
      name: "Ahmed Mohammed",
      location: "Dubai",
      rating: 5,
      text: "TADVISAS made the entire process so smooth. No hidden fees, no surprises. Highly recommended!"
    },
    {
      name: "Sarah Al-Rashid", 
      location: "Abu Dhabi",
      rating: 5,
      text: "Professional service from start to finish. They handled everything while I focused on my work."
    },
    {
      name: "Mohammed Hassan",
      location: "Sharjah", 
      rating: 5,
      text: "Best decision I made was choosing TADVISAS. Zero monthly fees saved me thousands!"
    }
  ];

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
    "2 Years Medical Insurance",
    "ILOE Insurance for 2 years",
    "Legal compliance guarantee"
  ];

  const vipNotIncluded = [
    "Hidden charges",
    "End Of service (pay your worker direct)",
    "Return Home Ticket"
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
    "Legal compliance guarantee",
    "Free cancellation any time (no refund)",
    "Free Absconding report (if applicable)"
  ];

  const premiumNotIncluded = [
    "Hidden charges"
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
              Other providers charge AED 150–200 monthly. With us, you can pay just AED 8,925 one time — and nothing more.<br/>
              ⚠️ Medical insurance not included.
            </p>
            <p className="text-xl">
              Need insurance? ✔️ Choose our standard package with 2 years medical coverage included.
            </p>
          </div>

          {/* Pricing Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
            {/* Standard Service */}
            <div 
              onMouseEnter={() => setSelectedService('standard')}
              onClick={() => setSelectedService('standard')}
              className={`relative bg-white rounded-2xl p-8 shadow-lg cursor-pointer transition-all duration-500 ${
                selectedService === 'standard' 
                  ? 'border-4 border-accent scale-105 shadow-2xl ring-4 ring-accent/30' 
                  : 'border-2 border-accent hover:border-4 opacity-75 hover:opacity-100'
              }`}
              style={{
                background: selectedService === 'standard' 
                  ? 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,237,213,0.3) 100%)'
                  : 'white',
                boxShadow: selectedService === 'standard'
                  ? '0 20px 40px -10px rgba(251, 146, 60, 0.4), 0 0 60px -20px rgba(251, 146, 60, 0.3)'
                  : undefined
              }}
            >
              {selectedService === 'standard' && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    ✨ CURRENTLY SELECTED ✨
                  </div>
                </div>
              )}
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
              className={`relative bg-white rounded-2xl p-8 shadow-lg cursor-pointer transition-all duration-500 ${
                selectedService === 'vip' 
                  ? 'border-4 border-primary scale-105 shadow-2xl ring-4 ring-primary/30' 
                  : 'border-2 border-primary hover:border-4 opacity-75 hover:opacity-100'
              }`}
              style={{
                background: selectedService === 'vip' 
                  ? 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(59,130,246,0.1) 100%)'
                  : 'white',
                boxShadow: selectedService === 'vip'
                  ? '0 20px 40px -10px rgba(59, 130, 246, 0.4), 0 0 60px -20px rgba(59, 130, 246, 0.3)'
                  : undefined
              }}
            >
              {selectedService === 'vip' && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    ✨ CURRENTLY SELECTED ✨
                  </div>
                </div>
              )}
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
              className={`relative bg-white rounded-2xl p-8 shadow-lg cursor-pointer transition-all duration-500 ${
                selectedService === 'premium' 
                  ? 'border-4 border-yellow-500 scale-105 shadow-2xl ring-4 ring-yellow-400/30' 
                  : 'border-2 border-yellow-500 hover:border-4 opacity-75 hover:opacity-100'
              }`}
              style={{
                background: selectedService === 'premium' 
                  ? 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,215,0,0.15) 100%)'
                  : 'white',
                boxShadow: selectedService === 'premium'
                  ? '0 20px 40px -10px rgba(255, 215, 0, 0.5), 0 0 60px -20px rgba(255, 215, 0, 0.4)'
                  : undefined
              }}
            >
              {selectedService === 'premium' && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    ⭐ CURRENTLY SELECTED ⭐
                  </div>
                </div>
              )}
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
                <p className="text-gray-600">If your worker have fines or absconding, we can help, mediate and appeal to the authorities <u>but we do not guarantee the outcome.</u></p>
                <p className="text-sm text-gray-500">Free</p>
              </div>
            </div>
          </div>

          {/* Visa Benefits Table */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary mb-6">
              Visa Benefits Table
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We are here to help you get a good service at affordable fees. Transparency and clarity is what we promise you, you will never be surprised by any additional or hidden fees.
            </p>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="text-center bg-white rounded-xl p-6 shadow-lg">
              <Users className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <div className="text-3xl font-bold text-primary">1700+</div>
              <div className="text-gray-600">Happy Families</div>
            </div>
            <div className="text-center bg-white rounded-xl p-6 shadow-lg">
              <Award className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <div className="text-3xl font-bold text-primary">100%</div>
              <div className="text-gray-600">MOHRE Licensed</div>
            </div>
            <div className="text-center bg-white rounded-xl p-6 shadow-lg">
              <Clock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <div className="text-3xl font-bold text-primary">22</div>
              <div className="text-gray-600">Years Experience</div>
            </div>
            <div className="text-center bg-white rounded-xl p-6 shadow-lg">
              <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <div className="text-3xl font-bold text-primary">4.9/5</div>
              <div className="text-gray-600">Customer Rating</div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-16">
            <div className="bg-primary text-white p-6">
              <h2 className="text-3xl font-bold text-center">How does TADVISAS compare?</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-lg font-semibold text-primary">Feature</th>
                    <th className="px-6 py-4 text-center text-lg font-semibold text-green-600">TADVISAS</th>
                    <th className="px-6 py-4 text-center text-lg font-semibold text-green-600">TADVISAS+</th>
                    <th className="px-6 py-4 text-center text-lg font-semibold text-yellow-600">TADVISAS++</th>
                    <th className="px-6 py-4 text-center text-lg font-semibold text-blue-600">Personal Sponsorship</th>
                    <th className="px-6 py-4 text-center text-lg font-semibold text-red-600">Other Centers</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="px-6 py-4 font-medium text-gray-700">{row.feature}</td>
                      <td className="px-6 py-4 text-center">
                        {typeof row.us === 'boolean' ? (
                          row.us ? (
                            <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-6 h-6 text-red-500 mx-auto" />
                          )
                        ) : (
                          <span className="text-green-600 font-semibold">{row.us}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {typeof row.tadvisasPlus === 'boolean' ? (
                          row.tadvisasPlus ? (
                            <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-6 h-6 text-red-500 mx-auto" />
                          )
                        ) : (
                          <span className="text-green-600 font-semibold">{row.tadvisasPlus}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {typeof row.tadvisasPremium === 'boolean' ? (
                          row.tadvisasPremium ? (
                            <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-6 h-6 text-red-500 mx-auto" />
                          )
                        ) : (
                          <span className="text-yellow-600 font-semibold">{row.tadvisasPremium}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {typeof row.personalSponsorship === 'boolean' ? (
                          row.personalSponsorship ? (
                            <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-6 h-6 text-red-500 mx-auto" />
                          )
                        ) : (
                          <span className="text-blue-600 font-semibold">{row.personalSponsorship}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {typeof row.others === 'boolean' ? (
                          row.others ? (
                            <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-6 h-6 text-red-500 mx-auto" />
                          )
                        ) : (
                          <span className="text-red-600">{row.others}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-primary text-center mb-12">
              What Our Customers Say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 italic mb-4">"{testimonial.text}"</p>
                  <div className="border-t pt-4">
                    <div className="font-semibold text-primary">{testimonial.name}</div>
                    <div className="text-gray-500">{testimonial.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-primary rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Experience the Difference?</h2>
            <p className="text-xl text-primary-100 mb-6">
              Join the growing family of satisfied customers who chose transparency and quality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3">
                Choose TADVISAS Today
              </Button>
              <Button 
                variant="outline-white" 
                className="px-8 py-4 text-lg font-semibold transition-all duration-300"
                onClick={() => window.location.href = "tel:+971565822258"}
              >
                <Phone className="w-5 h-5 mr-3" />
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
