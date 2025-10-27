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

const availableLanguages = [
  "Arabic",
  "English",
  "Tagalog",
  "Hindi",
  "Urdu",
  "Tamil",
  "Malayalam",
  "Bengali",
  "Amharic",
  "Swahili",
  "Vietnamese",
  "Nepali",
  "Indonesian",
  "Other",
];

const proficiencyLevels = ["None", "Basic", "Fair", "Good", "Fluent"];

const Step3Languages = ({ formData, updateFormData }: Props) => {
  const [selectedLang, setSelectedLang] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");

  const addLanguage = () => {
    if (!selectedLang || !selectedLevel || selectedLevel === "None") return;

    const exists = formData.languages.find((l) => l.name === selectedLang);
    if (exists) return;

    updateFormData({
      languages: [...formData.languages, { name: selectedLang, level: selectedLevel }],
    });
    setSelectedLang("");
    setSelectedLevel("");
  };

  const removeLanguage = (name: string) => {
    updateFormData({
      languages: formData.languages.filter((l) => l.name !== name),
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Languages & Proficiency</h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Language</Label>
          <Select value={selectedLang} onValueChange={setSelectedLang}>
            <SelectTrigger className="touch-manipulation">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent className="max-h-[60vh]">
              {availableLanguages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Proficiency Level</Label>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="touch-manipulation">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent className="max-h-[60vh]">
              {proficiencyLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="button" onClick={addLanguage} variant="outline" className="w-full">
          Add Language
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Selected Languages *</Label>
        <div className="flex flex-wrap gap-2">
          {formData.languages.length === 0 && (
            <p className="text-sm text-muted-foreground">No languages added yet</p>
          )}
          {formData.languages.map((lang) => (
            <Badge key={lang.name} variant="secondary" className="text-sm">
              {lang.name} - {lang.level}
              <button
                onClick={() => removeLanguage(lang.name)}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Step3Languages;
