import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { CVFormData } from "@/components/cvwizard/types";

interface Props {
  formData: CVFormData;
  updateFormData: (data: Partial<CVFormData>) => void;
}

const Step8Files = ({ formData, updateFormData }: Props) => {
  const handleFileChange = (field: string, file: File | null) => {
    if (!file) return;
    
    // Video files can be larger (up to 50MB), other files 15MB max
    const maxSize = field === 'video' ? 50 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File size must be less than ${field === 'video' ? '50MB' : '15MB'}`);
      return;
    }

    updateFormData({
      files: { ...formData.files, [field]: file },
    });
  };

  const handleRemoveFile = (field: string) => {
    updateFormData({
      files: { ...formData.files, [field]: undefined },
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Attachments</h3>
      <p className="text-sm text-muted-foreground">
        Documents/Photos: Max 15MB. Video: Max 50MB. Photos: JPG/PNG. Documents: PDF. Video: MP4/MOV
      </p>

      <div className="space-y-2">
        <Label htmlFor="photo">Photo * (JPG/PNG)</Label>
        {formData.files.photo ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
              <p className="text-sm text-green-600 flex-1">✓ {formData.files.photo.name}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile("photo")}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Input
            id="photo"
            type="file"
            accept="image/jpeg,image/png,image/*"
            capture="environment"
            onChange={(e) => handleFileChange("photo", e.target.files?.[0] || null)}
            required
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="passport">Passport Copy * (PDF/Image)</Label>
        <Input
          id="passport"
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/*"
          capture="environment"
          onChange={(e) => handleFileChange("passport", e.target.files?.[0] || null)}
          required
        />
        {formData.files.passport && (
          <p className="text-sm text-green-600">✓ {formData.files.passport.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="medical">Medical Certificate (Optional)</Label>
        <Input
          id="medical"
          type="file"
          accept="application/pdf,image/*"
          capture="environment"
          onChange={(e) => handleFileChange("medical", e.target.files?.[0] || null)}
        />
        {formData.files.medical && (
          <p className="text-sm text-green-600">✓ {formData.files.medical.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="pcc">Police Clearance Certificate (Optional)</Label>
        <Input
          id="pcc"
          type="file"
          accept="application/pdf,image/*"
          capture="environment"
          onChange={(e) => handleFileChange("pcc", e.target.files?.[0] || null)}
        />
        {formData.files.pcc && (
          <p className="text-sm text-green-600">✓ {formData.files.pcc.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="entry_permit">Entry Permit (Optional)</Label>
        <Input
          id="entry_permit"
          type="file"
          accept="application/pdf,image/*"
          capture="environment"
          onChange={(e) => handleFileChange("entry_permit", e.target.files?.[0] || null)}
        />
        {formData.files.entry_permit && (
          <p className="text-sm text-green-600">✓ {formData.files.entry_permit.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="visit_visa">Visit Visa (Optional)</Label>
        <Input
          id="visit_visa"
          type="file"
          accept="application/pdf,image/*"
          capture="environment"
          onChange={(e) => handleFileChange("visit_visa", e.target.files?.[0] || null)}
        />
        {formData.files.visit_visa && (
          <p className="text-sm text-green-600">✓ {formData.files.visit_visa.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="video">Maid Video (Optional - Max 50MB)</Label>
        {formData.files.video ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
              <p className="text-sm text-green-600 flex-1">✓ {formData.files.video.name}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile("video")}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Input
            id="video"
            type="file"
            accept="video/mp4,video/quicktime,video/*"
            capture="user"
            onChange={(e) => handleFileChange("video", e.target.files?.[0] || null)}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="other_1">Other Document 1 (Optional)</Label>
        <Input
          id="other_1"
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => handleFileChange("other_1", e.target.files?.[0] || null)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="other_2">Other Document 2 (Optional)</Label>
        <Input
          id="other_2"
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => handleFileChange("other_2", e.target.files?.[0] || null)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="other_3">Other Document 3 (Optional)</Label>
        <Input
          id="other_3"
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => handleFileChange("other_3", e.target.files?.[0] || null)}
        />
      </div>
    </div>
  );
};

export default Step8Files;
