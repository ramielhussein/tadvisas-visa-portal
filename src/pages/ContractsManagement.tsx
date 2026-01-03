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

interface Contract {
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
  assigned_to: string | null;
  created_by_name?: string | null;
}

const ContractsManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdminCheck();
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalContracts: 0,
    totalValue: 0,
    activeContracts: 0,
    closedContracts: 0,
  });

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredContracts(
        contracts.filter(
          (contract) =>
            contract.client_name.toLowerCase().includes(query) ||
            contract.client_phone.includes(query) ||
            contract.deal_number.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredContracts(contracts);
    }
  }, [searchQuery, contracts]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique user IDs to fetch their names
      const userIds = [...new Set((data || []).map(d => d.assigned_to).filter(Boolean))];
      
      let profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        
        profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = p.full_name || '';
          return acc;
        }, {} as Record<string, string>);
      }

      // Map the data to include created_by_name
      const contractsWithCreator = (data || []).map((contract: any) => ({
        ...contract,
        created_by_name: contract.assigned_to ? profilesMap[contract.assigned_to] || null : null,
      }));

      setContracts(contractsWithCreator);
      setFilteredContracts(contractsWithCreator);

      // Calculate stats - only Active contracts count towards Total Value
      const activeContractsData = (data || []).filter(d => d.status === 'Active');
      const stats = {
        totalContracts: data?.length || 0,
        totalValue: activeContractsData.reduce((sum, d) => sum + Number(d.total_amount), 0),
        activeContracts: activeContractsData.length,
        closedContracts: (data || []).filter(d => d.status === 'Closed').length,
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
            <p>Loading contracts...</p>
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
            <h1 className="text-4xl font-bold">Contracts</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/crm/contracts/ar-report")}>
                <BarChart3 className="w-4 h-4 mr-2" />
                A/R Report
              </Button>
              <Button onClick={() => navigate("/crm/contracts/create")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Contract
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Total Contracts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalContracts}</p>
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
                <p className="text-2xl font-bold">{stats.activeContracts}</p>
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
                <p className="text-2xl font-bold">{stats.closedContracts}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by client name, phone, or contract number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Contracts Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Worker</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8">
                          No contracts found. Create your first contract!
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredContracts.map((contract) => (
                        <TableRow key={contract.id} className="text-sm">
                          <TableCell className="font-mono font-medium">
                            {contract.deal_number}
                          </TableCell>
                          <TableCell>{contract.client_name}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {contract.client_phone}
                          </TableCell>
                          <TableCell>{contract.service_type}</TableCell>
                          <TableCell>{contract.worker_name || "-"}</TableCell>
                          <TableCell className="text-right">
                            {Number(contract.deal_value).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {Number(contract.total_amount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("text-xs", getStatusColor(contract.status))}>
                              {contract.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {contract.created_by_name || "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(contract.created_at).toLocaleDateString('en-GB')}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/crm/contracts/${contract.id}`)}
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

export default ContractsManagement;