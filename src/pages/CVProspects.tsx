import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, Plus, MessageCircle, Check, Trash2, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface CVProspect {
  id: string;
  mobile_number: string;
  name: string | null;
  nationality_code: string | null;
  notes: string | null;
  status: string;
  converted: boolean;
  worker_id: string | null;
  created_at: string;
}

const CVProspects = () => {
  const { toast } = useToast();
  const [prospects, setProspects] = useState<CVProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPhone, setNewPhone] = useState("");
  const [adding, setAdding] = useState(false);

  const loadProspects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cv_prospects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProspects(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProspects();
  }, []);

  const handleQuickAdd = async () => {
    if (!newPhone.trim()) {
      toast({ title: "Error", description: "Please enter a phone number", variant: "destructive" });
      return;
    }

    setAdding(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('cv_prospects')
      .insert({
        mobile_number: newPhone.trim(),
        created_by: user?.id,
      });

    if (error) {
      if (error.code === '23505') {
        toast({ title: "Duplicate", description: "This phone number already exists", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Success", description: "Prospect added" });
      setNewPhone("");
      loadProspects();
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('cv_prospects')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Prospect removed" });
      loadProspects();
    }
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent("Hi! We noticed you're interested in domestic worker opportunities. Apply now at: " + window.location.origin + "/apply");
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const getPublicLink = () => {
    return `${window.location.origin}/apply`;
  };

  const copyPublicLink = () => {
    navigator.clipboard.writeText(getPublicLink());
    toast({ title: "Copied!", description: "Public application link copied to clipboard" });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">CV Prospects</h1>
            <p className="text-muted-foreground">Track potential applicants and send them the application link</p>
          </div>
          <Button onClick={copyPublicLink} variant="outline">
            <Link2 className="h-4 w-4 mr-2" />
            Copy Application Link
          </Button>
        </div>

        {/* Quick Add */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Add Phone Number</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="+971 50 123 4567"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
              />
              <Button onClick={handleQuickAdd} disabled={adding}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{prospects.length}</div>
              <p className="text-sm text-muted-foreground">Total Prospects</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{prospects.filter(p => p.converted).length}</div>
              <p className="text-sm text-muted-foreground">Converted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{prospects.filter(p => !p.converted).length}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Prospects List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              </div>
            ) : prospects.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No prospects yet. Add phone numbers to start tracking.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prospects.map((prospect) => (
                    <TableRow key={prospect.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {prospect.mobile_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        {prospect.converted ? (
                          <Badge variant="default" className="bg-green-500">
                            <Check className="h-3 w-3 mr-1" />
                            Converted
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(prospect.created_at), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleWhatsApp(prospect.mobile_number)}
                            title="Send WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          {!prospect.converted && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(prospect.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CVProspects;
