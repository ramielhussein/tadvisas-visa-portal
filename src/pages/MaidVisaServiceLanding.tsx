import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Phone, MessageCircle, CheckCircle, X, Star, Shield, Award, Clock, 
  Users, FileCheck, Zap, Building, BadgeCheck, ThumbsUp, ArrowRight,
  MapPin
} from "lucide-react";
import { trackContact, trackLead } from "@/lib/metaTracking";
import { supabase } from "@/integrations/supabase/client";
import heroBackground from "@/assets/hero-maid-visa-bg.jpg";

const LANDING_PAGE_URL = "/maid-visa-service-uae-lp";

const MaidVisaServiceLanding = () => {
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    nationality: '',
    visaStatus: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderSticky(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    const phoneRegex = /^[\+]?[(]?[\d]{1,4}[)]?[-\s\.]?[\d]{1,4}[-\s\.]?[\d]{1,9}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.nationality) {
      newErrors.nationality = 'Please select maid nationality';
    }
    
    if (!formData.visaStatus) {
      newErrors.visaStatus = 'Please select visa status';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // SHA-256 hash function for Enhanced Conversions
  const hashUserData = async (value: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(value.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Save to database with landing page source
      const { error } = await supabase.from('leads').insert([{
        client_name: formData.name,
        mobile_number: formData.phone,
        email: formData.email,
        nationality_code: formData.nationality,
        service_required: formData.visaStatus,
        comments: `${formData.message}\n\n[Source: ${LANDING_PAGE_URL}]`,
        lead_source: 'Landing Page - Maid Visa Service',
        status: 'New Lead' as const
      }]);

      if (error) throw error;

      // Google Ads Enhanced Conversion - Form Submission
      if ((window as any).gtag) {
        const hashedEmail = await hashUserData(formData.email);
        const hashedPhone = await hashUserData(formData.phone.replace(/\s/g, ''));
        const nameParts = formData.name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        (window as any).gtag('set', 'user_data', {
          email: hashedEmail,
          phone_number: hashedPhone,
          address: {
            first_name: await hashUserData(firstName),
            last_name: await hashUserData(lastName),
            country: 'AE'
          }
        });
        
        (window as any).gtag('event', 'conversion', {
          'send_to': 'AW-17918343259/ucbYCIqSm_AbENvwkOBC',
          'value': 1.0,
          'currency': 'AED'
        });
      }

      // Track lead conversion - Meta Pixel + CAPI
      await trackLead({
        email: formData.email,
        phone: formData.phone,
        first_name: formData.name.split(' ')[0]
      });
      
      navigate('/thank-you');
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleWhatsAppClick = () => {
    trackContact();
    const message = "Hi! I'm interested in your 2-year maid visa service. Can you help me?";
    window.open(`https://wa.me/971567222248?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCallClick = () => {
    trackContact();
    // Google Ads Enhanced Conversion - Click to Call
    if ((window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': 'AW-17918343259/CqN5CN-Uj_AbENvwkOBC',
        'value': 1.0,
        'currency': 'AED'
      });
    }
    window.location.href = "tel:+971567222248";
  };

  const packages = [
    {
      name: "TADVISA",
      price: "8,925",
      monthly: "ZERO",
      description: "Big Saving - Visa only",
      included: [
        "Complete visa processing",
        "Direct Debit for WPS salary",
        "VIP Chauffeur Service",
        "Medical examination",
        "Emirates ID processing",
        "All government fees"
      ],
      notIncluded: ["Medical Insurance", "End of service benefits"],
      highlight: false,
      color: "border-accent"
    },
    {
      name: "TADVISA+",
      price: "8,400",
      monthly: "150",
      description: "Visa & Medical Insurance",
      included: [
        "Complete visa processing",
        "Direct Debit for WPS salary",
        "VIP Chauffeur Service",
        "Medical examination",
        "Emirates ID processing",
        "2 Years Medical Insurance"
      ],
      notIncluded: ["End of service benefits"],
      highlight: true,
      color: "border-primary"
    },
    {
      name: "TADVISA++",
      price: "10,500",
      monthly: "168",
      description: "All-Inclusive Premium",
      included: [
        "Complete visa processing",
        "VIP Chauffeur Service",
        "Medical examination",
        "Emirates ID processing",
        "Medical Insurance (2 years)",
        "End of Service Benefits"
      ],
      notIncluded: [],
      highlight: false,
      color: "border-yellow-500"
    }
  ];

  const processSteps = [
    { icon: <MessageCircle className="w-8 h-8" />, title: "WhatsApp Us Your Maid Details", description: "Send us your maid's passport copy and basic information" },
    { icon: <FileCheck className="w-8 h-8" />, title: "Document Verification", description: "Our team verifies all documents and prepares application" },
    { icon: <Building className="w-8 h-8" />, title: "Medical & Emirates ID", description: "We arrange medical tests and Emirates ID with VIP transport" },
    { icon: <BadgeCheck className="w-8 h-8" />, title: "Visa Issued (2 Years)", description: "Your maid receives a fully legal 2-year UAE residence visa" }
  ];

  const whyChooseUs = [
    { icon: <Shield className="w-6 h-6" />, title: "MOHRE Licensed", description: "Official Tadbeer center approved by Ministry of Human Resources" },
    { icon: <Award className="w-6 h-6" />, title: "Zero Hidden Fees", description: "Transparent pricing with no surprise charges" },
    { icon: <Clock className="w-6 h-6" />, title: "Fast Processing", description: "Efficient visa processing within standard timeframes" },
    { icon: <Users className="w-6 h-6" />, title: "5000+ Visas Processed", description: "Trusted by thousands of families across UAE" },
    { icon: <ThumbsUp className="w-6 h-6" />, title: "100% Legal Compliance", description: "All processes follow UAE labor law requirements" },
    { icon: <Zap className="w-6 h-6" />, title: "VIP Transport Included", description: "Free chauffeur service for all appointments" }
  ];

  const testimonials = [
    { name: "Ahmed Al Mansouri", location: "Dubai", rating: 5, text: "Excellent service from start to finish. They processed my maid's visa in record time with zero hassle. Highly recommended!" },
    { name: "Sarah Johnson", location: "Abu Dhabi", rating: 5, text: "Very professional team. No hidden fees like other agencies. My helper got her visa within 2 weeks. Will definitely use again." },
    { name: "Mohammed Hassan", location: "Sharjah", rating: 5, text: "Best decision choosing TADVISAS. The VIP transport for medical was a huge help. Saved me so much time and stress!" }
  ];

  const trustBadges = [
    { icon: <Shield className="w-8 h-8" />, text: "MOHRE Licensed Tadbeer Center" },
    { icon: <Award className="w-8 h-8" />, text: "Government Approved" },
    { icon: <CheckCircle className="w-8 h-8" />, text: "Transparent Pricing" },
    { icon: <Zap className="w-8 h-8" />, text: "Fast Processing" },
    { icon: <Users className="w-8 h-8" />, text: "5000+ Visas Approved" }
  ];

  const faqs = [
    { question: "How long does the maid visa process take?", answer: "The complete visa process typically takes 2-3 weeks, depending on document verification and appointment availability. We ensure fast-track processing with our VIP service." },
    { question: "What documents are required for maid visa?", answer: "You'll need your Emirates ID, passport copy, tenancy contract or title deed, salary certificate, and your maid's passport with valid entry permit. We guide you through every step." },
    { question: "Are there any hidden fees or monthly charges?", answer: "No hidden fees! Our TADVISA package offers ZERO monthly admin fees. All costs are transparent and disclosed upfront before you proceed." },
    { question: "Can I transfer my existing maid's visa to TADMAIDS?", answer: "Yes, we handle visa transfers from other Tadbeer centers. The process is seamless and we take care of all the paperwork and cancellation procedures." }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <header className={`w-full z-50 transition-all duration-300 ${isHeaderSticky ? 'fixed top-0 left-0 right-0 bg-white shadow-lg' : 'relative bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex-shrink-0">
              <img
                src="/lovable-uploads/4e5c7620-b6a4-438c-a61b-eaa4f96ea0c2.png"
                alt="TADMAIDS"
                className="h-10 md:h-14 w-auto"
                draggable={false}
              />
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <a 
                href="tel:+971567222248"
                onClick={handleCallClick}
                className="flex items-center gap-2 text-primary hover:text-accent transition-all duration-300 font-semibold text-sm md:text-base hover:scale-105"
              >
                <Phone className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">+971 56 722 2248</span>
              </a>
              <Button 
                onClick={handleWhatsAppClick}
                className="bg-green-500 hover:bg-green-600 text-white text-sm md:text-base px-3 md:px-4 transition-all duration-300 hover:scale-105"
              >
                <MessageCircle className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {isHeaderSticky && <div className="h-16 md:h-20" />}

      {/* Hero Banner Section */}
      <section ref={formRef} className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-no-repeat"
          style={{ backgroundImage: `url(${heroBackground})`, backgroundPosition: 'left center' }}
        />
        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/60 to-primary/40" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Text Content */}
            <div className="text-white">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight drop-shadow-lg">
                Get Your 2-Year Maid Visa in UAE – <span className="text-fcg-gold-light">Fast, Legal & Hassle-Free</span>
              </h1>
              <p className="text-lg md:text-xl text-white/95 mb-6 leading-relaxed drop-shadow-md">
                MOHRE Licensed Tadbeer Center in Dubai. No hidden fees, no monthly charges. We handle everything from medical to Emirates ID with VIP transport included.
              </p>
              <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-8 text-base md:text-lg text-white/90 drop-shadow-md">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-5 h-5 text-green-400" /> Government Approved
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-5 h-5 text-green-400" /> 5000+ Visas Processed
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-5 h-5 text-green-400" /> Zero Admin Fees
                </span>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button onClick={handleWhatsAppClick} size="lg" className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  WhatsApp Now
                </Button>
                <Button onClick={handleCallClick} size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary text-lg px-8 transition-all duration-300 hover:scale-105">
                  <Phone className="w-5 h-5 mr-2" />
                  Call Us
                </Button>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-2xl">
              <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-6">GET YOUR MAID VISA</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <Input value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Your full name" className={errors.name ? 'border-red-500' : ''} />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <Input value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="+971 XX XXX XXXX" className={errors.phone ? 'border-red-500' : ''} />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <Input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="your.email@example.com" className={errors.email ? 'border-red-500' : ''} />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maid Nationality *</label>
                  <Select value={formData.nationality} onValueChange={(value) => handleInputChange('nationality', value)}>
                    <SelectTrigger className={errors.nationality ? 'border-red-500' : ''}><SelectValue placeholder="Select nationality" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PH">Philippines</SelectItem>
                      <SelectItem value="ID">Indonesia</SelectItem>
                      <SelectItem value="LK">Sri Lanka</SelectItem>
                      <SelectItem value="NP">Nepal</SelectItem>
                      <SelectItem value="BD">Bangladesh</SelectItem>
                      <SelectItem value="IN">India</SelectItem>
                      <SelectItem value="ET">Ethiopia</SelectItem>
                      <SelectItem value="OT">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.nationality && <p className="text-red-500 text-sm mt-1">{errors.nationality}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Visa Status *</label>
                  <Select value={formData.visaStatus} onValueChange={(value) => handleInputChange('visaStatus', value)}>
                    <SelectTrigger className={errors.visaStatus ? 'border-red-500' : ''}><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New Visa">Need new visa</SelectItem>
                      <SelectItem value="Transfer">Transfer existing visa</SelectItem>
                      <SelectItem value="Renewal">Renewal</SelectItem>
                      <SelectItem value="Not Sure">Not sure</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.visaStatus && <p className="text-red-500 text-sm mt-1">{errors.visaStatus}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                  <Textarea value={formData.message} onChange={(e) => handleInputChange('message', e.target.value)} placeholder="Tell us about your requirements..." rows={3} />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full bg-accent hover:bg-accent/90 text-white py-4 text-lg font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                  {isSubmitting ? 'Submitting...' : 'BOOK MY FREE CONSULTATION NOW'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="text-primary mb-3">{badge.icon}</div>
                <p className="text-sm font-semibold text-gray-800">{badge.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Who Is This Service For?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">Our 2-year maid visa service is designed for expat families and UAE residents who need reliable, legal domestic help.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="text-xl font-bold text-primary mb-3">Expat Families</h3>
              <p className="text-gray-600">Busy professionals who need reliable domestic help while maintaining full legal compliance with UAE labor laws.</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="text-xl font-bold text-primary mb-3">Homeowners</h3>
              <p className="text-gray-600">UAE residents who want to sponsor their own maid with a legal visa, ensuring peace of mind and avoiding monthly agency fees.</p>
            </div>
            <div className="bg-orange-50 rounded-2xl p-6 border-2 border-orange-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <div className="text-4xl mb-4">👶</div>
              <h3 className="text-xl font-bold text-primary mb-3">New Parents</h3>
              <p className="text-gray-600">Families with young children or elderly parents who require dedicated in-home care and support on a daily basis.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Our Maid Visa Packages</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">Complete 2-Year Maid Visa Solutions for UAE Residents</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {packages.map((pkg, index) => (
              <div key={index} className={`relative bg-white rounded-2xl p-6 shadow-lg border-4 ${pkg.color} ${pkg.highlight ? 'ring-4 ring-primary/20 scale-105' : ''} hover:shadow-2xl transition-all duration-300 hover:scale-[1.03]`}>
                {pkg.highlight && <div className="absolute -top-4 left-1/2 transform -translate-x-1/2"><span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">MOST POPULAR</span></div>}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-primary mb-2">{pkg.name}</h3>
                  <div className="mb-2"><span className="text-4xl font-bold text-primary">{pkg.price}</span><span className="text-gray-600"> AED</span></div>
                  <p className="text-sm text-gray-500">{pkg.monthly} AED/month</p>
                  <p className="text-sm text-primary font-medium mt-2">{pkg.description}</p>
                </div>
                <div className="space-y-2 mb-6">
                  {pkg.included.map((item, i) => (<div key={i} className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /><span className="text-sm text-gray-700">{item}</span></div>))}
                  {pkg.notIncluded.map((item, i) => (<div key={i} className="flex items-start gap-2"><X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" /><span className="text-sm text-gray-500">{item}</span></div>))}
                </div>
                <Button onClick={scrollToForm} className="w-full bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105">Get Started</Button>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Button onClick={scrollToForm} size="lg" className="bg-accent hover:bg-accent/90 text-white text-lg px-10 py-6 transition-all duration-300 hover:scale-110 hover:shadow-2xl">
              BOOK YOUR FREE CONSULTATION NOW <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Our Simple 4-Step Process</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">Get Your Maid Visa Processed Without the Stress</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <div key={index} className="relative text-center hover:scale-105 transition-all duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white mb-4">{step.icon}</div>
                <div className="absolute -top-2 left-1/2 transform -translate-x-8 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-lg">{index + 1}</div>
                <h3 className="text-lg font-bold text-primary mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-20 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose TADMAIDS?</h2>
            <p className="text-lg text-white/90 max-w-3xl mx-auto">Dubai's Trusted Tadbeer Center for Maid Visa Services</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="bg-white/10 backdrop-blur rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 text-accent">{item.icon}</div>
                  <div><h3 className="font-bold mb-1">{item.title}</h3><p className="text-white/80 text-sm">{item.description}</p></div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={handleWhatsAppClick} size="lg" className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 transition-all duration-300 hover:scale-110 hover:shadow-xl">
              <MessageCircle className="w-5 h-5 mr-2" />🟢 WhatsApp Now
            </Button>
            <Button onClick={handleCallClick} size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary text-lg px-8 transition-all duration-300 hover:scale-110">
              <Phone className="w-5 h-5 mr-2" />📞 Call for Visa Support
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">What Our Clients Say</h2>
            <p className="text-lg text-gray-600">Trusted by Thousands of UAE Families</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center gap-1 mb-4">{[...Array(testimonial.rating)].map((_, i) => (<Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />))}</div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">{testimonial.name.charAt(0)}</div>
                  <div><p className="font-bold text-primary">{testimonial.name}</p><p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {testimonial.location}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">Everything You Need to Know About Maid Visa in UAE</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {faqs.map((faq, index) => (
              <Accordion key={index} type="single" collapsible className="bg-gray-50 rounded-xl">
                <AccordionItem value={`faq-${index}`} className="border-none">
                  <AccordionTrigger className="px-6 py-4 text-left font-semibold text-primary hover:text-accent hover:no-underline">{faq.question}</AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-gray-600">{faq.answer}</AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA with Background */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-accent/90 to-primary/95" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url('/lovable-uploads/4e5c7620-b6a4-438c-a61b-eaa4f96ea0c2.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">Ready to Get Your Maid Visa Today?</h2>
          <p className="text-xl md:text-2xl mb-10 text-white/90">Start your hassle-free visa journey now. Get a FREE consultation from our visa experts!</p>
          <Button onClick={scrollToForm} size="lg" className="bg-white text-primary hover:bg-gray-100 text-xl px-12 py-8 font-bold transition-all duration-300 hover:scale-110 hover:shadow-2xl">
            BOOK YOUR FREE CONSULTATION NOW
          </Button>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-6 bg-gray-900 text-center">
        <p className="text-gray-400 text-sm">All Rights Reserved 2026 @ TADMAIDS DOMESTIC WORKERS SERVICES CENTER L.L.C</p>
      </footer>
    </div>
  );
};

export default MaidVisaServiceLanding;
