import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CreditCard, BookOpen, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const BookWorker = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const workerPhotoUrl = searchParams.get("photo") || "";

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const [files, setFiles] = useState({
    eidFront: null as File | null,
    eidBack: null as File | null,
    passport: null as File | null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
      
      const fileUrls: Record<string, string> = {};
      
      // Upload all files to storage
      const uploadPromises = Object.entries(files).map(async ([key, file]) => {
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${folderName}/${key}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('start-here-uploads')
            .upload(fileName, file);

          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('start-here-uploads')
            .getPublicUrl(fileName);
          
          fileUrls[key] = publicUrl;
        }
      });

      await Promise.all(uploadPromises);

      // Save booking to submissions database
      const { error: dbError } = await supabase
        .from('submissions')
        .insert({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          package: null,
          emirates_id_front_url: fileUrls.eidFront || null,
          emirates_id_back_url: fileUrls.eidBack || null,
          passport_url: fileUrls.passport || null,
          worker_photo_url: workerPhotoUrl,
          medical_insurance: false,
          installment_plan: false,
        });

      if (dbError) throw dbError;

      setIsSubmitted(true);

      toast({
        title: "Success!",
        description: "Your booking has been submitted successfully.",
      });

    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: `Failed to submit booking: ${error.message}`,
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
        <div className="min-h-screen py-12 flex items-center justify-center">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <Card className="p-8">
              <div className="text-6xl mb-6">✨</div>
              <h1 className="text-4xl font-bold text-primary mb-6">
                BOOKING CONFIRMED!
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Your booking has been submitted successfully! We'll contact you soon.
              </p>
              <Button 
                onClick={() => navigate(-1)}
                className="bg-gradient-primary text-white px-8 py-3"
              >
                Back to Gallery
              </Button>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">
              Book This Worker
            </h1>
            <p className="text-xl text-muted-foreground">
              Fill in your details and upload required documents
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
                <CardDescription>Please provide your contact details</CardDescription>
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
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
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

            {/* Document Uploads */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-center mb-6">Upload Required Documents</h2>
              
              <FileUploadField
                field="eidFront"
                label="Emirates ID (Front)"
                icon={CreditCard}
                description="Upload the front side of your Emirates ID"
              />

              <FileUploadField
                field="eidBack"
                label="Emirates ID (Back)"
                icon={CreditCard}
                description="Upload the back side of your Emirates ID"
              />

              <FileUploadField
                field="passport"
                label="Passport Copy"
                icon={BookOpen}
                description="Upload a clear copy of your passport"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-primary text-white py-6 text-lg font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Booking"
              )}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default BookWorker;
