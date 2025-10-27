import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RefundData {
  id: string;
  contract_no: string;
  client_name: string;
  worker_name: string;
  nationality: string;
  emirate: string;
  total_refund_amount: number;
  returned_date: string;
  delivered_date: string;
  days_worked: number;
  reason?: string;
  other_reason?: string;
  stage?: string;
  location: string;
  visa_vpa_done?: boolean;
  doc_cancel?: boolean;
  doc_passport?: boolean;
  doc_phone?: boolean;
  abu_dhabi_insurance_cancelled?: boolean;
  abscond_report?: boolean;
  abscond_date?: string;
  unpaid_salary_days?: number;
  salary_aed?: number;
  cash_assistance_aed?: number;
  gov_visa_aed?: number;
  medical_visa_cost_aed?: number;
  standard_tadbeer_fees_aed?: number;
  direct_hire?: boolean;
  fail_bring?: boolean;
  at_fault?: boolean;
  enough_time?: boolean;
  option_b?: boolean;
  notes?: string;
}

interface CompleteRefundDialogProps {
  refund: RefundData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CANCELLATION_REASONS = [
  "Maid Performance Issues",
  "Client Relocation",
  "Financial Constraints",
  "Health Issues",
  "Family Emergency",
  "Maid Absconded",
  "Contract Violation",
  "Other"
];

const STAGES = [
  "Inside Country",
  "Outside Country",
  "In Transit",
  "At Agency"
];

export default function CompleteRefundDialog({ refund, open, onOpenChange, onSuccess }: CompleteRefundDialogProps) {
  const [formData, setFormData] = useState<Partial<RefundData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (refund) {
      setFormData({
        reason: refund.reason || "",
        other_reason: refund.other_reason || "",
        stage: refund.stage || "",
        visa_vpa_done: refund.visa_vpa_done || false,
        doc_cancel: refund.doc_cancel || false,
        doc_passport: refund.doc_passport || false,
        doc_phone: refund.doc_phone || false,
        abu_dhabi_insurance_cancelled: refund.abu_dhabi_insurance_cancelled || false,
        abscond_report: refund.abscond_report || false,
        abscond_date: refund.abscond_date || "",
        unpaid_salary_days: refund.unpaid_salary_days || 0,
        salary_aed: refund.salary_aed || 0,
        cash_assistance_aed: refund.cash_assistance_aed || 0,
        gov_visa_aed: refund.gov_visa_aed || 0,
        medical_visa_cost_aed: refund.medical_visa_cost_aed || 0,
        standard_tadbeer_fees_aed: refund.standard_tadbeer_fees_aed || 0,
        direct_hire: refund.direct_hire || false,
        fail_bring: refund.fail_bring || false,
        at_fault: refund.at_fault || false,
        enough_time: refund.enough_time !== undefined ? refund.enough_time : true,
        option_b: refund.option_b || false,
        notes: refund.notes || "",
      });
    }
  }, [refund]);

  const handleSubmit = async () => {
    if (!refund) return;
    
    if (!formData.reason) {
      toast.error("Please select a cancellation reason");
      return;
    }

    if (formData.reason === "Other" && !formData.other_reason) {
      toast.error("Please specify the other reason");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("refunds")
        .update({
          ...formData,
          status: "pending_approval",
        })
        .eq("id", refund.id);

      if (error) throw error;

      toast.success("Refund submitted for approval");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to submit refund", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!refund) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Refund Details</DialogTitle>
          <DialogDescription>
            Fill in all required details for refund {refund.contract_no}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Info Summary */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Contract:</p>
              <p className="text-sm text-muted-foreground">{refund.contract_no}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Client:</p>
              <p className="text-sm text-muted-foreground">{refund.client_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Worker:</p>
              <p className="text-sm text-muted-foreground">{refund.worker_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Refund Amount:</p>
              <p className="text-sm text-muted-foreground font-semibold">{refund.total_refund_amount?.toLocaleString()} AED</p>
            </div>
          </div>

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label>Cancellation Reason *</Label>
            <Select value={formData.reason} onValueChange={(value) => setFormData({ ...formData, reason: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.reason === "Other" && (
            <div className="space-y-2">
              <Label>Specify Other Reason *</Label>
              <Input
                value={formData.other_reason || ""}
                onChange={(e) => setFormData({ ...formData, other_reason: e.target.value })}
                placeholder="Enter specific reason"
              />
            </div>
          )}

          {/* Stage */}
          <div className="space-y-2">
            <Label>Current Stage</Label>
            <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Checkboxes Section */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold">Processing Status</h4>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="visa_vpa_done"
                checked={formData.visa_vpa_done}
                onCheckedChange={(checked) => setFormData({ ...formData, visa_vpa_done: checked as boolean })}
              />
              <Label htmlFor="visa_vpa_done" className="cursor-pointer">Visa VPA Completed</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="abu_dhabi_insurance_cancelled"
                checked={formData.abu_dhabi_insurance_cancelled}
                onCheckedChange={(checked) => setFormData({ ...formData, abu_dhabi_insurance_cancelled: checked as boolean })}
              />
              <Label htmlFor="abu_dhabi_insurance_cancelled" className="cursor-pointer">Abu Dhabi Insurance Cancelled</Label>
            </div>
          </div>

          {/* Documents Returned */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold">Documents Returned</h4>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="doc_cancel"
                checked={formData.doc_cancel}
                onCheckedChange={(checked) => setFormData({ ...formData, doc_cancel: checked as boolean })}
              />
              <Label htmlFor="doc_cancel" className="cursor-pointer">Cancellation Document</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="doc_passport"
                checked={formData.doc_passport}
                onCheckedChange={(checked) => setFormData({ ...formData, doc_passport: checked as boolean })}
              />
              <Label htmlFor="doc_passport" className="cursor-pointer">Passport</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="doc_phone"
                checked={formData.doc_phone}
                onCheckedChange={(checked) => setFormData({ ...formData, doc_phone: checked as boolean })}
              />
              <Label htmlFor="doc_phone" className="cursor-pointer">Phone</Label>
            </div>
          </div>

          {/* Abscond Information */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold">Abscond Information</h4>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="abscond_report"
                checked={formData.abscond_report}
                onCheckedChange={(checked) => setFormData({ ...formData, abscond_report: checked as boolean })}
              />
              <Label htmlFor="abscond_report" className="cursor-pointer">Abscond Report Filed</Label>
            </div>

            {formData.abscond_report && (
              <div className="space-y-2">
                <Label>Abscond Date</Label>
                <Input
                  type="date"
                  value={formData.abscond_date || ""}
                  onChange={(e) => setFormData({ ...formData, abscond_date: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* Financial Details */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold">Financial Details (AED)</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Worker Salary</Label>
                <Input
                  type="number"
                  value={formData.salary_aed || 0}
                  onChange={(e) => setFormData({ ...formData, salary_aed: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Unpaid Salary Days</Label>
                <Input
                  type="number"
                  value={formData.unpaid_salary_days || 0}
                  onChange={(e) => setFormData({ ...formData, unpaid_salary_days: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Cash Assistance</Label>
                <Input
                  type="number"
                  value={formData.cash_assistance_aed || 0}
                  onChange={(e) => setFormData({ ...formData, cash_assistance_aed: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Government Visa Cost</Label>
                <Input
                  type="number"
                  value={formData.gov_visa_aed || 0}
                  onChange={(e) => setFormData({ ...formData, gov_visa_aed: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Medical/Visa Cost</Label>
                <Input
                  type="number"
                  value={formData.medical_visa_cost_aed || 0}
                  onChange={(e) => setFormData({ ...formData, medical_visa_cost_aed: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Standard Tadbeer Fees</Label>
                <Input
                  type="number"
                  value={formData.standard_tadbeer_fees_aed || 0}
                  onChange={(e) => setFormData({ ...formData, standard_tadbeer_fees_aed: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold">Additional Information</h4>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="direct_hire"
                checked={formData.direct_hire}
                onCheckedChange={(checked) => setFormData({ ...formData, direct_hire: checked as boolean })}
              />
              <Label htmlFor="direct_hire" className="cursor-pointer">Direct Hire</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="fail_bring"
                checked={formData.fail_bring}
                onCheckedChange={(checked) => setFormData({ ...formData, fail_bring: checked as boolean })}
              />
              <Label htmlFor="fail_bring" className="cursor-pointer">Failed to Bring Worker</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="at_fault"
                checked={formData.at_fault}
                onCheckedChange={(checked) => setFormData({ ...formData, at_fault: checked as boolean })}
              />
              <Label htmlFor="at_fault" className="cursor-pointer">Client at Fault</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="enough_time"
                checked={formData.enough_time}
                onCheckedChange={(checked) => setFormData({ ...formData, enough_time: checked as boolean })}
              />
              <Label htmlFor="enough_time" className="cursor-pointer">Enough Time Given</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="option_b"
                checked={formData.option_b}
                onCheckedChange={(checked) => setFormData({ ...formData, option_b: checked as boolean })}
              />
              <Label htmlFor="option_b" className="cursor-pointer">Option B Selected</Label>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information or comments..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
