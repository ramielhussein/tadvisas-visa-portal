import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CVFormData } from "@/pages/CVWizard";

interface Props {
  formData: CVFormData;
  updateFormData: (data: Partial<CVFormData>) => void;
}

const Step4Education = ({ formData, updateFormData }: Props) => {
  const updateEducation = (field: string, value: any) => {
    updateFormData({
      education: { ...formData.education, [field]: value },
    });
  };

  const showStatus = ["College", "University"].includes(formData.education.track);
  const showSpeciality = showStatus && formData.education.status === "Graduated";

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Education</h3>

      <div className="space-y-2">
        <Label>Education Track *</Label>
        <Select
          value={formData.education.track}
          onValueChange={(value) => updateEducation("track", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select track" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="High School">High School</SelectItem>
            <SelectItem value="College">College</SelectItem>
            <SelectItem value="University">University</SelectItem>
            <SelectItem value="Vocational">Vocational</SelectItem>
            <SelectItem value="None">None</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showStatus && (
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={formData.education.status || ""}
            onValueChange={(value) => updateEducation("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Attended">Attended</SelectItem>
              <SelectItem value="Graduated">Graduated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {showStatus && formData.education.status === "Attended" && (
        <div className="space-y-2">
          <Label>Years Attended</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={formData.education.attended_years || ""}
            onChange={(e) =>
              updateEducation("attended_years", parseInt(e.target.value) || 0)
            }
          />
        </div>
      )}

      {showSpeciality && (
        <div className="space-y-2">
          <Label>Speciality</Label>
          <Input
            value={formData.education.speciality || ""}
            onChange={(e) => updateEducation("speciality", e.target.value)}
            placeholder="e.g., Nursing, Business, Engineering"
          />
        </div>
      )}
    </div>
  );
};

export default Step4Education;
