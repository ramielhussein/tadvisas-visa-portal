import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CVFormData } from "@/pages/CVWizard";

interface Props {
  formData: CVFormData;
  updateFormData: (data: Partial<CVFormData>) => void;
}

const Step10Consent = ({ formData, updateFormData }: Props) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Privacy & Consent</h3>

      <div className="p-4 bg-muted rounded-lg space-y-4">
        <h4 className="font-medium">Privacy Notice</h4>
        <p className="text-sm">
          By submitting this form, you acknowledge that:
        </p>
        <ul className="text-sm space-y-2 list-disc list-inside">
          <li>All information provided is accurate and complete</li>
          <li>Your personal data will be stored securely and used for recruitment purposes</li>
          <li>Your documents (passport, photos, certificates) will be shared with potential employers</li>
          <li>Tadmaids may contact you via phone, email, or WhatsApp regarding job opportunities</li>
          <li>Your data will be handled in accordance with UAE data protection regulations</li>
          <li>You have the right to request access, correction, or deletion of your personal data</li>
        </ul>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox
          id="consent"
          checked={formData.consent}
          onCheckedChange={(checked) => updateFormData({ consent: !!checked })}
        />
        <Label htmlFor="consent" className="cursor-pointer">
          I consent to the collection, storage, and processing of my personal data as described above. *
        </Label>
      </div>

      {!formData.consent && (
        <p className="text-sm text-destructive">
          You must accept the consent checkbox to submit your CV.
        </p>
      )}
    </div>
  );
};

export default Step10Consent;
