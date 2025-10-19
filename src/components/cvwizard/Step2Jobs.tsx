import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CVFormData } from "@/pages/CVWizard";

interface Props {
  formData: CVFormData;
  updateFormData: (data: Partial<CVFormData>) => void;
}

const jobOptions = [
  "Nanny",
  "Maid",
  "Cook",
  "All Round",
  "Driver",
  "Caregiver",
  "Nurse",
  "Baby Sitter",
  "Tutor",
  "Other",
];

const Step2Jobs = ({ formData, updateFormData }: Props) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Jobs & Vitals</h3>

      <div className="space-y-2">
        <Label htmlFor="job1">Primary Job *</Label>
        <Select
          value={formData.job1}
          onValueChange={(value) => updateFormData({ job1: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select primary job" />
          </SelectTrigger>
          <SelectContent>
            {jobOptions.map((job) => (
              <SelectItem key={job} value={job}>
                {job}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="job2">Secondary Job (Optional)</Label>
        <Select
          value={formData.job2}
          onValueChange={(value) => updateFormData({ job2: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select secondary job" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {jobOptions.map((job) => (
              <SelectItem key={job} value={job}>
                {job}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="height_cm">Height (cm)</Label>
          <Input
            id="height_cm"
            type="number"
            min={120}
            max={210}
            value={formData.height_cm}
            onChange={(e) => updateFormData({ height_cm: parseInt(e.target.value) || 160 })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight_kg">Weight (kg)</Label>
          <Input
            id="weight_kg"
            type="number"
            min={35}
            max={140}
            value={formData.weight_kg}
            onChange={(e) => updateFormData({ weight_kg: parseInt(e.target.value) || 55 })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="marital_status">Marital Status *</Label>
        <Select
          value={formData.marital_status}
          onValueChange={(value) => updateFormData({ marital_status: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Single">Single</SelectItem>
            <SelectItem value="Married">Married</SelectItem>
            <SelectItem value="Divorced">Divorced</SelectItem>
            <SelectItem value="Widowed">Widowed</SelectItem>
            <SelectItem value="Separated">Separated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="children">Number of Children</Label>
        <Input
          id="children"
          type="number"
          min={0}
          max={10}
          value={formData.children}
          onChange={(e) => updateFormData({ children: parseInt(e.target.value) || 0 })}
        />
      </div>
    </div>
  );
};

export default Step2Jobs;
