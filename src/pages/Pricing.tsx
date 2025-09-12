import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { CheckCircle, Home, Calendar, Clock, MapPin, Utensils, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Pricing = () => {
  const liveInPackages = [
    { nationality: "Ethiopia (First Timer)", price: "2,100" },
    { nationality: "Ethiopia (Experienced)", price: "2,625" },
    { nationality: "Uganda / Kenya / Benin", price: "2,800" },
    { nationality: "India / Myanmar", price: "3,150" },
    { nationality: "Philippines", price: "3,675", popular: true },
    { nationality: "Indonesia", price: "4,200" },
  ];

  const liveOutAddOns = {
    accommodation: "450",
    transportation: "Based on location & availability",
    food: "30"
  };

  return (
    <Layout>
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-6">
              Monthly Packages
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Flexible monthly system with transparent pricing and no hidden fees
            </p>
          </div>

          {/* What is the Monthly System */}
          <Card className="mb-16 p-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <h2 className="text-2xl font-bold text-primary mb-6">
              What is the Monthly System?
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              The Monthly System means the housemaid remains under the sponsorship of TADMAIDS, 
              and the sponsor pays a fixed monthly fee that includes:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-primary mt-1" />
                <span className="text-lg">Part of residency fees</span>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-primary mt-1" />
                <span className="text-lg">Part of recruitment costs</span>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-primary mt-1" />
                <span className="text-lg">Part of health insurance</span>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-primary mt-1" />
                <span className="text-lg">The maid's monthly salary</span>
              </div>
            </div>
          </Card>

          {/* Live-In Workers Section */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-primary mb-4">
                📊 Monthly Packages — Live-In Workers
              </h2>
              <p className="text-lg text-muted-foreground">
                Monthly Prices Start From:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {liveInPackages.map((pkg, index) => (
                <Card 
                  key={index}
                  className={`p-6 ${pkg.popular ? 'border-primary shadow-lg scale-105' : ''}`}
                >
                  {pkg.popular && (
                    <div className="bg-primary text-primary-foreground text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {pkg.nationality}
                  </h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-3xl font-bold text-primary">{pkg.price}</span>
                    <span className="text-muted-foreground ml-2">AED/Month</span>
                  </div>
                </Card>
              ))}
            </div>

            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-3">Service Highlights:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Home className="w-5 h-5 text-primary" />
                  <span>The maid lives and works inside the home</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>One day off per week</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live-Out Option Section */}
          <div className="mb-16">
            <Card className="p-8 border-2 border-accent">
              <h2 className="text-2xl font-bold text-primary mb-6 flex items-center">
                <Home className="w-6 h-6 mr-3" />
                Live-Out Option
              </h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">TADMAIDS Live Out Price Calculation</h3>
                <p className="text-muted-foreground mb-4">
                  The Monthly Base Price already covers: <span className="font-semibold">Worker's Salary + Visa fees + 
                  Tadbeer Procurement Fee + Medical Insurance.</span>
                </p>
                <p className="text-muted-foreground mb-4">
                  This rate applies to Live-In workers (6 days/week).
                </p>
              </div>

              <div className="bg-accent/10 rounded-lg p-6">
                <p className="font-semibold mb-4">
                  👉 If you require a Live-Out worker, the following additional allowances apply:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Home className="w-5 h-5 text-accent" />
                    <span><strong>Accommodation:</strong> AED {liveOutAddOns.accommodation} / month</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Car className="w-5 h-5 text-accent" />
                    <span><strong>Transportation:</strong> {liveOutAddOns.transportation}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Utensils className="w-5 h-5 text-accent" />
                    <span><strong>Food Allowance:</strong> AED {liveOutAddOns.food} / month</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Live-Out Price Guide */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-8 text-center">
              📊 Live-Out Price Guide
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="p-4 text-left">Nationality</th>
                    <th className="p-4 text-center">Monthly Base Price (AED)</th>
                    <th className="p-4 text-left">Add-Ons for Live Out</th>
                  </tr>
                </thead>
                <tbody>
                  {liveInPackages.map((pkg, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-medium">{pkg.nationality}</td>
                      <td className="p-4 text-center font-bold text-primary">{pkg.price}</td>
                      <td className="p-4">+ Accommodation + Transport + Food</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 text-center">
              <p className="text-lg font-semibold text-accent">
                Special deals available for long-term commitments.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 opacity-95">
              Choose the perfect package for your needs with transparent monthly pricing
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link to="/start-here">Start Application</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Pricing;