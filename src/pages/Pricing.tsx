
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle, X } from "lucide-react";

const Pricing = () => {
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

  const included = [
    "Complete visa processing",
    "Medical examination",
    "Emirates ID processing",
    "All government fees",
    "Documentation support",
    "Legal compliance guarantee"
  ];

  const notIncluded = [
    "Monthly admin fees (We charge ZERO!)",
    "Hidden charges",
    "Renewal fees for 2 years",
    "Additional processing costs"
  ];

  return (
    <Layout>
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-6">
              Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              No hidden fees, no surprises. Our pricing is straightforward and includes everything 
              you need for your 2-year maid visa processing.
            </p>
          </div>

          {/* Zero Monthly Fees Callout */}
          <div className="bg-gradient-gold text-white rounded-2xl p-8 text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">🎉 ZERO Monthly Admin Fees</h2>
            <p className="text-xl">
              Unlike other providers who charge 200-500 AED monthly, we charge absolutely nothing after your visa is processed!
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {pricingData.map((item, index) => (
              <div 
                key={index} 
                className={`relative bg-white rounded-2xl p-6 shadow-lg hover-lift border-2 ${
                  item.popular ? 'border-accent' : 'border-gray-200'
                }`}
              >
                {item.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-accent text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-primary mb-4">{item.nationality}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-primary">{item.price}</span>
                    <span className="text-gray-600"> AED</span>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary-700 text-white">
                    Choose This Option
                  </Button>
                </div>
              </div>
            ))}
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
                What We DON'T Charge
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
              Flexible Payment Options
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 border-2 border-gray-200 rounded-xl">
                <h4 className="text-xl font-semibold text-primary mb-3">Full Payment</h4>
                <p className="text-gray-600">Pay the complete amount upfront and save on processing fees.</p>
              </div>
              <div className="text-center p-6 border-2 border-accent rounded-xl">
                <h4 className="text-xl font-semibold text-primary mb-3">Tabby (4 Payments)</h4>
                <p className="text-gray-600">Split your payment into 4 easy installments with Tabby.</p>
              </div>
              <div className="text-center p-6 border-2 border-gray-200 rounded-xl">
                <h4 className="text-xl font-semibold text-primary mb-3">Tamara (3 Payments)</h4>
                <p className="text-gray-600">Pay in 3 convenient installments using Tamara.</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-primary rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Get Your Custom Quote</h2>
            <p className="text-xl text-primary-100 mb-6">
              Contact us now to get a personalized quote based on your specific requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3">
                Get Quote on WhatsApp
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary px-8 py-3">
                Call for Quote
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Pricing;
