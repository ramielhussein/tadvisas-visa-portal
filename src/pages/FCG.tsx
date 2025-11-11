import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Sparkles, GraduationCap, Building2, Users, Award, Phone, Mail, MapPin, Clock, CheckCircle2, Target, Eye, Heart } from "lucide-react";
import heroImage from "@/assets/fcg-hero.jpg";
import teamImage from "@/assets/fcg-team.jpg";
import securityImage from "@/assets/fcg-security.jpg";
import cleaningImage from "@/assets/fcg-cleaning.jpg";
import trainingImage from "@/assets/fcg-training.jpg";
import fcgLogo from "@/assets/fcg-logo.jpg";

const FCG = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Logo Bar */}
      <div className="bg-fcg-navy py-4">
        <div className="container mx-auto px-4">
          <img src={fcgLogo} alt="First Choice Group" className="h-16 object-contain" />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center text-white overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Protecting What Matters.
          </h1>
          <p className="text-2xl md:text-3xl mb-4">Security • Safety • Trust</p>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto">
            First Choice Group is a UAE-licensed provider of security and facility services, delivering dependable protection, impeccable standards, and peace of mind to both government and private sectors.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" onClick={() => scrollToSection('contact')}>Request a Quote</Button>
            <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm text-white border-white hover:bg-white hover:text-primary" onClick={() => scrollToSection('careers')}>Join Our Team</Button>
          </div>
        </div>
      </section>

      {/* Key Highlights */}
      <section className="py-12 bg-fcg-navy text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10+</div>
              <div className="text-sm">Years of Experience</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">700+</div>
              <div className="text-sm">Licensed Guards</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-sm">Operations Center</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">30+</div>
              <div className="text-sm">Active Projects</div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="text-2xl font-bold mb-2">SIRA & PSBD</div>
              <div className="text-sm">Approved</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img src={teamImage} alt="First Choice Group Team" className="rounded-lg shadow-xl" />
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-6">A Decade of Trust, Protection, and Performance</h2>
              <p className="text-lg mb-4 text-muted-foreground">
                Founded in 2014, First Choice Group (FCG) is a 100% Emirati-owned company and a proud member of the Mohammed Bin Rashid Establishment for SME Development. With a workforce exceeding 700 trained professionals, FCG provides security, safety, and cleaning solutions designed around trust, compliance, and service excellence.
              </p>
              
              <div className="space-y-6 mt-8">
                <div className="flex items-start gap-4">
                  <Eye className="w-6 h-6 text-fcg-gold flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-xl mb-2">Our Vision</h3>
                    <p className="text-muted-foreground">To lead the UAE's security and facility services industry through innovation, total quality, and unwavering commitment to client satisfaction.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Target className="w-6 h-6 text-fcg-gold flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-xl mb-2">Our Mission</h3>
                    <p className="text-muted-foreground">To protect lives, property, and reputation through comprehensive risk management, world-class training, and cutting-edge technology.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Heart className="w-6 h-6 text-fcg-gold flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-xl mb-2">Our Values</h3>
                    <p className="text-muted-foreground">Integrity • Vigilance • Service • Safety • Excellence</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-muted rounded-lg">
                <h4 className="font-bold mb-3">Licensing & Certification</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-fcg-gold" />
                    Approved by Dubai Police & SIRA
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-fcg-gold" />
                    Licensed by PSBD (Abu Dhabi)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-fcg-gold" />
                    ISO-compliant safety systems
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Services */}
      <section id="security" className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Shield className="w-16 h-16 mx-auto mb-4 text-fcg-gold" />
            <h2 className="text-4xl font-bold mb-4">Security Services</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Reliable Protection. Certified Personnel. 24/7 Coverage.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            <div>
              <img src={securityImage} alt="Security Operations" className="rounded-lg shadow-xl" />
            </div>
            <div>
              <p className="text-lg mb-6 text-muted-foreground">
                FCG provides licensed security officers, supervisors, and control-room operators across multiple sectors. Our clients trust us for reliability, discipline, and full compliance with UAE law enforcement standards.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-2">Manned Guards</h4>
                    <p className="text-sm text-muted-foreground">Male & female licensed officers</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-2">Access Control</h4>
                    <p className="text-sm text-muted-foreground">Gate operations & patrols</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-2">Control Room</h4>
                    <p className="text-sm text-muted-foreground">CCTV & alarm monitoring</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-2">Event Security</h4>
                    <p className="text-sm text-muted-foreground">VIP & temporary coverage</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-2">Concierge</h4>
                    <p className="text-sm text-muted-foreground">Reception security services</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-2">Project Security</h4>
                    <p className="text-sm text-muted-foreground">Construction & industrial sites</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <Card className="bg-background">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6">Industries We Serve</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {['Government', 'Education', 'Healthcare', 'Residential', 'Retail', 'Industrial'].map(industry => (
                  <div key={industry} className="text-center p-4 bg-muted rounded-lg">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-fcg-gold" />
                    <p className="font-semibold">{industry}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Cleaning Services */}
      <section id="cleaning" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-fcg-gold" />
            <h2 className="text-4xl font-bold mb-4">Cleaning & Facility Services</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Beyond Safety, We Create Spotless Spaces.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <p className="text-lg mb-6 text-muted-foreground">
                First Choice Group delivers professional cleaning and facility management solutions to both commercial and residential clients. Our services combine modern equipment, eco-friendly materials, and well-trained janitorial teams.
              </p>
              <div className="space-y-3">
                {[
                  'Office & Commercial Cleaning',
                  'Shopping Mall & Retail Cleaning',
                  'School & University Cleaning',
                  'Hospital & Healthcare Cleaning',
                  'Hotels & Resorts',
                  'Villas & Private Residences',
                  'Restaurants & Kitchens',
                  'Government Buildings',
                  'Pest Control & Sanitization'
                ].map(service => (
                  <div key={service} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-fcg-gold flex-shrink-0" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <img src={cleaningImage} alt="Cleaning Services" className="rounded-lg shadow-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Training */}
      <section id="training" className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-fcg-gold" />
            <h2 className="text-4xl font-bold mb-4">Training & Quality Control</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Excellence Starts with Preparation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img src={trainingImage} alt="Training Programs" className="rounded-lg shadow-xl" />
            </div>
            <div>
              <p className="text-lg mb-6 text-muted-foreground">
                At FCG, every staff member is trained to meet the highest operational and ethical standards. Our internal training programs are approved by SIRA and align with international safety practices.
              </p>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Key Training Modules</h3>
                  <ul className="space-y-2">
                    {[
                      'General Security & Site Protocols',
                      'Fire Safety & Emergency Response',
                      'First Aid & Evacuation',
                      'Communication & Report Writing',
                      'Conflict Management',
                      'Search & Inspection Techniques',
                      'Customer Service & Public Interaction',
                      'Cleaning Standards & Equipment Handling'
                    ].map(module => (
                      <li key={module} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-fcg-gold flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{module}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Clients */}
      <section id="clients" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Award className="w-16 h-16 mx-auto mb-4 text-fcg-gold" />
            <h2 className="text-4xl font-bold mb-4">Trusted by the UAE's Most Respected Institutions</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              With over a decade of continuous service, FCG proudly partners with government, semi-government, and corporate clients across the UAE.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              'Dubai Municipality',
              'Dubai Courts',
              'Dubai Ambulance Services',
              'Islamic Affairs & Charitable Activities Dept.',
              'Dubai Culture & Arts Authority',
              'Bukhatir Group',
              'Al Naboodah Group',
              'Kharafi National',
              'Al Banai Real Estate'
            ].map(client => (
              <Card key={client}>
                <CardContent className="p-6 text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-fcg-gold" />
                  <p className="font-semibold">{client}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-fcg-navy text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Major Achievements</h3>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div>
                  <Users className="w-12 h-12 mx-auto mb-3" />
                  <p className="text-lg">10+ years of uninterrupted government contracts</p>
                </div>
                <div>
                  <Shield className="w-12 h-12 mx-auto mb-3" />
                  <p className="text-lg">Full security management for Safari Park Dubai, Dubai Courts HQ, and multiple cultural sites</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Careers */}
      <section id="careers" className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-fcg-gold" />
            <h2 className="text-4xl font-bold mb-4">Join the First Choice Family</h2>
            <p className="text-lg mb-8 text-muted-foreground">
              We're always looking for motivated, professional individuals to join our growing team. If you are licensed by SIRA or PSBD and ready to serve with integrity — we want you.
            </p>
            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4">How to Apply</h3>
                <ul className="space-y-3 text-left">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-fcg-gold flex-shrink-0 mt-1" />
                    <span>Email your CV to hr@fcguae.com</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-fcg-gold flex-shrink-0 mt-1" />
                    <span>Mention nationality, license type, and current location</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-fcg-gold flex-shrink-0 mt-1" />
                    <span>Only shortlisted candidates will be contacted</span>
                  </li>
                </ul>
                <Button size="lg" className="mt-6">
                  <Mail className="mr-2" />
                  Apply Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Contact Us</h2>
            <p className="text-xl text-muted-foreground">Get in touch with First Choice Group</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">Get In Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-6 h-6 text-fcg-gold flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">Address</p>
                      <p className="text-muted-foreground">IT Plaza Building, Office 1011<br />Dubai Silicon Oasis, UAE<br />P.O. Box 237486</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="w-6 h-6 text-fcg-gold flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">Phone</p>
                      <a href="tel:+97142667219" className="text-fcg-navy hover:underline">+971 4 266 7219</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Mail className="w-6 h-6 text-fcg-gold flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">Email</p>
                      <a href="mailto:info@fcguae.com" className="text-fcg-navy hover:underline">info@fcguae.com</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Clock className="w-6 h-6 text-fcg-gold flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">Working Hours</p>
                      <p className="text-muted-foreground">Sunday - Friday<br />9:00 AM - 7:00 PM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">Request a Quote</h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input type="text" className="w-full px-4 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input type="email" className="w-full px-4 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Service</label>
                    <select className="w-full px-4 py-2 border rounded-md">
                      <option>Security Services</option>
                      <option>Cleaning Services</option>
                      <option>Both Services</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea rows={4} className="w-full px-4 py-2 border rounded-md"></textarea>
                  </div>
                  <Button type="submit" size="lg" className="w-full">Send Message</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-fcg-navy text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">© 2025 First Choice Group LLC - All Rights Reserved</p>
          <p className="text-sm opacity-90">Member of Mohammed Bin Rashid Establishment for SME Development</p>
          <p className="text-sm opacity-90">Licensed by SIRA & PSBD</p>
        </div>
      </footer>
    </div>
  );
};

export default FCG;
