import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Search, Plus, Download, Upload, ArrowUpDown } from "lucide-react";
import Layout from "@/components/Layout";
import QuickLeadEntry from "@/components/crm/QuickLeadEntry";
import RoundRobinToggle from "@/components/crm/RoundRobinToggle";
import { cn } from "@/lib/utils";

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
  assigned_to: string | null;
  client_converted: boolean;
  submission_id: string | null;
}

interface User {
  id: string;
  email: string;
}

const LeadManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminCheckLoading } = useAdminCheck();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [sortColumn, setSortColumn] = useState<'nationality_code' | 'service_required' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      setAuthChecking(false);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
      
      if (!session?.user && event !== 'INITIAL_SESSION') {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (currentUser && !authChecking) {
      fetchLeads();
      fetchUsers();
    }
  }, [currentUser, authChecking, isAdmin]);

  useEffect(() => {
    // Keyboard shortcut Ctrl+Shift+Q (changed from L)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
        e.preventDefault();
        setShowQuickEntry(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    let filtered = leads;
    
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = leads.filter(
        (lead) =>
          (lead.mobile_number?.toLowerCase?.().includes(query) ?? false) ||
          ((lead.client_name || "").toLowerCase().includes(query)) ||
          ((lead.email || "").toLowerCase().includes(query))
      );
    }

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn] || "";
        const bVal = b[sortColumn] || "";
        
        if (sortDirection === 'asc') {
          return aVal.localeCompare(bVal);
        } else {
          return bVal.localeCompare(aVal);
        }
      });
    }

    setFilteredLeads(filtered);
  }, [searchQuery, leads, sortColumn, sortDirection]);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      
      // Build query based on user role
      let query = supabase.from("leads").select("*", { count: 'exact' });
      
      // If not admin, only show leads assigned to current user
      if (!isAdmin && currentUser) {
        query = query.eq("assigned_to", currentUser.id);
      }
      
      // Remove default 1000 row limit by setting a high range
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(0, 9999);

      if (error) throw error;
      setLeads(data || []);
      setFilteredLeads(data || []);
    } catch (error: any) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email")
        .order("email");

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
    }
  };

  const handleAssignLead = async (leadId: string, userId: string | null) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ assigned_to: userId })
        .eq("id", leadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead assignment updated",
      });

      fetchLeads();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getAssignedEmail = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const user = users.find(u => u.id === userId);
    return user?.email || "Unknown";
  };

  const handleSort = (column: 'nationality_code' | 'service_required') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
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

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('import-leads-excel', {
        body: formData,
      });

      if (error) throw error;

      const result = data as {
        total: number;
        imported: number;
        duplicates: number;
        errors: number;
        duplicateNumbers: string[];
        errorDetails: Array<{ row: number; error: string }>;
      };

      toast({
        title: "Import Complete",
        description: `Imported ${result.imported} leads. Skipped ${result.duplicates} duplicates. ${result.errors} errors.`,
      });

      // Show detailed results if there are issues
      if (result.duplicates > 0 || result.errors > 0) {
        console.log('Import details:', {
          duplicates: result.duplicateNumbers,
          errors: result.errorDetails,
        });
      }

      // Refresh the leads list
      fetchLeads();
    } catch (error: any) {
      console.error("Error importing Excel:", error);
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleImportGoogle = () => {
    toast({
      title: "Coming Soon",
      description: "Google Sheets import functionality will be available soon!",
    });
  };

  if (authChecking || isLoading || adminCheckLoading) {
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
            <div>
              <h1 className="text-4xl font-bold">
                {isAdmin ? "TADCRM - Lead Management" : "My Assigned Leads"}
              </h1>
              {!isAdmin && (
                <p className="text-sm text-muted-foreground mt-2">
                  Viewing leads assigned to you
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <>
                  <Button onClick={handleImportGoogle} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Import Google Sheets
                  </Button>
                  <Button variant="outline" asChild>
                    <label className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Import Excel
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleImportExcel}
                        className="hidden"
                      />
                    </label>
                  </Button>
                  <Button onClick={() => setShowQuickEntry(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lead (Ctrl+Shift+Q)
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Round Robin Toggle - Admin only */}
          {isAdmin && (
            <div className="mb-8">
              <RoundRobinToggle />
            </div>
          )}

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
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Leads Table */}
          <Card>
            <CardHeader>
              <CardTitle>{isAdmin ? "All Leads" : "My Leads"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Name</TableHead>
                      <TableHead className="min-w-[110px]">Mobile</TableHead>
                      <TableHead className="hidden lg:table-cell">Email</TableHead>
                      <TableHead className="hidden md:table-cell">Emirate</TableHead>
                      <TableHead className="min-w-[60px]">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('nationality_code')}
                          className="h-8 px-1 hover:bg-accent"
                        >
                          Nat.
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="hidden xl:table-cell">
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('service_required')}
                          className="h-8 px-1 hover:bg-accent"
                        >
                          Service
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                      {isAdmin && <TableHead className="min-w-[140px]">Assigned</TableHead>}
                      <TableHead className="hidden md:table-cell min-w-[90px]">Remind</TableHead>
                      <TableHead className="hidden lg:table-cell min-w-[90px]">Created</TableHead>
                      <TableHead className="min-w-[100px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8">
                          No leads found. Add your first lead!
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((lead) => (
                        <TableRow key={lead.id} className="text-sm">
                          <TableCell className="font-medium">
                            {lead.client_name || "-"}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{lead.mobile_number}</TableCell>
                          <TableCell className="hidden lg:table-cell truncate max-w-[150px]">{lead.email || "-"}</TableCell>
                          <TableCell className="hidden md:table-cell">{lead.emirate || "-"}</TableCell>
                          <TableCell>{lead.nationality_code || "-"}</TableCell>
                          <TableCell className="hidden xl:table-cell truncate max-w-[120px]">{lead.service_required || "-"}</TableCell>
                          <TableCell>
                            <Badge className={cn("text-xs px-2 py-0", getStatusColor(lead.status))}>
                              {lead.status}
                            </Badge>
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              <Select
                                value={lead.assigned_to || "unassigned"}
                                onValueChange={(value) =>
                                  handleAssignLead(
                                    lead.id,
                                    value === "unassigned" ? null : value
                                  )
                                }
                              >
                                <SelectTrigger className="w-[130px] h-8 text-xs">
                                  <SelectValue placeholder="Unassigned" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">
                                    Unassigned
                                  </SelectItem>
                                  {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.email.split('@')[0]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          )}
                          <TableCell className="hidden md:table-cell text-xs">
                            {new Date(lead.remind_me).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs">
                            {new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </TableCell>
                          <TableCell>
                            {lead.client_converted ? (
                              <Badge variant="outline" className="bg-green-50 text-xs whitespace-nowrap">
                                ✓ Client
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2"
                                onClick={() => navigate(`/start-here?lead_id=${lead.id}`)}
                              >
                                Convert
                              </Button>
                            )}
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
