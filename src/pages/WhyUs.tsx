
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Home, Calendar, MapPin, Utensils, Car } from "lucide-react";

const WhyUs = () => {
  const liveInPrices = [
    { nationality: "Ethiopia (First Timer)", price: "2,100" },
    { nationality: "Ethiopia (Experienced)", price: "2,625" },
    { nationality: "Uganda / Kenya / Benin", price: "2,800" },
    { nationality: "India / Myanmar", price: "3,150" },
    { nationality: "Philippines / Indonesia", price: "3,675" },
  ];

  const liveOutPrices = [
    { nationality: "Ethiopia (First Timer)", basePrice: "2,100" },
    { nationality: "Ethiopia (Experienced)", basePrice: "2,625" },
    { nationality: "Uganda / Kenya", basePrice: "2,800" },
    { nationality: "India / Nepal / Myanmar", basePrice: "3,150" },
    { nationality: "Philippines / Indonesia", basePrice: "3,675" },
  ];

  return (
    <Layout>
      <div className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-6">
              Monthly Packages
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Flexible monthly payment options for domestic worker services
            </p>
          </div>

          {/* What is the Monthly System */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">What is the Monthly System?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                The Monthly System means the housemaid remains under the sponsorship of TADMAIDS, 
                and the sponsor pays a fixed monthly fee that includes:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>Part of residency fees</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>Part of recruitment costs</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>Part of health insurance</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <span>The maid's monthly salary</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live-In Workers */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <span className="text-2xl">📊</span> Monthly Packages — Live-In Workers
              </CardTitle>
              <CardDescription>Monthly Prices Start From:</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nationality</TableHead>
                    <TableHead className="text-right">Monthly Price (AED)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liveInPrices.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.nationality}</TableCell>
                      <TableCell className="text-right font-semibold">{item.price}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-8 p-6 bg-accent/50 rounded-lg">
                <h4 className="font-semibold mb-4">Service Highlights:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    <span>The maid lives and works inside the home</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>One day off per week</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live-Out Option */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <span className="text-2xl">🏠</span> Live-Out Option
              </CardTitle>
              <CardDescription>TADMAIDS Live Out Price Calculation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-accent/50 rounded-lg p-6 mb-8">
                <p className="font-semibold mb-4">
                  👉 If you require a Live-Out worker, the following additional fees apply:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span><strong>Accommodation:</strong> AED 450 / month</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Car className="h-5 w-5 text-primary" />
                    <span><strong>Transportation:</strong> Based on location & availability of public transport</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-lg text-center">
                <p className="text-lg font-semibold text-primary">
                  Special deals available for long-term commitments.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default WhyUs;
