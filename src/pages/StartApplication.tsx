import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Phone, MessageCircle, CheckCircle, Shield, Award, Users, Zap,
  ArrowRight, ChevronLeft, ChevronRight, FileText, Upload, User, Briefcase, Camera
} from "lucide-react";
import { trackContact, trackLead } from "@/lib/metaTracking";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const nationalities = [
  { code: "PH", label: "Philippines" },
  { code: "UG", label: "Uganda" },
  { code: "ET", label: "Ethiopia" },
  { code: "ID", label: "Indonesia" },
  { code: "IN", label: "India" },
  { code: "LK", label: "Sri Lanka" },
  { code: "NP", label: "Nepal" },
  { code: "BD", label: "Bangladesh" },
  { code: "KE", label: "Kenya" },
  { code: "GH", label: "Ghana" },
  { code: "NG", label: "Nigeria" },
  { code: "CM", label: "Cameroon" },
  { code: "TZ", label: "Tanzania" },
  { code: "MM", label: "Myanmar" },
];

const religions = ["Christian", "Muslim", "Hindu", "Buddhist", "Other"];
const maritalStatuses = ["Single", "Married", "Divorced", "Widowed"];
const maidStatuses = ["Ex-Abroad", "First Timer"];
const jobOptions = ["Housemaid", "Nanny", "Cook", "Caregiver", "Driver", "Tutor", "Cleaner"];
const educationTracks = ["Primary", "Secondary", "College", "University", "Vocational", "None"];
const experienceCountries = ["UAE", "Saudi Arabia", "Kuwait", "Qatar", "Bahrain", "Oman", "Jordan", "Lebanon", "Hong Kong", "Singapore", "Malaysia", "None"];

const STEPS = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "work", label: "Work & Experience", icon: Briefcase },
  { id: "documents", label: "Documents", icon: FileText },
];

const StartApplication = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    date_of_birth: "",
    nationality_code: "",
    religion: "",
    marital_status: "",
    height_cm: "",
    weight_kg: "",
    maid_status: "",
    job1: "",
    job2: "",
    education_track: "",
    experience_country: "",
    experience_years: "",
    passport_no: "",
    passport_expiry: "",
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleFileChange = (type: "photo" | "passport", file: File | null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === "photo") {
        setPhotoFile(file);
        setPhotoPreview(reader.result as string);
      } else {
        setPassportFile(file);
        setPassportPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
    if (errors[type]) setErrors(prev => { const n = { ...prev }; delete n[type]; return n; });
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.name.trim()) newErrors.name = "Name is required";
      if (!formData.mobile_number.trim() || formData.mobile_number.replace(/\D/g, "").length < 7)
        newErrors.mobile_number = "Valid phone number required";
      if (!formData.date_of_birth) newErrors.date_of_birth = "Date of birth required";
      if (!formData.nationality_code) newErrors.nationality_code = "Nationality required";
      if (!formData.religion) newErrors.religion = "Religion required";
      if (!formData.marital_status) newErrors.marital_status = "Marital status required";
    } else if (step === 1) {
      if (!formData.maid_status) newErrors.maid_status = "Status required";
      if (!formData.job1) newErrors.job1 = "Primary job required";
    } else if (step === 2) {
      if (!formData.passport_no.trim()) newErrors.passport_no = "Passport number required";
      if (!formData.passport_expiry) newErrors.passport_expiry = "Passport expiry required";
      if (!photoFile) newErrors.photo = "Photo is required";
      if (!passportFile) newErrors.passport = "Passport scan is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast.error("Please fill all required fields");
      return;
    }
    setCurrentStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!validateStep(2)) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert files to base64
      const toBase64 = (file: File): Promise<{ data: string; name: string; type: string }> =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ data: reader.result as string, name: file.name, type: file.type });
          reader.readAsDataURL(file);
        });

      const filesBase64: Record<string, any> = {};
      if (photoFile) filesBase64.photo = await toBase64(photoFile);
      if (passportFile) filesBase64.passport = await toBase64(passportFile);

      const experience = formData.experience_country && formData.experience_country !== "None"
        ? [{ country: formData.experience_country, years: parseInt(formData.experience_years) || 1 }]
        : [];

      const payload = {
        staff: false,
        name: formData.name,
        passport_no: formData.passport_no,
        passport_expiry: formData.passport_expiry,
        nationality_code: formData.nationality_code,
        date_of_birth: formData.date_of_birth,
        religion: formData.religion,
        maid_status: formData.maid_status,
        job1: formData.job1,
        job2: formData.job2 || null,
        height_cm: parseInt(formData.height_cm) || null,
        weight_kg: parseInt(formData.weight_kg) || null,
        marital_status: formData.marital_status,
        children: 0,
        languages: [{ name: "English", level: "Basic" }],
        education: { track: formData.education_track || "Secondary" },
        experience,
        skills: {
          baby_sit: false, new_born: false, iron: false, wash: false,
          dish_wash: false, clean: true, drive: false, cook: false,
          tutor: false, housekeeping: true, computer_skills: false,
        },
        visa: { status: "No Visa" },
        files: filesBase64,
        financials: { costs: [], revenues: [] },
        consent: true,
        mobile_number: formData.mobile_number.replace(/[^\d+]/g, ""),
        public_submission: true,
      };

      const { data, error } = await supabase.functions.invoke("submit-cv", { body: payload });
      if (error) throw error;
      if (data?.success === false) throw new Error(data.error || "Submission failed");

      // Send email notification
      supabase.functions.invoke("send-landing-lead-email", {
        body: {
          name: formData.name,
          phone: formData.mobile_number,
          email: "",
          serviceType: `CV Application - ${formData.job1}`,
          leadSource: "LP: Start Application",
          pageType: "application",
          nationality: formData.nationality_code,
        },
      }).catch(err => console.error("Email notification failed:", err));

      // Track conversion
      if ((window as any).gtag) {
        (window as any).gtag("event", "conversion", {
          send_to: "AW-17918343259/ucbYCIqSm_AbENvwkOBC",
          value: 1.0,
          currency: "AED",
        });
      }
      await trackLead({ phone: formData.mobile_number, first_name: formData.name.split(" ")[0] });

      setSubmitted(true);
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppClick = () => {
    trackContact();
    window.open("https://wa.me/971567222248?text=" + encodeURIComponent("Hi! I'd like to apply as a domestic worker."), "_blank");
  };

  const handleCallClick = () => {
    trackContact();
    if ((window as any).gtag) {
      (window as any).gtag("event", "conversion", { send_to: "AW-17918343259/CqN5CN-Uj_AbENvwkOBC", value: 1.0, currency: "AED" });
    }
    window.location.href = "tel:+971567222248";
  };

  const trustPoints = [
    { icon: <Shield className="w-5 h-5" />, text: "MOHRE Licensed" },
    { icon: <Users className="w-5 h-5" />, text: "1700+ Workers Placed" },
    { icon: <Award className="w-5 h-5" />, text: "Since 2005" },
    { icon: <Zap className="w-5 h-5" />, text: "Fast Processing" },
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-card border border-border rounded-2xl p-8 shadow-xl">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Application Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            Thank you for applying. We will review your CV and contact you soon on your phone number.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleWhatsAppClick}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-full transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              Chat on WhatsApp
            </button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Submit Another Application
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100;

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

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-12 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-5 py-2 mb-6">
            <FileText className="w-4 h-4 text-emerald-200" />
            <span className="text-white/90 text-sm font-semibold tracking-wide uppercase">Worker Application</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
            Apply as a{" "}
            <span className="text-emerald-200">Domestic Worker</span>
          </h1>
          <p className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto mb-6 leading-relaxed">
            Join TADMAIDS and find your next opportunity in the UAE. Simple 3-step application — just fill your details and upload your documents.
          </p>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-muted border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="grid grid-cols-2 md:flex md:justify-center md:gap-10 gap-4">
            {trustPoints.map((item, i) => (
              <div key={i} className="flex items-center gap-2 justify-center">
                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                  {item.icon}
                </div>
                <span className="text-sm font-semibold text-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-10 md:py-16 bg-background">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            {/* Step Indicator */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-600 px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="flex items-center gap-1.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        i <= currentStep ? "bg-white text-emerald-700" : "bg-white/20 text-white/60"
                      }`}>
                        {i < currentStep ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span className={`text-xs font-medium hidden sm:inline ${
                        i <= currentStep ? "text-white" : "text-white/50"
                      }`}>{step.label}</span>
                      {i < STEPS.length - 1 && (
                        <div className={`w-8 md:w-16 h-0.5 mx-1 ${i < currentStep ? "bg-white" : "bg-white/20"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <Progress value={progress} className="h-1.5 bg-white/20" />
              <p className="text-white/70 text-xs mt-2">Step {currentStep + 1} of {STEPS.length}</p>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-5">
              {/* Step 1: Personal Info */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground">Personal Information</h3>

                  <div>
                    <Label className="font-semibold">Full Name *</Label>
                    <Input placeholder="e.g. Maria Santos" value={formData.name} onChange={e => handleInputChange("name", e.target.value)} className={errors.name ? "border-destructive" : ""} />
                    {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label className="font-semibold">Mobile Number (with country code) *</Label>
                    <Input type="tel" placeholder="+63 917 123 4567" value={formData.mobile_number} onChange={e => handleInputChange("mobile_number", e.target.value)} className={errors.mobile_number ? "border-destructive" : ""} />
                    {errors.mobile_number && <p className="text-destructive text-xs mt-1">{errors.mobile_number}</p>}
                  </div>

                  <div>
                    <Label className="font-semibold">Date of Birth *</Label>
                    <Input type="date" value={formData.date_of_birth} onChange={e => handleInputChange("date_of_birth", e.target.value)} className={errors.date_of_birth ? "border-destructive" : ""} />
                    {errors.date_of_birth && <p className="text-destructive text-xs mt-1">{errors.date_of_birth}</p>}
                  </div>

                  <div>
                    <Label className="font-semibold">Nationality *</Label>
                    <Select value={formData.nationality_code} onValueChange={v => handleInputChange("nationality_code", v)}>
                      <SelectTrigger className={errors.nationality_code ? "border-destructive" : ""}><SelectValue placeholder="Select nationality" /></SelectTrigger>
                      <SelectContent>
                        {nationalities.map(n => <SelectItem key={n.code} value={n.code}>{n.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.nationality_code && <p className="text-destructive text-xs mt-1">{errors.nationality_code}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold">Religion *</Label>
                      <Select value={formData.religion} onValueChange={v => handleInputChange("religion", v)}>
                        <SelectTrigger className={errors.religion ? "border-destructive" : ""}><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {religions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {errors.religion && <p className="text-destructive text-xs mt-1">{errors.religion}</p>}
                    </div>
                    <div>
                      <Label className="font-semibold">Marital Status *</Label>
                      <Select value={formData.marital_status} onValueChange={v => handleInputChange("marital_status", v)}>
                        <SelectTrigger className={errors.marital_status ? "border-destructive" : ""}><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {maritalStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {errors.marital_status && <p className="text-destructive text-xs mt-1">{errors.marital_status}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold">Height (cm)</Label>
                      <Input type="number" placeholder="e.g. 155" value={formData.height_cm} onChange={e => handleInputChange("height_cm", e.target.value)} />
                    </div>
                    <div>
                      <Label className="font-semibold">Weight (kg)</Label>
                      <Input type="number" placeholder="e.g. 55" value={formData.weight_kg} onChange={e => handleInputChange("weight_kg", e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Work & Experience */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground">Work & Experience</h3>

                  <div>
                    <Label className="font-semibold">Current Status *</Label>
                    <Select value={formData.maid_status} onValueChange={v => handleInputChange("maid_status", v)}>
                      <SelectTrigger className={errors.maid_status ? "border-destructive" : ""}><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        {maidStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.maid_status && <p className="text-destructive text-xs mt-1">{errors.maid_status}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold">Primary Job *</Label>
                      <Select value={formData.job1} onValueChange={v => handleInputChange("job1", v)}>
                        <SelectTrigger className={errors.job1 ? "border-destructive" : ""}><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {jobOptions.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {errors.job1 && <p className="text-destructive text-xs mt-1">{errors.job1}</p>}
                    </div>
                    <div>
                      <Label className="font-semibold">Secondary Job</Label>
                      <Select value={formData.job2} onValueChange={v => handleInputChange("job2", v)}>
                        <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                        <SelectContent>
                          {jobOptions.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="font-semibold">Education Level</Label>
                    <Select value={formData.education_track} onValueChange={v => handleInputChange("education_track", v)}>
                      <SelectTrigger><SelectValue placeholder="Select education" /></SelectTrigger>
                      <SelectContent>
                        {educationTracks.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold">Experience Country</Label>
                      <Select value={formData.experience_country} onValueChange={v => handleInputChange("experience_country", v)}>
                        <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                        <SelectContent>
                          {experienceCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="font-semibold">Years of Experience</Label>
                      <Input type="number" placeholder="e.g. 2" value={formData.experience_years} onChange={e => handleInputChange("experience_years", e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Documents */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground">Passport & Photo</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold">Passport Number *</Label>
                      <Input placeholder="e.g. P1234567" value={formData.passport_no} onChange={e => handleInputChange("passport_no", e.target.value)} className={errors.passport_no ? "border-destructive" : ""} />
                      {errors.passport_no && <p className="text-destructive text-xs mt-1">{errors.passport_no}</p>}
                    </div>
                    <div>
                      <Label className="font-semibold">Passport Expiry *</Label>
                      <Input type="date" value={formData.passport_expiry} onChange={e => handleInputChange("passport_expiry", e.target.value)} className={errors.passport_expiry ? "border-destructive" : ""} />
                      {errors.passport_expiry && <p className="text-destructive text-xs mt-1">{errors.passport_expiry}</p>}
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <Label className="font-semibold">Your Photo *</Label>
                    <label className={`mt-1 flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                      errors.photo ? "border-destructive bg-destructive/5" : "border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}>
                      {photoPreview ? (
                        <img src={photoPreview} alt="Photo preview" className="h-full object-contain rounded-lg p-1" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Camera className="w-8 h-8" />
                          <span className="text-sm font-medium">Click to upload photo</span>
                          <span className="text-xs">JPG, PNG up to 10MB</span>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleFileChange("photo", e.target.files?.[0] || null)} />
                    </label>
                    {errors.photo && <p className="text-destructive text-xs mt-1">{errors.photo}</p>}
                  </div>

                  {/* Passport Upload */}
                  <div>
                    <Label className="font-semibold">Passport Scan *</Label>
                    <label className={`mt-1 flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                      errors.passport ? "border-destructive bg-destructive/5" : "border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}>
                      {passportPreview ? (
                        <img src={passportPreview} alt="Passport preview" className="h-full object-contain rounded-lg p-1" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Upload className="w-8 h-8" />
                          <span className="text-sm font-medium">Click to upload passport</span>
                          <span className="text-xs">JPG, PNG, PDF up to 10MB</span>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => handleFileChange("passport", e.target.files?.[0] || null)} />
                    </label>
                    {errors.passport && <p className="text-destructive text-xs mt-1">{errors.passport}</p>}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4 border-t border-border">
                <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>

                {currentStep < STEPS.length - 1 ? (
                  <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Submit Application <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Your data is secure and will only be used for recruitment purposes.
          </p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-emerald-700 to-teal-600 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Need Help With Your Application?</h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">Our team can assist you in multiple languages.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleWhatsAppClick} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-green-500 hover:bg-green-400 text-white font-bold rounded-full shadow-lg transition-all hover:scale-105">
              <MessageCircle className="w-5 h-5" />
              Chat on WhatsApp
            </button>
            <a href="tel:+971567222248" onClick={handleCallClick} className="flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-white bg-transparent text-white hover:bg-white hover:text-emerald-700 font-bold rounded-full shadow-lg transition-all hover:scale-105">
              <Phone className="w-5 h-5" />
              <span className="hidden md:inline">Call +971 56 722 2248</span>
              <span className="md:hidden">Call Now</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted border-t border-border py-6 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} TADMAIDS — Licensed Tadbeer Center, UAE
        </p>
      </footer>
    </div>
  );
};

export default StartApplication;
