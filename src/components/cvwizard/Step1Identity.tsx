import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CVFormData } from "@/components/cvwizard/types";

interface Props {
  formData: CVFormData;
  updateFormData: (data: Partial<CVFormData>) => void;
}

const Step1Identity = ({ formData, updateFormData }: Props) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Identity & Core Information</h3>

      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="passport_no">Passport Number *</Label>
        <Input
          id="passport_no"
          value={formData.passport_no}
          onChange={(e) => updateFormData({ passport_no: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="passport_expiry">Passport Expiry Date *</Label>
        <Input
          id="passport_expiry"
          type="date"
          value={formData.passport_expiry}
          onChange={(e) => updateFormData({ passport_expiry: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nationality_code">Nationality *</Label>
        <Select
          value={formData.nationality_code}
          onValueChange={(value) => updateFormData({ nationality_code: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select nationality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PH">🇵🇭 Philippines (PH)</SelectItem>
            <SelectItem value="ID">🇮🇩 Indonesia (ID)</SelectItem>
            <SelectItem value="IN">🇮🇳 India (IN)</SelectItem>
            <SelectItem value="KE">🇰🇪 Kenya (KE)</SelectItem>
            <SelectItem value="UG">🇺🇬 Uganda (UG)</SelectItem>
            <SelectItem value="ET">🇪🇹 Ethiopia (ET)</SelectItem>
            <SelectItem value="SR">🇱🇰 Sri Lanka (SR)</SelectItem>
            <SelectItem value="MY">🇲🇲 Myanmar (MY)</SelectItem>
            <SelectItem value="NP">🇳🇵 Nepal (NP)</SelectItem>
            <SelectItem value="VN">🇻🇳 Vietnam (VN)</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date_of_birth">Date of Birth *</Label>
        <Input
          id="date_of_birth"
          type="date"
          value={formData.date_of_birth}
          onChange={(e) => updateFormData({ date_of_birth: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="religion">Religion *</Label>
        <Select
          value={formData.religion}
          onValueChange={(value) => updateFormData({ religion: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select religion" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Islam">Islam</SelectItem>
            <SelectItem value="Christianity">Christianity</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maid_status">Maid Status *</Label>
        <Select
          value={formData.maid_status}
          onValueChange={(value) => updateFormData({ maid_status: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ABROAD">ABROAD</SelectItem>
            <SelectItem value="IN COUNTRY DEPLOYED">IN COUNTRY DEPLOYED</SelectItem>
            <SelectItem value="IN COUNTRY RETURNED AWAIT CANCEL">IN COUNTRY RETURNED AWAIT CANCEL</SelectItem>
            <SelectItem value="IN COUNTRY CANCELLED READY FOR MARKET">IN COUNTRY CANCELLED READY FOR MARKET</SelectItem>
            <SelectItem value="RUNAWAY">RUNAWAY</SelectItem>
            <SelectItem value="RETURNED TO COUNTRY RELEASED">RETURNED TO COUNTRY RELEASED</SelectItem>
            <SelectItem value="OTHER">OTHER</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default Step1Identity;
