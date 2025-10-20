import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { CVFormData } from "@/components/cvwizard/types";

interface Props {
  formData: CVFormData;
  updateFormData: (data: Partial<CVFormData>) => void;
}

const Step6Skills = ({ formData, updateFormData }: Props) => {
  const updateSkill = (skill: string, value: boolean) => {
    updateFormData({
      skills: { ...formData.skills, [skill]: value },
    });
  };

  const updateCookDetails = (value: string) => {
    updateFormData({
      skills: { ...formData.skills, cook_details: value },
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Skills</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="baby_sit"
            checked={formData.skills.baby_sit}
            onCheckedChange={(checked) => updateSkill("baby_sit", !!checked)}
          />
          <Label htmlFor="baby_sit">Baby Sit</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="new_born"
            checked={formData.skills.new_born}
            onCheckedChange={(checked) => updateSkill("new_born", !!checked)}
          />
          <Label htmlFor="new_born">New Born</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="iron"
            checked={formData.skills.iron}
            onCheckedChange={(checked) => updateSkill("iron", !!checked)}
          />
          <Label htmlFor="iron">Iron</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="wash"
            checked={formData.skills.wash}
            onCheckedChange={(checked) => updateSkill("wash", !!checked)}
          />
          <Label htmlFor="wash">Wash</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="dish_wash"
            checked={formData.skills.dish_wash}
            onCheckedChange={(checked) => updateSkill("dish_wash", !!checked)}
          />
          <Label htmlFor="dish_wash">Dish Wash</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="clean"
            checked={formData.skills.clean}
            onCheckedChange={(checked) => updateSkill("clean", !!checked)}
          />
          <Label htmlFor="clean">Clean</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="drive"
            checked={formData.skills.drive}
            onCheckedChange={(checked) => updateSkill("drive", !!checked)}
          />
          <Label htmlFor="drive">Drive</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="cook"
            checked={formData.skills.cook}
            onCheckedChange={(checked) => updateSkill("cook", !!checked)}
          />
          <Label htmlFor="cook">Cook</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="tutor"
            checked={formData.skills.tutor}
            onCheckedChange={(checked) => updateSkill("tutor", !!checked)}
          />
          <Label htmlFor="tutor">Tutor</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="housekeeping"
            checked={formData.skills.housekeeping}
            onCheckedChange={(checked) => updateSkill("housekeeping", !!checked)}
          />
          <Label htmlFor="housekeeping">Housekeeping</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="computer_skills"
            checked={formData.skills.computer_skills}
            onCheckedChange={(checked) => updateSkill("computer_skills", !!checked)}
          />
          <Label htmlFor="computer_skills">Computer Skills</Label>
        </div>
      </div>

      {formData.skills.cook && (
        <div className="space-y-2">
          <Label htmlFor="cook_details">What can you cook?</Label>
          <Textarea
            id="cook_details"
            value={formData.skills.cook_details || ""}
            onChange={(e) => updateCookDetails(e.target.value)}
            placeholder="e.g., Arabic, Filipino, Indian cuisine"
          />
        </div>
      )}
    </div>
  );
};

export default Step6Skills;
