
import Layout from "@/components/Layout";

const WhyUs = () => {
  return (
    <Layout>
      <div className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-6">
              Why Choose TADVISAS?
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover what makes us the trusted choice for thousands of families across the UAE.
            </p>
          </div>

          {/* Main content can be added here in the future */}
          <div className="text-center">
            <p className="text-lg text-gray-600">
              Learn more about our comprehensive visa services and competitive pricing on our <a href="/pricing" className="text-primary hover:underline">Pricing page</a>.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WhyUs;
