import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { differenceInMonths, differenceInYears, parseISO } from "date-fns";
import Step1Identity from "@/components/cvwizard/Step1Identity";
import Step2Jobs from "@/components/cvwizard/Step2Jobs";
import Step3Languages from "@/components/cvwizard/Step3Languages";
import Step4Education from "@/components/cvwizard/Step4Education";
import Step5Experience from "@/components/cvwizard/Step5Experience";
import Step6Skills from "@/components/cvwizard/Step6Skills";
import Step7Visa from "@/components/cvwizard/Step7Visa";
import Step8Files from "@/components/cvwizard/Step8Files";
import Step10Consent from "@/components/cvwizard/Step10Consent";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { CVFormData } from "@/components/cvwizard/types";

interface StepConfig {
  identity: boolean;
  jobs: boolean;
  languages: boolean;
  education: boolean;
  experience: boolean;
  skills: boolean;
  visa: boolean;
  files: boolean;
  financials: boolean;
  consent: boolean;
}

const defaultStepConfig: StepConfig = {
  identity: true,
  jobs: true,
  languages: true,
  education: true,
  experience: true,
  skills: true,
  visa: true,
  files: true,
  financials: false,
  consent: true,
};

const PublicCVApplication = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0); // 0 = mobile entry
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [stepConfig, setStepConfig] = useState<StepConfig>(defaultStepConfig);
  const [mobileNumber, setMobileNumber] = useState("");

  const [formData, setFormData] = useState<CVFormData>({
    staff: false,
    name: "",
    passport_no: "",
    passport_expiry: "",
    nationality_code: "",
    date_of_birth: "",
    religion: "",
    maid_status: "",
    job1: "",
    job2: "",
    height_cm: undefined,
    weight_kg: undefined,
    marital_status: "",
    children: undefined,
    languages: [],
    education: { track: "" },
    experience: [],
    skills: {
      baby_sit: false,
      new_born: false,
      iron: false,
      wash: false,
      dish_wash: false,
      clean: false,
      drive: false,
      cook: false,
      tutor: false,
      housekeeping: false,
      computer_skills: false,
    },
    visa: { status: "" },
    files: {},
    financials: {
      costs: [],
      revenues: [],
    },
    consent: false,
  });

  // Load step configuration from settings
  useEffect(() => {
    const loadConfig = async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'cv_wizard_public_steps')
        .maybeSingle();
      
      if (data?.value) {
        try {
          setStepConfig(JSON.parse(data.value));
        } catch (e) {
          console.error('Failed to parse step config:', e);
        }
      }
    };
    loadConfig();
  }, []);

  // Build active steps based on config
  const activeSteps = [
    'mobile', // Always first - collect mobile
    ...(stepConfig.identity ? ['identity'] : []),
    ...(stepConfig.jobs ? ['jobs'] : []),
    ...(stepConfig.languages ? ['languages'] : []),
    ...(stepConfig.education ? ['education'] : []),
    ...(stepConfig.experience ? ['experience'] : []),
    ...(stepConfig.skills ? ['skills'] : []),
    ...(stepConfig.visa ? ['visa'] : []),
    ...(stepConfig.files ? ['files'] : []),
    ...(stepConfig.consent ? ['consent'] : []),
  ];

  const totalSteps = activeSteps.length;

  const updateFormData = (data: Partial<CVFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const validateCurrentStep = (): boolean => {
    const stepName = activeSteps[currentStep];
    
    switch (stepName) {
      case 'mobile':
        // Accept any international phone number (minimum 7 digits)
        return mobileNumber.replace(/\D/g, '').length >= 7;
      case 'identity':
        if (!formData.name || !formData.passport_no || !formData.passport_expiry || 
            !formData.nationality_code || !formData.date_of_birth || 
            !formData.religion || !formData.maid_status) {
          return false;
        }
        const passportExpiry = parseISO(formData.passport_expiry);
        const monthsUntilExpiry = differenceInMonths(passportExpiry, new Date());
        if (monthsUntilExpiry < 6) return false;
        const dob = parseISO(formData.date_of_birth);
        const age = differenceInYears(new Date(), dob);
        if (age < 18) return false;
        return true;
      case 'jobs':
        return !!formData.job1 && !!formData.marital_status;
      case 'languages':
        return formData.languages.length > 0;
      case 'education':
        return !!formData.education.track;
      case 'experience':
      case 'skills':
        return true;
      case 'visa':
        const visaOk = !!formData.visa.status;
        if (["Cancelled", "Entry Tourist"].includes(formData.visa.status)) {
          return visaOk && !!formData.visa.overstay_or_grace_date;
        }
        return visaOk;
      case 'files':
        return !!(formData.files.photo && formData.files.passport);
      case 'consent':
        return formData.consent;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      const stepName = activeSteps[currentStep];
      let missing: string[] = [];
      
      switch (stepName) {
        case 'mobile':
          missing.push("Mobile number (minimum 7 digits)");
          break;
        case 'identity':
          if (!formData.name) missing.push("Full Name");
          if (!formData.passport_no) missing.push("Passport Number");
          if (!formData.passport_expiry) missing.push("Passport Expiry");
          else {
            const exp = parseISO(formData.passport_expiry);
            if (differenceInMonths(exp, new Date()) < 6) missing.push("Passport must be valid for 6+ months");
          }
          if (!formData.nationality_code) missing.push("Nationality");
          if (!formData.date_of_birth) missing.push("Date of Birth");
          else {
            const dob = parseISO(formData.date_of_birth);
            if (differenceInYears(new Date(), dob) < 18) missing.push("Must be 18+ years old");
          }
          if (!formData.religion) missing.push("Religion");
          if (!formData.maid_status) missing.push("Maid Status");
          break;
        case 'jobs':
          if (!formData.job1) missing.push("Primary Job");
          if (!formData.marital_status) missing.push("Marital Status");
          break;
        case 'languages':
          missing.push("At least one language");
          break;
        case 'education':
          missing.push("Education Track");
          break;
        case 'visa':
          if (!formData.visa.status) missing.push("Visa Status");
          else if (["Cancelled", "Entry Tourist"].includes(formData.visa.status) && !formData.visa.overstay_or_grace_date) {
            missing.push("Overstay/Grace Date");
          }
          break;
        case 'files':
          if (!formData.files.photo) missing.push("Photo");
          if (!formData.files.passport) missing.push("Passport Copy");
          break;
        case 'consent':
          missing.push("Consent checkbox");
          break;
      }
      
      toast({
        title: "Incomplete",
        description: missing.length > 0 ? `Missing: ${missing.join(", ")}` : "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Cannot Submit",
        description: "Please complete all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Convert files to base64
      const filesBase64: any = {};
      for (const [key, file] of Object.entries(formData.files)) {
        if (file) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file as File);
          });
          filesBase64[key] = {
            data: base64,
            name: (file as File).name,
            type: (file as File).type,
          };
        }
      }

      const payload = {
        ...formData,
        mobile_number: mobileNumber,
        files: filesBase64,
        public_submission: true, // Flag for public submission
      };

      const { data, error } = await supabase.functions.invoke("submit-cv", {
        body: payload,
      });

      if (error) throw error;
      if (data?.success === false) throw new Error(data.error || 'Failed to submit CV');

      setSubmitted(true);
      toast({
        title: "Success!",
        description: "Your CV has been submitted successfully!",
      });
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    const stepName = activeSteps[currentStep];
    
    switch (stepName) {
      case 'mobile':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <p className="text-sm text-muted-foreground">
              Please provide your mobile number (with country code) so we can contact you about job opportunities.
            </p>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number (include country code) *</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="+63 917 123 4567 or +91 98765 43210"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
              />
            </div>
          </div>
        );
      case 'identity':
        return <Step1Identity formData={formData} updateFormData={updateFormData} />;
      case 'jobs':
        return <Step2Jobs formData={formData} updateFormData={updateFormData} />;
      case 'languages':
        return <Step3Languages formData={formData} updateFormData={updateFormData} />;
      case 'education':
        return <Step4Education formData={formData} updateFormData={updateFormData} />;
      case 'experience':
        return <Step5Experience formData={formData} updateFormData={updateFormData} />;
      case 'skills':
        return <Step6Skills formData={formData} updateFormData={updateFormData} />;
      case 'visa':
        return <Step7Visa formData={formData} updateFormData={updateFormData} />;
      case 'files':
        return <Step8Files formData={formData} updateFormData={updateFormData} />;
      case 'consent':
        return <Step10Consent formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isLastStep = currentStep === totalSteps - 1;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle>Application Submitted!</CardTitle>
            <CardDescription>
              Thank you for applying. We will review your CV and contact you soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} variant="outline">
              Submit Another Application
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Apply as Domestic Worker</CardTitle>
            <CardDescription>
              Fill out your details to apply for domestic worker positions
            </CardDescription>
            <div className="pt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Step {currentStep + 1} of {totalSteps}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderStep()}
            
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              
              {isLastStep ? (
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Application"}
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground mt-4">
          Powered by Tadmaids
        </p>
      </div>
    </div>
  );
};

export default PublicCVApplication;
