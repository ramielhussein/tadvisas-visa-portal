import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
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
import { Loader2, Eye, Download, Mail, Phone, Calendar, Package, Plus, FileText, Search, Filter } from "lucide-react";
import { format } from "date-fns";

interface Submission {
  id: string;
  name: string;
  phone: string;
  email: string;
  package: string;
  addons: string[];
  emirates_id_url: string;
  dewa_bill_url: string;
  maid_passport_url: string;
  maid_visa_url: string;
  maid_photo_url: string;
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/");
  };

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch submissions",
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
                    "Login"
                  )}
                </Button>
              </form>
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
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Total Submissions</CardTitle>
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
              <CardTitle>Submissions</CardTitle>
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
                  {selectedSubmission.emirates_id_url && (
                    <a
                      href={selectedSubmission.emirates_id_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">Emirates ID</span>
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