import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { CVFormData } from "@/components/cvwizard/types";

interface Props {
  formData: CVFormData;
  updateFormData: (data: Partial<CVFormData>) => void;
}

const Step9Financials = ({ formData, updateFormData }: Props) => {
  const updateCost = (index: number, amount: number) => {
    const costs = [...formData.financials.costs];
    costs[index].amount = amount;
    updateFormData({
      financials: { ...formData.financials, costs },
    });
  };

  const addRevenue = () => {
    updateFormData({
      financials: {
        ...formData.financials,
        revenues: [
          ...formData.financials.revenues,
          { label: `Revenue ${formData.financials.revenues.length + 1}`, amount: 0 },
        ],
      },
    });
  };

  const updateRevenue = (index: number, amount: number) => {
    const revenues = [...formData.financials.revenues];
    revenues[index].amount = amount;
    updateFormData({
      financials: { ...formData.financials, revenues },
    });
  };

  const removeRevenue = (index: number) => {
    updateFormData({
      financials: {
        ...formData.financials,
        revenues: formData.financials.revenues.filter((_, i) => i !== index),
      },
    });
  };

  const totalCost = formData.financials.costs.reduce((sum, c) => sum + c.amount, 0);
  const totalRevenue = formData.financials.revenues.reduce((sum, r) => sum + r.amount, 0);
  const pnl = totalRevenue - totalCost;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Financials (Optional)</h3>

      <div className="space-y-2">
        <Label htmlFor="salary">Expected Maid Salary (AED per month)</Label>
        <Input
          id="salary"
          type="number"
          min={0}
          value={formData.salary || ''}
          onChange={(e) => updateFormData({ salary: parseFloat(e.target.value) || undefined })}
          placeholder="e.g. 1500"
        />
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Costs</h4>
        {formData.financials.costs.map((cost, index) => (
          <div key={index} className="space-y-2">
            <Label>{cost.label}</Label>
            <Input
              type="number"
              min={0}
              value={cost.amount}
              onChange={(e) => updateCost(index, parseFloat(e.target.value) || 0)}
            />
          </div>
        ))}
        <div className="pt-2 border-t">
          <p className="font-semibold">Total Cost: {totalCost.toFixed(2)} AED</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Revenues</h4>
          <Button type="button" onClick={addRevenue} variant="outline" size="sm">
            Add Revenue
          </Button>
        </div>

        {formData.financials.revenues.map((revenue, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label>{revenue.label}</Label>
              <Input
                type="number"
                min={0}
                value={revenue.amount}
                onChange={(e) => updateRevenue(index, parseFloat(e.target.value) || 0)}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeRevenue(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <div className="pt-2 border-t">
          <p className="font-semibold">Total Revenue: {totalRevenue.toFixed(2)} AED</p>
        </div>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-lg font-bold">
          P&L: {pnl.toFixed(2)} AED{" "}
          <span className={pnl >= 0 ? "text-green-600" : "text-red-600"}>
            {pnl >= 0 ? "↑" : "↓"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Step9Financials;
