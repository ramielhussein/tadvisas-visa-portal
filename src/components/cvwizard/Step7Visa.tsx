import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CVFormData } from "@/components/cvwizard/types";

interface Props {
  formData: CVFormData;
  updateFormData: (data: Partial<CVFormData>) => void;
}

const Step7Visa = ({ formData, updateFormData }: Props) => {
  const updateVisa = (field: string, value: any) => {
    updateFormData({
      visa: { ...formData.visa, [field]: value },
    });
  };

  const requiresGraceDate = ["Cancelled", "Entry Tourist"].includes(formData.visa.status);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Visa & Legal Status</h3>

      <div className="space-y-2">
        <Label>Visa Status *</Label>
        <Select
          value={formData.visa.status}
          onValueChange={(value) => updateVisa("status", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select visa status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Entry Tourist">Entry Tourist</SelectItem>
            <SelectItem value="Entry Employment">Entry Employment</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="Overstay">Overstay</SelectItem>
            <SelectItem value="Blacklisted">Blacklisted</SelectItem>
            <SelectItem value="Outside Country">Outside Country</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {requiresGraceDate && (
        <div className="space-y-2">
          <Label>Overstay/Grace Period Date *</Label>
          <Input
            type="date"
            value={formData.visa.overstay_or_grace_date || ""}
            onChange={(e) => updateVisa("overstay_or_grace_date", e.target.value)}
            required
          />
          <p className="text-sm text-muted-foreground">
            Required for Cancelled or Entry Tourist visa status
          </p>
        </div>
      )}
    </div>
  );
};

export default Step7Visa;
