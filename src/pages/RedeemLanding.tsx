import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Phone, MessageCircle, CheckCircle, Shield, Award, Clock,
  Users, Zap, Gift, Sparkles, Star, ArrowRight, PartyPopper, Tag
} from "lucide-react";
import { trackContact, trackLead } from "@/lib/metaTracking";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RedeemLanding = () => {
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    serviceType: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Full name is required';

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

    if (!formData.serviceType) newErrors.serviceType = 'Please select a service';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      // Save to leads table
      const { error } = await supabase.from('leads').insert([{
        client_name: formData.name,
        mobile_number: formData.phone,
        email: formData.email,
        service_required: formData.serviceType,
        comments: `[Source: /redeem]\n[New Follower 5% Discount Claim]\n[Service: ${formData.serviceType}]`,
        lead_source: 'Redeem: New Follower',
        status: 'New Lead' as const,
      }]);

      if (error) throw error;

      // Send email notification via edge function
      supabase.functions.invoke('send-landing-lead-email', {
        body: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          serviceType: formData.serviceType,
          leadSource: 'Redeem: New Follower',
          pageType: 'redeem',
        }
      }).catch(err => console.error('Email notification failed:', err));

      // Track conversion
      if ((window as any).gtag) {
        (window as any).gtag('event', 'conversion', {
          'send_to': 'AW-17918343259/ucbYCIqSm_AbENvwkOBC',
          'value': 1.0,
          'currency': 'AED'
        });
      }

      await trackLead({
        email: formData.email,
        phone: formData.phone,
        first_name: formData.name.split(' ')[0]
      });

      navigate('/thank-you');
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleWhatsAppClick = () => {
    trackContact();
    const message = "Hi! I'm a new follower and I'd like to claim my 5% discount. Can you help?";
    window.open(`https://wa.me/971567222248?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCallClick = () => {
    trackContact();
    if ((window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': 'AW-17918343259/CqN5CN-Uj_AbENvwkOBC',
        'value': 1.0,
        'currency': 'AED'
      });
    }
    window.location.href = "tel:+971567222248";
  };

  const services = [
    { value: "Monthly Maid", label: "Monthly Maid – from AED 2,100/month" },
    { value: "2-Year Contract", label: "2-Year Maid Contract – from AED 8,400" },
    { value: "Temporary Maid", label: "Temporary Maid – 1 Month+" },
    { value: "TADVISA", label: "TADVISA – Visa Only – AED 8,925" },
    { value: "TADVISA+", label: "TADVISA+ – Visa & Insurance – AED 8,400 + 150/mo" },
    { value: "TADVISA++", label: "TADVISA++ – All-Inclusive – AED 10,500 + 168/mo" },
  ];

  const trustPoints = [
    { icon: <Shield className="w-6 h-6" />, text: "MOHRE Licensed Tadbeer Center" },
    { icon: <Users className="w-6 h-6" />, text: "1700+ Families Served" },
    { icon: <Award className="w-6 h-6" />, text: "Since 2005 in UAE" },
    { icon: <Zap className="w-6 h-6" />, text: "3-7 Day Placement" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <img
            src="/lovable-uploads/4e5c7620-b6a4-438c-a61b-eaa4f96ea0c2.png"
            alt="TADMAIDS"
            className="h-10 md:h-14 w-auto"
            draggable={false}
          />
          <div className="flex items-center gap-2">
            <a
              href="tel:+971567222248"
              onClick={handleCallClick}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden md:inline">+971 56 722 2248</span>
            </a>
            <button
              onClick={handleWhatsAppClick}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors text-sm font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden md:inline">WhatsApp</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-accent overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-white rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
          {/* Discount badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-5 py-2 mb-6">
            <Tag className="w-4 h-4 text-yellow-300" />
            <span className="text-white/90 text-sm font-semibold tracking-wide uppercase">Exclusive Follower Offer</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-4">
            Claim Your{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-yellow-300">5% Discount</span>
              <span className="absolute inset-x-0 bottom-0 h-3 bg-yellow-300/30 -skew-x-3 rounded" />
            </span>
            {" "}Now
          </h1>

          <p className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto mb-8 leading-relaxed">
            Welcome to the TADMAIDS family! As a new follower, enjoy an exclusive 5% off on any of our maid services or visa packages.
          </p>

          <Button
            onClick={scrollToForm}
            size="lg"
            className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-lg px-8 py-6 rounded-full shadow-2xl shadow-yellow-400/30 hover:shadow-yellow-300/40 transition-all duration-300 hover:scale-105"
          >
            <Gift className="w-5 h-5 mr-2" />
            <span className="hidden md:inline">Claim My Discount Now</span>
            <span className="md:hidden">Claim Now</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-muted border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:flex md:justify-center md:gap-10 gap-4">
            {trustPoints.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 justify-center">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                  {item.icon}
                </div>
                <span className="text-sm font-semibold text-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 md:py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-3">
            How to Redeem Your 5% Discount
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
            It only takes 3 simple steps to unlock your exclusive follower discount.
          </p>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: <Sparkles className="w-8 h-8" />, step: "1", title: "Fill the Form Below", desc: "Enter your name, email, phone and select a service you're interested in." },
              { icon: <MessageCircle className="w-8 h-8" />, step: "2", title: "We Contact You Back", desc: "Our team will reach out within hours with your personalized discounted quote." },
              { icon: <CheckCircle className="w-8 h-8" />, step: "3", title: "Enjoy 5% Off", desc: "Your discount is automatically applied when you confirm your booking." },
            ].map((item, i) => (
              <div key={i} className="relative bg-card border border-border rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mx-auto mb-4 mt-2">
                  {item.icon}
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-14 md:py-20 bg-muted" ref={formRef}>
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            {/* Form header */}
            <div className="bg-gradient-to-r from-primary to-accent px-6 py-5 text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-3">
                <Tag className="w-4 h-4 text-yellow-300" />
                <span className="text-white text-xs font-bold uppercase tracking-wider">5% Off – Limited Time</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Claim Your Discount
              </h2>
              <p className="text-white/80 text-sm mt-1">Fill in your details and we'll contact you with your discount</p>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Full Name *</label>
                <Input
                  placeholder="e.g. Sarah Ahmed"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Email Address *</label>
                <Input
                  type="email"
                  placeholder="e.g. sarah@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Phone Number *</label>
                <Input
                  type="tel"
                  placeholder="e.g. +971 56 722 2248"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Service You're Interested In *</label>
                <Select
                  value={formData.serviceType}
                  onValueChange={(value) => handleInputChange('serviceType', value)}
                >
                  <SelectTrigger className={errors.serviceType ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select a service or package" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.serviceType && <p className="text-destructive text-xs mt-1">{errors.serviceType}</p>}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    CONTACT ME BACK
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center pt-1">
                Your information is secure. We'll contact you within a few hours.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-14 md:py-20 bg-gradient-to-br from-primary to-accent text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Prefer to Talk to Us Directly?
          </h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">
            Our team is ready to help you choose the best service and apply your 5% discount instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleWhatsAppClick}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-green-500 hover:bg-green-400 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="hidden md:inline">Chat on WhatsApp</span>
              <span className="md:hidden">WhatsApp Us</span>
            </button>
            <a
              href="tel:+971567222248"
              onClick={handleCallClick}
              className="flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-white bg-transparent text-white hover:bg-white hover:text-primary font-bold rounded-full shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Phone className="w-5 h-5" />
              <span className="hidden md:inline">Call +971 56 722 2248</span>
              <span className="md:hidden">Call Now</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white/60 text-center py-6 text-xs">
        <p>&copy; {new Date().getFullYear()} TADMAIDS. All rights reserved. MOHRE Licensed Tadbeer Center.</p>
      </footer>
    </div>
  );
};

export default RedeemLanding;
