import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

import type { CVFormData } from "@/components/cvwizard/types";

const CVWizard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const editingWorkerId = searchParams.get('id');
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(!!editingWorkerId);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const totalSteps = 10;

  const [formData, setFormData] = useState<CVFormData>({
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
      costs: [
        { label: "Agency", amount: undefined },
        { label: "Travel Ticket", amount: undefined },
        { label: "Medical", amount: undefined },
        { label: "Visa", amount: undefined },
        { label: "Cash Assistance", amount: undefined },
        { label: "Other", amount: undefined },
        { label: "Other", amount: undefined },
      ],
      revenues: [],
    },
    consent: false,
  });

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();
        
        setCurrentUserName(profile?.full_name || profile?.email || user.email || 'User');
      }

      // Load worker data if editing
      if (editingWorkerId) {
        try {
          const { data: worker, error } = await supabase
            .from('workers')
            .select('*')
            .eq('id', editingWorkerId)
            .single();

          if (error) throw error;

          if (worker) {
            // Transform worker data to form data format
            setFormData({
              name: worker.name || "",
              passport_no: worker.passport_no || "",
              passport_expiry: worker.passport_expiry || "",
              nationality_code: worker.nationality_code || "",
              date_of_birth: worker.date_of_birth || "",
              religion: worker.religion || "",
              maid_status: worker.maid_status || "",
              job1: worker.job1 || "",
              job2: worker.job2 || "",
              height_cm: worker.height_cm || undefined,
              weight_kg: worker.weight_kg || undefined,
              marital_status: worker.marital_status || "",
              children: worker.children || undefined,
              languages: (worker.languages as any) || [],
              education: (worker.education as any) || { track: "" },
              experience: (worker.experience as any) || [],
              skills: (worker.skills as any) || {
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
              visa: (worker.visa as any) || { status: "" },
              files: {},
              financials: (worker.financials as any) || {
                costs: [
                  { label: "Agency", amount: undefined },
                  { label: "Travel Ticket", amount: undefined },
                  { label: "Medical", amount: undefined },
                  { label: "Visa", amount: undefined },
                  { label: "Cash Assistance", amount: undefined },
                  { label: "Other", amount: undefined },
                  { label: "Other", amount: undefined },
                ],
                revenues: [],
              },
              consent: true,
            });
          }
        } catch (error: any) {
          console.error("Error loading worker:", error);
          toast({
            title: "Error",
            description: "Failed to load CV data",
            variant: "destructive",
          });
          navigate('/my-cvs');
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadData();
  }, [editingWorkerId]);

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
          formData.date_of_birth &&
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
        if (!formData.date_of_birth) missingFields.push("Date of Birth");
        if (!formData.religion) missingFields.push("Religion");
        if (!formData.maid_status) missingFields.push("Maid Status");
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to submit a CV.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      if (editingWorkerId) {
        // Update existing worker directly in database
        const { error } = await supabase
          .from('workers')
          .update({
            name: formData.name,
            passport_no: formData.passport_no,
            passport_expiry: formData.passport_expiry,
            nationality_code: formData.nationality_code,
            date_of_birth: formData.date_of_birth,
            religion: formData.religion,
            maid_status: formData.maid_status,
            job1: formData.job1,
            job2: formData.job2,
            height_cm: formData.height_cm,
            weight_kg: formData.weight_kg,
            marital_status: formData.marital_status,
            children: formData.children,
            languages: formData.languages,
            education: formData.education,
            experience: formData.experience,
            skills: formData.skills,
            visa: formData.visa,
            financials: formData.financials,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingWorkerId);

        if (error) throw error;

        toast({
          title: "Success!",
          description: "CV updated successfully!",
        });

        navigate("/my-cvs");
      } else {
        // Create new worker - convert files to base64 before sending
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

        // Call edge function with base64 files
        const payload = {
          ...formData,
          files: filesBase64,
          created_by: user.id,
        };

        const { data, error } = await supabase.functions.invoke("submit-cv", {
          body: payload,
        });

        if (error) throw error;

        toast({
          title: "Success!",
          description: `CV submitted successfully! Reference: ${data.center_ref}`,
        });

        navigate("/admin/cvwizard-review");
      }
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading CV data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {editingWorkerId ? "Edit CV" : "Tadmaids CV Wizard"}
            </CardTitle>
            <CardDescription>
              Step {currentStep} of {totalSteps}
            </CardDescription>
            {currentUserName && (
              <p className="text-sm text-muted-foreground mt-2">
                This CV is created by <span className="font-semibold text-foreground">{currentUserName}</span>
              </p>
            )}
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
                  {submitting 
                    ? (editingWorkerId ? "Updating..." : "Submitting...") 
                    : (editingWorkerId ? "Update CV" : "Submit CV")
                  }
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
