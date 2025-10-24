import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, CreditCard, User, BookOpen, Package, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const StartHere = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('lead_id');
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    email: "",
    package: "",
    addOns: {
      medicalInsurance1Year: false,
      medicalInsurance2Year: false,
      installmentPlan: false
    }
  });
  const [files, setFiles] = useState({
    emiratesIdFront: null as File | null,
    emiratesIdBack: null as File | null,
    dewaBill: null as File | null,
    maidPassport: null as File | null,
    maidVisa: null as File | null,
    maidPhoto: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Prefill data from lead if lead_id is provided
  useEffect(() => {
    if (leadId) {
      const fetchLeadData = async () => {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single();

        if (!error && data) {
          setFormData(prev => ({
            ...prev,
            name: data.client_name || '',
            number: data.mobile_number || '',
            email: data.email || '',
          }));
          
          toast({
            title: "Lead data loaded",
            description: "We've prefilled your information from the lead.",
          });
        }
      };

      fetchLeadData();
    }
  }, [leadId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (field: keyof typeof files, file: File | null) => {
    setFiles({ ...files, [field]: file });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const timestamp = Date.now();
      const folderName = `${formData.name.replace(/\s+/g, '_')}_${timestamp}`;
      
      console.log('Starting upload process for folder:', folderName);
      
      // Track uploaded file URLs
      const fileUrls: Record<string, string> = {};
      
      // Upload all files to storage
      const uploadPromises = Object.entries(files).map(async ([key, file]) => {
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${folderName}/${key}.${fileExt}`;
          
          console.log('Uploading file:', fileName);
          
          const { data, error: uploadError } = await supabase.storage
            .from('start-here-uploads')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Upload error for', fileName, ':', uploadError);
            throw uploadError;
          }
          
          // Get public URL for the uploaded file
          const { data: { publicUrl } } = supabase.storage
            .from('start-here-uploads')
            .getPublicUrl(fileName);
          
          fileUrls[key] = publicUrl;
          
          console.log('Successfully uploaded:', fileName, data);
        }
      });

      await Promise.all(uploadPromises);
      console.log('All files uploaded successfully');

      // Save form data as JSON file
      const formDataJSON = {
        ...formData,
        submittedAt: new Date().toISOString(),
        files: Object.keys(files).filter(key => files[key as keyof typeof files] !== null)
      };

      console.log('Saving form data:', formDataJSON);

      const formDataBlob = new Blob([JSON.stringify(formDataJSON, null, 2)], { type: 'application/json' });
      
      const { data: jsonData, error: jsonError } = await supabase.storage
        .from('start-here-uploads')
        .upload(`${folderName}/application-data.json`, formDataBlob);

      if (jsonError) {
        console.error('JSON upload error:', jsonError);
        throw jsonError;
      }
      
      console.log('Form data saved successfully:', jsonData);

      // Save submission to database
      const { data: submissionData, error: dbError } = await supabase
        .from('submissions')
        .insert({
          name: formData.name,
          phone: formData.number,
          email: formData.email,
          package: formData.package,
          medical_insurance: formData.addOns.medicalInsurance1Year || formData.addOns.medicalInsurance2Year,
          installment_plan: formData.addOns.installmentPlan,
          emirates_id_front_url: fileUrls.emiratesIdFront || null,
          emirates_id_back_url: fileUrls.emiratesIdBack || null,
          dewa_bill_url: fileUrls.dewaBill || null,
          maid_passport_url: fileUrls.maidPassport || null,
          maid_visa_url: fileUrls.maidVisa || null,
          maid_photo_url: fileUrls.maidPhoto || null,
          worker_photo_url: null,
          lead_id: leadId || null,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error saving to database:', dbError);
        toast({
          title: "Warning",
          description: "Files uploaded but couldn't save to database. We'll process your application manually.",
        });
      }

      // If this was a lead conversion, update the lead
      if (leadId && submissionData) {
        const { error: leadUpdateError } = await supabase
          .from('leads')
          .update({
            client_converted: true,
            submission_id: submissionData.id,
            status: 'SOLD',
          })
          .eq('id', leadId);

        if (leadUpdateError) {
          console.error('Error updating lead:', leadUpdateError);
        }
      }

      // Show success page
      setIsSubmitted(true);

      // Reset form
      setFormData({ 
        name: "", 
        number: "", 
        email: "", 
        package: "",
        addOns: {
          medicalInsurance1Year: false,
          medicalInsurance2Year: false,
          installmentPlan: false
        }
      });
      setFiles({
        emiratesIdFront: null,
        emiratesIdBack: null,
        dewaBill: null,
        maidPassport: null,
        maidVisa: null,
        maidPhoto: null
      });

      toast({
        title: "Success!",
        description: "Your application has been submitted successfully.",
      });

    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: `Failed to submit application: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileUploadField = ({ 
    field, 
    label, 
    icon: Icon, 
    description 
  }: { 
    field: keyof typeof files; 
    label: string; 
    icon: any; 
    description: string;
  }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5 text-primary" />
          {label}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Label htmlFor={field} className="cursor-pointer">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {files[field] ? files[field]!.name : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, PDF (max 10MB)</p>
          </div>
          <Input
            id={field}
            type="file"
            accept=".png,.jpg,.jpeg,.pdf"
            className="hidden"
            onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
          />
        </Label>
      </CardContent>
    </Card>
  );

  if (isSubmitted) {
    return (
      <Layout>
        <div className="min-h-screen py-12 flex items-center justify-center relative">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-6xl mb-6">✨</div>
              <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-6">
                ABRA CADABRA!
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Your application has been submitted successfully! We'll contact you soon.
              </p>
              <Button 
                onClick={() => setIsSubmitted(false)}
                className="bg-gradient-primary text-white px-8 py-3 text-lg font-semibold rounded-lg"
              >
                Submit Another Application
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-12 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-4">
              START HERE & NOW
            </h1>
            <p className="text-xl text-muted-foreground">
              Start your process right now and right here
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Please fill in your contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="number">Phone Number</Label>
                  <Input
                    id="number"
                    name="number"
                    type="tel"
                    required
                    value={formData.number}
                    onChange={handleInputChange}
                    placeholder="e.g., 0502020070"
                    pattern="[0-9]{10}"
                    title="Please enter a 10-digit phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Package Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Select Package
                </CardTitle>
                <CardDescription>Choose your visa package</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="package">Package</Label>
                  <Select value={formData.package} onValueChange={(value) => {
                    setFormData({
                      ...formData, 
                      package: value,
                      addOns: {
                        medicalInsurance1Year: false,
                        medicalInsurance2Year: false,
                        installmentPlan: false
                      }
                    });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a package" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tadvisa">
                        <div>
                          <div className="font-semibold">TADVISA</div>
                          <div className="text-sm text-muted-foreground">8925 AED • Zero monthly fee</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="tadvisa-plus">
                        <div>
                          <div className="font-semibold">TADVISA+</div>
                          <div className="text-sm text-muted-foreground">8400 AED • 150 AED per month</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="tadvisa-plus-plus">
                        <div>
                          <div className="font-semibold">TADVISA++</div>
                          <div className="text-sm text-muted-foreground">10500 AED • 168 AED per month</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Add-Ons Selection */}
            {formData.package && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Select Add-Ons
                  </CardTitle>
                  <CardDescription>Choose optional add-ons for your package</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.package === "tadvisa" && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="medicalInsurance1Year"
                          checked={formData.addOns.medicalInsurance1Year}
                          onCheckedChange={(checked) => 
                            setFormData({
                              ...formData, 
                              addOns: { 
                                ...formData.addOns, 
                                medicalInsurance1Year: checked as boolean,
                                medicalInsurance2Year: checked ? false : formData.addOns.medicalInsurance2Year
                              }
                            })
                          }
                        />
                        <Label htmlFor="medicalInsurance1Year" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          1 Year Medical Insurance - 750 AED
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="medicalInsurance2Year"
                          checked={formData.addOns.medicalInsurance2Year}
                          onCheckedChange={(checked) => 
                            setFormData({
                              ...formData, 
                              addOns: { 
                                ...formData.addOns, 
                                medicalInsurance2Year: checked as boolean,
                                medicalInsurance1Year: checked ? false : formData.addOns.medicalInsurance1Year
                              }
                            })
                          }
                        />
                        <Label htmlFor="medicalInsurance2Year" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          2 Year Medical Insurance - 1500 AED
                        </Label>
                      </div>
                    </>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="installmentPlan"
                      checked={formData.addOns.installmentPlan}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData, 
                          addOns: { ...formData.addOns, installmentPlan: checked as boolean }
                        })
                      }
                    />
                    <Label htmlFor="installmentPlan" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Installment Plan - 800 AED
                    </Label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Document Uploads */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-center mb-6">Upload Required Documents</h2>
              
              <div className="grid gap-4">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <h3 className="font-semibold text-primary mb-2">Step 1</h3>
                  <FileUploadField
                    field="emiratesIdFront"
                    label="Emirates ID (Front)"
                    icon={CreditCard}
                    description="Upload the front side of your Emirates ID"
                  />
                  <FileUploadField
                    field="emiratesIdBack"
                    label="Emirates ID (Back)"
                    icon={CreditCard}
                    description="Upload the back side of your Emirates ID"
                  />
                </div>

                <div className="bg-primary/10 p-4 rounded-lg">
                  <h3 className="font-semibold text-primary mb-2">Step 2</h3>
                  <FileUploadField
                    field="dewaBill"
                    label="DEWA or ETISALAT Bill"
                    icon={FileText}
                    description="Upload your latest utility bill as proof of residence"
                  />
                </div>

                <div className="bg-primary/10 p-4 rounded-lg">
                  <h3 className="font-semibold text-primary mb-2">Step 3</h3>
                  <FileUploadField
                    field="maidPassport"
                    label="Maid Passport Copy"
                    icon={BookOpen}
                    description="Upload a clear copy of the maid's passport"
                  />
                </div>

                <div className="bg-primary/10 p-4 rounded-lg">
                  <h3 className="font-semibold text-primary mb-2">Step 4</h3>
                  <FileUploadField
                    field="maidVisa"
                    label="Maid Visa or Cancellation"
                    icon={FileText}
                    description="Upload the maid's current visa or cancellation document"
                  />
                </div>

                <div className="bg-primary/10 p-4 rounded-lg">
                  <h3 className="font-semibold text-primary mb-2">Step 5</h3>
                  <FileUploadField
                    field="maidPhoto"
                    label="Maid Passport Photo"
                    icon={User}
                    description="Upload a passport-style photo of the maid"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center pt-8">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-gradient-primary text-white px-12 py-6 text-lg font-semibold rounded-lg shadow-elegant hover:shadow-glow transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default StartHere;