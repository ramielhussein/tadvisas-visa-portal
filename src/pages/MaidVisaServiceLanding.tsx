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
  MapPin, FileText, ClipboardCheck, Landmark
} from "lucide-react";
import { trackContact, trackLead } from "@/lib/metaTracking";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import heroBackground from "@/assets/hero-maid-visa-bg.jpg";
import audienceExpatFamily from "@/assets/audience-expat-family.jpg";
import audienceHomeowners from "@/assets/audience-homeowners.jpg";
import audienceNewParents from "@/assets/audience-new-parents.jpg";
import whyChooseBg from "@/assets/why-choose-tadmaids-bg.jpg";

const LANDING_PAGE_URL = "/maid-visa-service-uae-lp";

// Extract UTM parameters from URL for source tracking
const getUtmParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    utm_term: params.get('utm_term'),
    gclid: params.get('gclid'), // Google Ads click ID
    fbclid: params.get('fbclid'), // Meta/Facebook click ID
  };
};

// Generate lead source based on UTM params
const generateLeadSource = () => {
  const utm = getUtmParams();
  
  // Google Ads detection
  if (utm.gclid || utm.utm_source?.toLowerCase().includes('google')) {
    return `Google Ads${utm.utm_campaign ? ` - ${utm.utm_campaign}` : ''}`;
  }
  
  // Meta/Facebook Ads detection
  if (utm.fbclid || utm.utm_source?.toLowerCase().includes('facebook') || utm.utm_source?.toLowerCase().includes('meta') || utm.utm_source?.toLowerCase().includes('instagram')) {
    return `Meta Ads${utm.utm_campaign ? ` - ${utm.utm_campaign}` : ''}`;
  }
  
  // Other UTM sources
  if (utm.utm_source) {
    const source = utm.utm_source.charAt(0).toUpperCase() + utm.utm_source.slice(1);
    return `${source}${utm.utm_medium ? ` (${utm.utm_medium})` : ''}${utm.utm_campaign ? ` - ${utm.utm_campaign}` : ''}`;
  }
  
  // Default fallback
  return 'LP: Maid Visa UAE';
};

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
      const leadSource = generateLeadSource();
      const utm = getUtmParams();
      
      // Build detailed source info for comments
      const sourceDetails = [
        formData.message,
        '',
        `[Source: ${LANDING_PAGE_URL}]`,
        utm.utm_source ? `[UTM Source: ${utm.utm_source}]` : '',
        utm.utm_medium ? `[UTM Medium: ${utm.utm_medium}]` : '',
        utm.utm_campaign ? `[UTM Campaign: ${utm.utm_campaign}]` : '',
        utm.gclid ? `[Google Click ID: ${utm.gclid}]` : '',
        utm.fbclid ? `[Meta Click ID: ${utm.fbclid}]` : '',
      ].filter(Boolean).join('\n');
      
      // Save to database with dynamic lead source
      const { error } = await supabase.from('leads').insert([{
        client_name: formData.name,
        mobile_number: formData.phone,
        email: formData.email,
        nationality_code: formData.nationality,
        service_required: formData.visaStatus,
        comments: sourceDetails,
        lead_source: leadSource,
        status: 'New Lead' as const
      }]);

      if (error) throw error;

      // Send email notification (fire and forget - don't block form submission)
      supabase.functions.invoke('send-landing-lead-email', {
        body: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          nationality: formData.nationality,
          visaStatus: formData.visaStatus,
          message: formData.message,
          leadSource: leadSource,
          utmParams: utm
        }
      }).catch(err => console.error('Email notification failed:', err));

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
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error?.message || 'Something went wrong. Please try again or call us directly.');
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
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-5 h-5 text-green-400" /> We Handle All Paperwork
                </span>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button onClick={handleWhatsAppClick} size="lg" className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  WhatsApp Now
                </Button>
                <Button onClick={handleCallClick} size="lg" variant="outline" className="border-2 border-white bg-white/20 text-white hover:bg-white hover:text-primary text-lg px-8 transition-all duration-300 hover:scale-105">
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
      <section className="py-16 md:py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">This Service Is For You If...</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our 2-year maid visa service is designed for UAE residents who already have a domestic helper and need legal sponsorship.
            </p>
          </div>

          {/* Eligibility Criteria - Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
            {/* This Is For You */}
            <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-200 shadow-md">
              <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                Perfect For You If:
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">You already have a maid</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Maid visa is expiring / needs renewal</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">You want 2-year legal sponsorship</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">Golden Visa holders</span>
                </li>
              </ul>
            </div>

            {/* This Is NOT For */}
            <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200 shadow-md">
              <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                <X className="w-6 h-6" />
                Not For:
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Hiring a new maid</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Temporary or part-time maid arrangements</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Persona Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Expat Families Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
              <div className="h-48 overflow-hidden">
                <img 
                  src={audienceExpatFamily} 
                  alt="Expat family in Dubai" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-5 bg-gradient-to-br from-blue-50 to-white border-t-4 border-primary">
                <h3 className="text-lg font-bold text-primary mb-2">Busy Expat Families</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Already have a helper? We'll handle the visa paperwork so you can focus on family.
                </p>
              </div>
            </div>

            {/* Homeowners Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
              <div className="h-48 overflow-hidden">
                <img 
                  src={audienceHomeowners} 
                  alt="UAE homeowners" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-5 bg-gradient-to-br from-green-50 to-white border-t-4 border-green-500">
                <h3 className="text-lg font-bold text-primary mb-2">Property Owners & Golden Visa Holders</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Sponsor your maid with a legal 2-year visa. Zero monthly fees.
                </p>
              </div>
            </div>

            {/* Visa Renewal Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
              <div className="h-48 overflow-hidden">
                <img 
                  src={audienceNewParents} 
                  alt="Growing family with helper" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-5 bg-gradient-to-br from-orange-50 to-white border-t-4 border-orange-400">
                <h3 className="text-lg font-bold text-primary mb-2">Visa Expiring Soon?</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Renew or transfer your maid's visa seamlessly. We handle everything.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Maid Visa Services Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Our Maid Visa Services Include</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Comprehensive visa solutions tailored for UAE residents with domestic helpers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Maid Visa Renewal */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Maid Visa Renewal in Dubai</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Seamless renewal process for your helper's expiring visa. We handle all GDRFA submissions and approvals.
              </p>
            </div>

            {/* Tadbeer Sponsorship */}
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 border border-green-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                <Shield className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Tadbeer Maid Visa Sponsorship</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Legal 2-year sponsorship through our licensed Tadbeer center. Full compliance with UAE labor laws.
              </p>
            </div>

            {/* Golden Visa Sponsorship */}
            <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-6 border border-amber-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                <Award className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Golden Visa Maid Sponsorship</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Special visa processing for Golden Visa holders. Sponsor your helper under your premium residency.
              </p>
            </div>

            {/* Housemaid Visa Processing */}
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 border border-purple-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
              <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Housemaid Visa Processing</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Complete end-to-end visa processing for your domestic helper. From application to stamping.
              </p>
            </div>

            {/* Documents Support */}
            <div className="bg-gradient-to-br from-teal-50 to-white rounded-2xl p-6 border border-teal-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
              <div className="w-14 h-14 rounded-full bg-teal-500/10 flex items-center justify-center mb-4 group-hover:bg-teal-500/20 transition-colors">
                <ClipboardCheck className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Visa Renewal Documents Support</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Expert guidance on required documents. We ensure your paperwork is complete and accurate.
              </p>
            </div>

            {/* GDRFA & Amer Processing */}
            <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 border border-orange-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
              <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                <Landmark className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">GDRFA & Amer Processing</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Direct liaison with immigration authorities. Fast-track your applications through official channels.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button 
              onClick={scrollToForm} 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white text-lg px-10 py-6 transition-all duration-300 hover:scale-110 hover:shadow-2xl"
            >
              Get Your Free Visa Consultation <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Our Maid Visa Packages</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">Complete 2-Year Maid Visa Solutions for UAE Residents</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <div 
                key={index} 
                className={`relative bg-white rounded-2xl p-6 shadow-lg border-4 ${pkg.color} ${pkg.highlight ? 'ring-4 ring-primary/20 md:scale-105' : ''} hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 isolate z-0 hover:z-10`}
              >
                {pkg.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">MOST POPULAR</span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-primary mb-2">{pkg.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-primary">{pkg.price}</span>
                    <span className="text-gray-600"> AED</span>
                  </div>
                  <p className="text-sm text-gray-500">{pkg.monthly} AED/month</p>
                  <p className="text-sm text-primary font-medium mt-2">{pkg.description}</p>
                </div>
                <div className="space-y-2 mb-6">
                  {pkg.included.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                  {pkg.notIncluded.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-500">{item}</span>
                    </div>
                  ))}
                </div>
                <Button onClick={scrollToForm} className="w-full bg-primary hover:bg-primary/90 transition-all duration-300">
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section - Premium Design */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-blue-50/30 to-amber-50/20" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-amber-500" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary font-semibold text-sm rounded-full mb-4">
              SIMPLE & STRESS-FREE
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4">
              Your Visa Journey in <span className="text-amber-500">4 Easy Steps</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              While you focus on your family, we handle everything – from documents to doorstep delivery
            </p>
          </div>

          {/* Process Steps */}
          <div className="relative">
            {/* Connecting Line - Desktop */}
            <div className="hidden lg:block absolute top-24 left-[12%] right-[12%] h-1 bg-gradient-to-r from-primary via-accent to-amber-500 rounded-full" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
              {/* Step 1 */}
              <div className="group relative">
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full">
                  {/* Step Number */}
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg ring-4 ring-white">
                    1
                  </div>
                  
                  {/* Icon */}
                  <div className="mt-4 mb-6 flex justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <MessageCircle className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold text-primary mb-3 text-center">WhatsApp Us</h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    Send your maid's passport copy and basic info. We respond within <span className="font-semibold text-primary">30 minutes</span>.
                  </p>
                  
                  {/* Time indicator */}
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                    <Clock className="w-4 h-4" />
                    <span>5 minutes</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group relative">
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full">
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg ring-4 ring-white">
                    2
                  </div>
                  
                  <div className="mt-4 mb-6 flex justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FileCheck className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-primary mb-3 text-center">We Verify & Prepare</h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    Our experts verify documents, prepare applications, and handle all <span className="font-semibold text-primary">GDRFA submissions</span>.
                  </p>
                  
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600 font-medium">
                    <Clock className="w-4 h-4" />
                    <span>1-2 days</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group relative">
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full">
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg ring-4 ring-white">
                    3
                  </div>
                  
                  <div className="mt-4 mb-6 flex justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Building className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-primary mb-3 text-center">Medical & Emirates ID</h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    We arrange appointments with <span className="font-semibold text-primary">FREE VIP chauffeur</span> for all medical and ID processing.
                  </p>
                  
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-purple-600 font-medium">
                    <Clock className="w-4 h-4" />
                    <span>3-5 days</span>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="group relative">
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full relative overflow-hidden">
                  {/* Premium highlight */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-400/20 to-amber-500/10 rounded-bl-full" />
                  
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-lg ring-4 ring-white">
                    4
                  </div>
                  
                  <div className="mt-4 mb-6 flex justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <BadgeCheck className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-primary mb-3 text-center">2-Year Visa Issued! 🎉</h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    Your maid receives a <span className="font-semibold text-amber-600">fully legal 2-year UAE residence visa</span>. Done!
                  </p>
                  
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-600 font-medium">
                    <Clock className="w-4 h-4" />
                    <span>Total: ~2 weeks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-6 text-lg">Ready to start your hassle-free visa journey?</p>
            <Button 
              onClick={scrollToForm} 
              size="lg" 
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white text-lg px-10 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              Start My Visa Process Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose TADMAIDS - Premium Split Section */}
      <section className="relative overflow-hidden">
        <div className="flex flex-col lg:flex-row min-h-[800px]">
          {/* Left Side - Image with Light Overlay */}
          <div className="relative lg:w-1/2 h-[400px] lg:h-auto">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${whyChooseBg})` }}
            />
            {/* Subtle overlay to blend */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/30 lg:to-primary/50" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent lg:hidden" />
            
            {/* Floating Stats on Image - Mobile */}
            <div className="absolute bottom-6 left-6 right-6 lg:hidden">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg">
                  <div className="text-2xl font-bold text-primary">19+</div>
                  <div className="text-xs text-gray-600">Years Experience</div>
                </div>
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg">
                  <div className="text-2xl font-bold text-primary">5000+</div>
                  <div className="text-xs text-gray-600">Visas Processed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="lg:w-1/2 bg-gradient-to-br from-primary via-primary to-accent py-16 lg:py-20 px-6 lg:px-12 xl:px-16 relative">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
            
            <div className="relative z-10 max-w-xl">
              {/* Section Header */}
              <span className="inline-block px-4 py-2 bg-amber-500/20 text-amber-300 font-semibold text-sm rounded-full mb-6 border border-amber-400/30">
                TRUSTED BY 5000+ UAE FAMILIES
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                Why Choose <span className="text-amber-400">TADMAIDS?</span>
              </h2>
              <p className="text-lg text-white/90 mb-10">
                Dubai's Premier Government-Licensed Tadbeer Center – We Handle the Stress So You Don't Have To
              </p>

              {/* Benefits List */}
              <div className="space-y-4 mb-10">
                {whyChooseUs.slice(0, 4).map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 hover:border-amber-400/30 transition-all duration-300"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                      <div className="text-white [&>svg]:w-6 [&>svg]:h-6">{item.icon}</div>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base mb-1">{item.title}</h3>
                      <p className="text-white/70 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust Stats - Desktop Only */}
              <div className="hidden lg:flex gap-6 mb-10 pb-8 border-b border-white/20">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-400">19+</div>
                  <div className="text-white/70 text-xs">Years</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-400">5000+</div>
                  <div className="text-white/70 text-xs">Visas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-400">100%</div>
                  <div className="text-white/70 text-xs">Legal</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-400">24/7</div>
                  <div className="text-white/70 text-xs">Support</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <p className="text-white/80 text-sm mb-4">
                  <span className="font-semibold text-amber-300">Stop worrying about visa paperwork.</span> Get expert help now!
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleWhatsAppClick} 
                    size="lg" 
                    className="bg-green-500 hover:bg-green-600 text-white text-base px-8 py-5 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex-1"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    WhatsApp Now
                  </Button>
                  <Button 
                    onClick={handleCallClick} 
                    size="lg" 
                    className="bg-white text-primary hover:bg-amber-50 text-base px-8 py-5 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex-1"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Call Us
                  </Button>
                </div>
                <p className="text-white/60 text-xs text-center mt-4">
                  Available 7 days a week • Response within 5 minutes
                </p>
              </div>
            </div>
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
