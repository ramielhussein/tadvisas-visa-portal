
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, Star, Award, Users, Clock } from "lucide-react";

const WhyUs = () => {
  const comparison = [
    {
      feature: "MOHRE Licensed",
      us: true,
      personalSponsorship: false,
      others: true
    },
    {
      feature: "Monthly Admin Fees",
      us: "ZERO",
      personalSponsorship: "ZERO",
      others: "140-250 AED"
    },
    {
      feature: "Transparent Pricing",
      us: true,
      personalSponsorship: true,
      others: false
    },
    {
      feature: "Complete Documentation Support",
      us: true,
      personalSponsorship: false,
      others: true
    },
    {
      feature: "Customer Support",
      us: "10 AM to 10 PM Daily",
      personalSponsorship: "None",
      others: "Varies"
    },
    {
      feature: "Processing Time",
      us: "7-12 Business Days",
      personalSponsorship: "30+ Days",
      others: "Varies"
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

  return (
    <Layout>
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-6">
              Why Choose TADVISAS?
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Because we are not here to hook you up for 2 years. We have no intention of taking your maid under the pretense of helping you. We do a service get paid once and will not blackmail you with monthly payments forever.
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
                    <th className="px-6 py-4 text-center text-lg font-semibold text-blue-600">Personal Sponsorship</th>
                    <th className="px-6 py-4 text-center text-lg font-semibold text-gray-600">Other Centers</th>
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
                          <span className="text-gray-600">{row.others}</span>
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

          {/* License Information */}
          <div className="bg-gradient-light rounded-2xl p-8 mb-16">
            <h2 className="text-3xl font-bold text-primary text-center mb-8">
              Licensed & Regulated
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl font-semibold text-primary mb-4">
                  Why Licensing Matters
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Only 150 centers are licensed in UAE</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Government oversight and regulation</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Legal protection for customers</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Quality standards compliance</span>
                  </li>
                </ul>
              </div>
              <div className="text-center">
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Award className="w-16 h-16 text-primary" />
                </div>
                <p className="text-primary font-semibold">100% MOHRE Licensed</p>
              </div>
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
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary px-8 py-3">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WhyUs;
