import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MapPin, Globe } from "lucide-react";

const Hub = () => {
  const countries = [
    {
      name: "Philippines",
      flag: "🇵🇭",
      insidePath: "/ph-ic",
      outsidePath: "/ph-oc"
    },
    {
      name: "Indonesia",
      flag: "🇮🇩",
      insidePath: "/id-ic",
      outsidePath: "/id-oc"
    },
    {
      name: "Ethiopia",
      flag: "🇪🇹",
      insidePath: "/et-ic",
      outsidePath: "/et-oc"
    },
    {
      name: "Other Africa",
      flag: "🇰🇪",
      insidePath: "/af-ic",
      outsidePath: "/af-oc"
    },
    {
      name: "Myanmar / India / Nepal",
      flag: "🇲🇲 🇮🇳 🇳🇵",
      insidePath: "/my-ic",
      outsidePath: "/my-oc"
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Choose Your Worker</h1>
            
            <div className="bg-muted/50 rounded-lg p-6 text-left max-w-3xl mx-auto mb-8">
              <p className="text-sm leading-relaxed">
                The visible salary is the net take home salary it is applicable only on the Traditional 2 years package on your visa.
                You may Pay the center the procurement fees, buy a residency and then you pay that salary. This is NOT THE MONTHLY CHARGES.
                For more details read the{" "}
                <Link 
                  to="/monthly-packages" 
                  className="text-primary hover:underline font-semibold"
                >
                  MONTHLY PACKAGES
                </Link>
                {" "}section and{" "}
                <Link 
                  to="/hire-a-maid" 
                  className="text-primary hover:underline font-semibold"
                >
                  HIRE A MAID
                </Link>
                {" "}section
              </p>
            </div>

            <p className="text-muted-foreground text-lg">
              Browse our collection of available workers by country and location
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {countries.map((country) => (
              <Card key={country.name} className="overflow-hidden hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex flex-col items-center space-y-6">
                    {/* Flag */}
                    <div className="text-8xl leading-none">
                      {country.flag}
                    </div>
                    
                    {/* Country Name */}
                    <h3 className="text-2xl font-bold text-center">
                      {country.name}
                    </h3>
                    
                    {/* Selection Buttons */}
                    <div className="w-full space-y-3">
                      <Button
                        asChild
                        className="w-full h-12 text-base"
                        variant="default"
                      >
                        <Link to={country.insidePath} className="flex items-center justify-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Inside Country
                        </Link>
                      </Button>
                      
                      <Button
                        asChild
                        className="w-full h-12 text-base"
                        variant="outline"
                      >
                        <Link to={country.outsidePath} className="flex items-center justify-center gap-2">
                          <Globe className="h-5 w-5" />
                          Outside Country
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Hub;