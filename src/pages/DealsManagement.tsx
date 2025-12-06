import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import Layout from "@/components/Layout";
import { Search, Plus, FileText, DollarSign, TrendingUp, Clock, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Deal {
  id: string;
  deal_number: string;
  client_name: string;
  client_phone: string;
  service_type: string;
  deal_value: number;
  total_amount: number;
  status: string;
  created_at: string;
  worker_name: string | null;
}

const DealsManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdminCheck();
  
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDeals: 0,
    totalValue: 0,
    activeDeals: 0,
    closedDeals: 0,
  });

  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredDeals(
        deals.filter(
          (deal) =>
            deal.client_name.toLowerCase().includes(query) ||
            deal.client_phone.includes(query) ||
            deal.deal_number.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredDeals(deals);
    }
  }, [searchQuery, deals]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDeals(data || []);
      setFilteredDeals(data || []);

      // Calculate stats - only Active deals count towards Total Value
      const activeDealsData = data?.filter(d => d.status === 'Active') || [];
      const stats = {
        totalDeals: data?.length || 0,
        totalValue: activeDealsData.reduce((sum, d) => sum + Number(d.total_amount), 0),
        activeDeals: activeDealsData.length,
        closedDeals: data?.filter(d => d.status === 'Closed').length || 0,
      };
      setStats(stats);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Draft: "bg-gray-500",
      Active: "bg-blue-500",
      Closed: "bg-green-500",
      Cancelled: "bg-red-500",
      Void: "bg-orange-500",
    };
    return colors[status] || "bg-gray-500";
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading deals...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Deals & Sales</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/crm/deals/ar-report")}>
                <BarChart3 className="w-4 h-4 mr-2" />
                A/R Report
              </Button>
              <Button onClick={() => navigate("/crm/deals/create")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Deal
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Total Deals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalDeals}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">AED {stats.totalValue.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.activeDeals}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Closed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.closedDeals}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by client name, phone, or deal number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Deals Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Worker</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          No deals found. Create your first deal!
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDeals.map((deal) => (
                        <TableRow key={deal.id} className="text-sm">
                          <TableCell className="font-mono font-medium">
                            {deal.deal_number}
                          </TableCell>
                          <TableCell>{deal.client_name}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {deal.client_phone}
                          </TableCell>
                          <TableCell>{deal.service_type}</TableCell>
                          <TableCell>{deal.worker_name || "-"}</TableCell>
                          <TableCell className="text-right">
                            {Number(deal.deal_value).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {Number(deal.total_amount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("text-xs", getStatusColor(deal.status))}>
                              {deal.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(deal.created_at).toLocaleDateString('en-GB')}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/crm/deals/${deal.id}`)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default DealsManagement;
