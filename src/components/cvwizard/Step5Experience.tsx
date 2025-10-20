import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { CVFormData } from "@/components/cvwizard/types";
import { useState } from "react";

interface Props {
  formData: CVFormData;
  updateFormData: (data: Partial<CVFormData>) => void;
}

const countries = [
  "UAE", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman",
  "Jordan", "Lebanon", "Egypt", "Singapore", "Hong Kong", "Other"
];

const Step5Experience = ({ formData, updateFormData }: Props) => {
  const [country, setCountry] = useState("");
  const [years, setYears] = useState(0);

  const addExperience = () => {
    if (!country || years <= 0) return;

    updateFormData({
      experience: [...formData.experience, { country, years }],
    });
    setCountry("");
    setYears(0);
  };

  const removeExperience = (index: number) => {
    updateFormData({
      experience: formData.experience.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Work Experience</h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Country</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Years of Experience</Label>
          <Input
            type="number"
            min={0}
            max={20}
            value={years}
            onChange={(e) => setYears(parseInt(e.target.value) || 0)}
          />
        </div>

        <Button type="button" onClick={addExperience} variant="outline" className="w-full">
          Add Experience
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Experience History</Label>
        <div className="space-y-2">
          {formData.experience.length === 0 && (
            <p className="text-sm text-muted-foreground">No experience added</p>
          )}
          {formData.experience.map((exp, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded">
              <span>
                {exp.country}: {exp.years} year{exp.years !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => removeExperience(index)}
                className="text-destructive hover:text-destructive/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Step5Experience;
