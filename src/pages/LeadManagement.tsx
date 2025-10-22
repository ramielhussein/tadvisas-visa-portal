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
import { Search, Plus, Download, Upload } from "lucide-react";
import Layout from "@/components/Layout";
import QuickLeadEntry from "@/components/crm/QuickLeadEntry";

interface Lead {
  id: string;
  client_name: string;
  email: string | null;
  mobile_number: string;
  emirate: string | null;
  status: string;
  service_required: string | null;
  nationality_code: string | null;
  remind_me: string;
  created_at: string;
}

const LeadManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, isLoading: authLoading } = useAdminCheck();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickEntry, setShowQuickEntry] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/auth");
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    // Keyboard shortcut Ctrl+Shift+L
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        setShowQuickEntry(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredLeads(leads);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredLeads(
        leads.filter(
          (lead) =>
            lead.mobile_number.includes(query) ||
            lead.client_name.toLowerCase().includes(query) ||
            lead.email?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, leads]);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
      setFilteredLeads(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "New Lead": "bg-blue-500",
      "Warm": "bg-yellow-500",
      "HOT": "bg-red-500",
      "SOLD": "bg-green-500",
      "LOST": "bg-gray-500",
      "PROBLEM": "bg-purple-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const handleImportExcel = () => {
    toast({
      title: "Coming Soon",
      description: "Excel import functionality will be available soon!",
    });
  };

  const handleImportGoogle = () => {
    toast({
      title: "Coming Soon",
      description: "Google Sheets import functionality will be available soon!",
    });
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">TADCRM - Lead Management</h1>
            <div className="flex gap-2">
              <Button onClick={handleImportGoogle} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Import Google Sheets
              </Button>
              <Button onClick={handleImportExcel} variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import Excel
              </Button>
              <Button onClick={() => setShowQuickEntry(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Lead (Ctrl+Shift+L)
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{leads.length}</p>
              </CardContent>
            </Card>
            {["New Lead", "Warm", "HOT", "SOLD", "LOST"].map((status) => (
              <Card key={status}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{status}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {leads.filter((l) => l.status === status).length}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by phone number, name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Leads Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Emirate</TableHead>
                      <TableHead>Nationality</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remind Me</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          No leads found. Add your first lead!
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">
                            {lead.client_name}
                          </TableCell>
                          <TableCell>{lead.mobile_number}</TableCell>
                          <TableCell>{lead.email || "-"}</TableCell>
                          <TableCell>{lead.emirate || "-"}</TableCell>
                          <TableCell>{lead.nationality_code || "-"}</TableCell>
                          <TableCell>{lead.service_required || "-"}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(lead.status)}>
                              {lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(lead.remind_me).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(lead.created_at).toLocaleDateString()}
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

      <QuickLeadEntry
        open={showQuickEntry}
        onClose={() => setShowQuickEntry(false)}
        onSuccess={fetchLeads}
      />
    </Layout>
  );
};

export default LeadManagement;
