import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, Download, Mail, Phone, Calendar, Package, Plus, FileText, Search, Filter, Building2, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface Submission {
  id: string;
  name: string;
  phone: string;
  email: string;
  package: string | null;
  addons: string[];
  emirates_id_front_url: string;
  emirates_id_back_url: string;
  dewa_bill_url: string;
  maid_passport_url: string;
  maid_visa_url: string;
  maid_photo_url: string;
  worker_photo_url: string | null;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, statusFilter, searchQuery]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    
    console.log("Attempting login with:", { email, supabaseUrl: supabase });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Login response:", { data, error });

      if (error) {
        console.error("Login error details:", error);
        throw error;
      }

      setUser(data.user);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    } catch (error: any) {
      console.error("Caught error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to login",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin`,
        }
      });

      if (error) {
        console.error("Google login error:", error);
        throw error;
      }

      console.log("Google login initiated:", data);
    } catch (error: any) {
      console.error("Caught error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to login with Google",
        variant: "destructive",
      });
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/");
  };

  const fetchSubmissions = async () => {
    try {
      console.log("Fetching submissions from Supabase...");
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("Supabase response:", { data, error });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      setSubmissions(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "No submissions found",
          description: "The database is empty. Submit a form first to see data here.",
        });
      } else {
        toast({
          title: "Success",
          description: `Loaded ${data.length} submission(s)`,
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch submissions:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch submissions. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    if (statusFilter !== "all") {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery)
      );
    }

    setFilteredSubmissions(filtered);
  };

  const updateSubmissionStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("submissions")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      fetchSubmissions();
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const updateSubmissionNotes = async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from("submissions")
        .update({ notes, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      fetchSubmissions();
      toast({
        title: "Success",
        description: "Notes updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notes",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "yellow";
      case "reviewing": return "blue";
      case "approved": return "green";
      case "rejected": return "red";
      default: return "gray";
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Admin Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isAuthenticating}>
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login with Email"
                  )}
                </Button>
              </form>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <Button 
                onClick={handleGoogleLogin} 
                className="w-full" 
                variant="outline"
                disabled={isAuthenticating}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Sign in with Google
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Forms & Submissions</h1>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/suppliers')} variant="outline">
                <Building2 className="w-4 h-4 mr-2" />
                Suppliers & A/P
              </Button>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </div>
          </div>

          {/* Quick Access Links */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Admin Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col items-start"
                  onClick={() => navigate('/suppliers')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5" />
                    <span className="font-semibold">Suppliers & Accounts Payable</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Manage supplier information and track outstanding payments
                  </p>
                  <ArrowRight className="w-4 h-4 mt-2 ml-auto" />
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col items-start"
                  onClick={() => navigate('/crm/dashboard')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5" />
                    <span className="font-semibold">CRM Dashboard</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    View leads, sales performance, and follow-ups
                  </p>
                  <ArrowRight className="w-4 h-4 mt-2 ml-auto" />
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col items-start"
                  onClick={() => navigate('/financial')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5" />
                    <span className="font-semibold">Financial Dashboard</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    View financial overview and accounts receivable
                  </p>
                  <ArrowRight className="w-4 h-4 mt-2 ml-auto" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Total Client Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{submissions.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-600">
                  {submissions.filter(s => s.status === "pending").length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {submissions.filter(s => s.status === "approved").length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Reviewing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">
                  {submissions.filter(s => s.status === "reviewing").length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by name, email, or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Submissions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Client Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          {format(new Date(submission.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">{submission.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {submission.email}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {submission.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{submission.package}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(submission.status) as any}>
                            {submission.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Submission Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              Submitted on {selectedSubmission && format(new Date(selectedSubmission.created_at), "MMMM dd, yyyy 'at' hh:mm a")}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="font-semibold mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{selectedSubmission.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium">{selectedSubmission.phone}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{selectedSubmission.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Package:</span>
                    <p className="font-medium">{selectedSubmission.package}</p>
                  </div>
                </div>
                {selectedSubmission.addons && selectedSubmission.addons.length > 0 && (
                  <div className="mt-4">
                    <span className="text-muted-foreground text-sm">Add-ons:</span>
                    <div className="flex gap-2 mt-1">
                      {selectedSubmission.addons.map((addon, idx) => (
                        <Badge key={idx} variant="secondary">{addon}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-semibold mb-3">Documents</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedSubmission.emirates_id_front_url && (
                    <a
                      href={selectedSubmission.emirates_id_front_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">Emirates ID (Front)</span>
                      <Download className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                  {selectedSubmission.emirates_id_back_url && (
                    <a
                      href={selectedSubmission.emirates_id_back_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">Emirates ID (Back)</span>
                      <Download className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                  {selectedSubmission.dewa_bill_url && (
                    <a
                      href={selectedSubmission.dewa_bill_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">DEWA Bill</span>
                      <Download className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                  {selectedSubmission.maid_passport_url && (
                    <a
                      href={selectedSubmission.maid_passport_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">Maid Passport</span>
                      <Download className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                  {selectedSubmission.maid_visa_url && (
                    <a
                      href={selectedSubmission.maid_visa_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">Maid Visa</span>
                      <Download className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                  {selectedSubmission.maid_photo_url && (
                    <a
                      href={selectedSubmission.maid_photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">Maid Photo</span>
                      <Download className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                </div>
              </div>

              {/* Status & Notes */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select
                    value={selectedSubmission.status}
                    onValueChange={(value) => updateSubmissionStatus(selectedSubmission.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Internal Notes</label>
                  <Textarea
                    placeholder="Add notes about this submission..."
                    value={selectedSubmission.notes || ""}
                    onChange={(e) => {
                      const updated = { ...selectedSubmission, notes: e.target.value };
                      setSelectedSubmission(updated);
                    }}
                    onBlur={() => updateSubmissionNotes(selectedSubmission.id, selectedSubmission.notes || "")}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}