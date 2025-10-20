import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Step1Identity from "@/components/cvwizard/Step1Identity";
import Step2Jobs from "@/components/cvwizard/Step2Jobs";
import Step3Languages from "@/components/cvwizard/Step3Languages";
import Step4Education from "@/components/cvwizard/Step4Education";
import Step5Experience from "@/components/cvwizard/Step5Experience";
import Step6Skills from "@/components/cvwizard/Step6Skills";
import Step7Visa from "@/components/cvwizard/Step7Visa";
import Step8Files from "@/components/cvwizard/Step8Files";
import Step9Financials from "@/components/cvwizard/Step9Financials";
import Step10Consent from "@/components/cvwizard/Step10Consent";
import { supabase } from "@/integrations/supabase/client";

export interface CVFormData {
  // Identity
  name: string;
  passport_no: string;
  passport_expiry: string;
  nationality_code: string;
  age: number;
  religion: string;
  maid_status: string;
  
  // Jobs & Vitals
  job1: string;
  job2: string;
  height_cm: number;
  weight_kg: number;
  marital_status: string;
  children: number;
  
  // Languages
  languages: Array<{ name: string; level: string }>;
  
  // Education
  education: {
    track: string;
    status?: string;
    attended_years?: number;
    speciality?: string;
  };
  
  // Experience
  experience: Array<{ country: string; years: number }>;
  
  // Skills
  skills: {
    baby_sit: boolean;
    new_born: boolean;
    iron: boolean;
    wash: boolean;
    dish_wash: boolean;
    clean: boolean;
    drive: boolean;
    cook: boolean;
    cook_details?: string;
    tutor: boolean;
    housekeeping: boolean;
    computer_skills: boolean;
  };
  
  // Visa
  visa: {
    status: string;
    overstay_or_grace_date?: string;
  };
  
  // Files
  files: {
    photo?: File;
    passport?: File;
    medical?: File;
    pcc?: File;
    entry_permit?: File;
    visit_visa?: File;
    other_1?: File;
    other_2?: File;
    other_3?: File;
  };
  
  // Financials
  financials: {
    costs: Array<{ label: string; amount: number }>;
    revenues: Array<{ label: string; amount: number }>;
  };
  
  // Consent
  consent: boolean;
}

const CVWizard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const totalSteps = 10;

  const [formData, setFormData] = useState<CVFormData>({
    name: "",
    passport_no: "",
    passport_expiry: "",
    nationality_code: "",
    age: 25,
    religion: "",
    maid_status: "",
    job1: "",
    job2: "",
    height_cm: 160,
    weight_kg: 55,
    marital_status: "",
    children: 0,
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
      costs: [
        { label: "Agency", amount: 0 },
        { label: "Travel Ticket", amount: 0 },
        { label: "Medical", amount: 0 },
        { label: "Visa", amount: 0 },
        { label: "Cash Assistance", amount: 0 },
        { label: "Other", amount: 0 },
        { label: "Other", amount: 0 },
      ],
      revenues: [],
    },
    consent: false,
  });

  const updateFormData = (data: Partial<CVFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.name &&
          formData.passport_no &&
          formData.passport_expiry &&
          formData.nationality_code &&
          formData.age >= 18 &&
          formData.age <= 60 &&
          formData.religion &&
          formData.maid_status
        );
      case 2:
        return !!formData.job1 && !!formData.marital_status;
      case 3:
        return formData.languages.length > 0;
      case 4:
        return !!formData.education.track;
      case 5:
        return true; // Optional
      case 6:
        return true; // At least some skills
      case 7:
        const visaOk = !!formData.visa.status;
        if (["Cancelled", "Entry Tourist"].includes(formData.visa.status)) {
          return visaOk && !!formData.visa.overstay_or_grace_date;
        }
        return visaOk;
      case 8:
        return !!(formData.files.photo && formData.files.passport);
      case 9:
        return true; // Optional
      case 10:
        return formData.consent;
      default:
        return true;
    }
  };

  const handleNext = () => {
    const isValid = validateStep(currentStep);
    
    if (!isValid) {
      let missingFields = [];
      
      if (currentStep === 1) {
        if (!formData.name) missingFields.push("Full Name");
        if (!formData.passport_no) missingFields.push("Passport Number");
        if (!formData.passport_expiry) missingFields.push("Passport Expiry");
        if (!formData.nationality_code) missingFields.push("Nationality");
        if (!formData.religion) missingFields.push("Religion");
        if (!formData.maid_status) missingFields.push("Maid Status");
        if (formData.age < 18 || formData.age > 60) missingFields.push("Valid Age (18-60)");
      } else if (currentStep === 2) {
        if (!formData.job1) missingFields.push("Primary Job");
        if (!formData.marital_status) missingFields.push("Marital Status");
      } else if (currentStep === 3) {
        if (formData.languages.length === 0) missingFields.push("At least one language");
      } else if (currentStep === 4) {
        if (!formData.education.track) missingFields.push("Education Track");
      } else if (currentStep === 7) {
        if (!formData.visa.status) missingFields.push("Visa Status");
        if (["Cancelled", "Entry Tourist"].includes(formData.visa.status) && !formData.visa.overstay_or_grace_date) {
          missingFields.push("Overstay/Grace Date");
        }
      } else if (currentStep === 8) {
        if (!formData.files.photo) missingFields.push("Photo");
        if (!formData.files.passport) missingFields.push("Passport Copy");
      } else if (currentStep === 10) {
        if (!formData.consent) missingFields.push("Consent Checkbox");
      }
      
      toast({
        title: "❌ Incomplete Step",
        description: missingFields.length > 0 
          ? `Missing: ${missingFields.join(", ")}` 
          : "Please fill all required fields before proceeding.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(10)) {
      toast({
        title: "Cannot Submit",
        description: "Please accept the consent checkbox.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Call edge function to handle submission
      const { data, error } = await supabase.functions.invoke("submit-cv", {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `CV submitted successfully! Reference: ${data.center_ref}`,
      });

      // Navigate to a success page or reset
      navigate("/");
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
    switch (currentStep) {
      case 1:
        return <Step1Identity formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <Step2Jobs formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <Step3Languages formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <Step4Education formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <Step5Experience formData={formData} updateFormData={updateFormData} />;
      case 6:
        return <Step6Skills formData={formData} updateFormData={updateFormData} />;
      case 7:
        return <Step7Visa formData={formData} updateFormData={updateFormData} />;
      case 8:
        return <Step8Files formData={formData} updateFormData={updateFormData} />;
      case 9:
        return <Step9Financials formData={formData} updateFormData={updateFormData} />;
      case 10:
        return <Step10Consent formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  const progress = (currentStep / totalSteps) * 100;

  return (
    <Layout>
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Tadmaids CV Wizard</CardTitle>
            <CardDescription>
              Step {currentStep} of {totalSteps}
            </CardDescription>
            <Progress value={progress} className="mt-4" />
          </CardHeader>

          <CardContent className="space-y-6">
            {renderStep()}

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || submitting}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {currentStep < totalSteps ? (
                <Button onClick={handleNext} disabled={submitting}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit CV"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CVWizard;
