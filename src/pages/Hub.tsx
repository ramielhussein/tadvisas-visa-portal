import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Users, Globe, MapPin } from "lucide-react";

const Hub = () => {
  const albums = [
    {
      title: "Philippines Workers Inside Country",
      path: "/ph-ic",
      region: "Philippines",
      location: "Inside Country"
    },
    {
      title: "Philippines Workers Outside Country",
      path: "/ph-oc",
      region: "Philippines",
      location: "Outside Country"
    },
    {
      title: "Indonesia Workers Inside Country",
      path: "/id-ic",
      region: "Indonesia",
      location: "Inside Country"
    },
    {
      title: "Indonesia Workers Outside Country",
      path: "/id-oc",
      region: "Indonesia",
      location: "Outside Country"
    },
    {
      title: "Ethiopia Workers Inside Country",
      path: "/et-ic",
      region: "Ethiopia",
      location: "Inside Country"
    },
    {
      title: "Ethiopia Workers Outside Country",
      path: "/et-oc",
      region: "Ethiopia",
      location: "Outside Country"
    },
    {
      title: "Uganda Kenya Workers Inside Country",
      path: "/af-ic",
      region: "Uganda/Kenya",
      location: "Inside Country"
    },
    {
      title: "Uganda Kenya Workers Outside Country",
      path: "/af-oc",
      region: "Uganda/Kenya",
      location: "Outside Country"
    },
    {
      title: "Myanmar Workers Inside Country",
      path: "/my-ic",
      region: "Myanmar",
      location: "Inside Country"
    },
    {
      title: "Myanmar Workers Outside Country",
      path: "/my-oc",
      region: "Myanmar",
      location: "Outside Country"
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <Link key={album.path} to={album.path}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                      <Users className="h-5 w-5" />
                      {album.region}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{album.location}</span>
                      </div>
                      <p className="text-sm font-medium mt-4">{album.title}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Hub;