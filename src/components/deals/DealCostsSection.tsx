import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface DealCost {
  id: string;
  deal_id: string;
  cost_category: string;
  description: string | null;
  amount: number;
  supplier_id: string | null;
  created_at: string;
}

interface DealCostsSectionProps {
  dealId: string;
  totalRevenue: number;
}

const COST_CATEGORIES = [
  { value: "worker_cost", label: "Worker Cost" },
  { value: "visa_cost", label: "Visa Cost" },
  { value: "medical", label: "Medical" },
  { value: "transport", label: "Transport" },
  { value: "commission", label: "Commission" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
];

const DealCostsSection = ({ dealId, totalRevenue }: DealCostsSectionProps) => {
  const { toast } = useToast();
  const [costs, setCosts] = useState<DealCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCost, setNewCost] = useState({
    cost_category: "",
    description: "",
    amount: "",
    supplier_id: "",
  });

  useEffect(() => {
    fetchCosts();
    fetchSuppliers();
  }, [dealId]);

  const fetchCosts = async () => {
    try {
      const { data, error } = await supabase
        .from("deal_costs")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCosts(data || []);
    } catch (error: any) {
      console.error("Error fetching costs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from("suppliers")
      .select("id, supplier_name")
      .eq("status", "Active")
      .order("supplier_name");
    
    setSuppliers(data || []);
  };

  const handleAddCost = async () => {
    if (!newCost.cost_category || !newCost.amount) {
      toast({
        title: "Missing Fields",
        description: "Please select a category and enter an amount",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("deal_costs")
        .insert({
          deal_id: dealId,
          cost_category: newCost.cost_category,
          description: newCost.description || null,
          amount: parseFloat(newCost.amount),
          supplier_id: newCost.supplier_id || null,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Cost Added",
        description: "Cost item has been added successfully",
      });

      setNewCost({ cost_category: "", description: "", amount: "", supplier_id: "" });
      setShowAddForm(false);
      fetchCosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCost = async (costId: string) => {
    try {
      const { error } = await supabase
        .from("deal_costs")
        .delete()
        .eq("id", costId);

      if (error) throw error;

      toast({
        title: "Cost Deleted",
        description: "Cost item has been removed",
      });

      fetchCosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalCosts = costs.reduce((sum, cost) => sum + cost.amount, 0);
  const grossProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const getCategoryLabel = (value: string) => {
    return COST_CATEGORIES.find(c => c.value === value)?.label || value;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Cost of Goods & Profit
          </span>
          {!showAddForm && (
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Cost
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profit Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Revenue</p>
            <p className="font-semibold text-green-600">{totalRevenue.toLocaleString()} AED</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total COGS</p>
            <p className="font-semibold text-red-600">{totalCosts.toLocaleString()} AED</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Gross Profit</p>
            <div className="flex items-center gap-1">
              {grossProfit >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <p className={`font-semibold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {grossProfit.toLocaleString()} AED
              </p>
            </div>
            <p className="text-xs text-muted-foreground">({profitMargin.toFixed(1)}% margin)</p>
          </div>
        </div>

        {/* Add Cost Form */}
        {showAddForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-background">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category *</Label>
                <Select 
                  value={newCost.cost_category} 
                  onValueChange={(value) => setNewCost({ ...newCost, cost_category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {COST_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (AED) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newCost.amount}
                  onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                placeholder="Optional description"
                value={newCost.description}
                onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Supplier (Optional)</Label>
              <Select 
                value={newCost.supplier_id} 
                onValueChange={(value) => setNewCost({ ...newCost, supplier_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.supplier_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewCost({ cost_category: "", description: "", amount: "", supplier_id: "" });
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddCost} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Add Cost
              </Button>
            </div>
          </div>
        )}

        {/* Cost Items */}
        {costs.length > 0 ? (
          <div className="space-y-2">
            <Separator />
            <p className="text-sm font-medium">Cost Breakdown</p>
            {costs.map((cost) => (
              <div 
                key={cost.id} 
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{getCategoryLabel(cost.cost_category)}</span>
                    <span className="text-sm font-semibold text-red-600">
                      -{cost.amount.toLocaleString()} AED
                    </span>
                  </div>
                  {cost.description && (
                    <p className="text-xs text-muted-foreground">{cost.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteCost(cost.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : !showAddForm ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No costs recorded yet. Add costs to track profit.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default DealCostsSection;
