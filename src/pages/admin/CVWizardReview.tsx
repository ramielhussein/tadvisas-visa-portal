import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, CheckCircle, XCircle, CreditCard, Download, Building2, Edit, Save, X } from "lucide-react";
import PullWorkerDialog from "@/components/cvwizard/PullWorkerDialog";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// @ts-ignore
import html2canvas from "html2canvas";

interface Worker {
  id: string;
  passport_no: string;
  name: string;
  center_ref: string;
  nationality_code: string;
  job1: string;
  job2?: string;
  age: number;
  status: string;
  created_at: string;
  maid_status: string;
  religion?: string;
  marital_status?: string;
  children?: number;
  height_cm?: number;
  weight_kg?: number;
  salary?: number;
  experience: Array<{ country: string; years: number }>;
  languages: Array<{ name: string; level: string }>;
  skills?: any;
  education?: any;
  files?: any;
  financials: any;
}

const CVWizardReview = () => {
  const { toast } = useToast();
  const { permissions, hasPermission } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [editedWorker, setEditedWorker] = useState<Worker | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [maidCardOpen, setMaidCardOpen] = useState(false);
  const [maidCardWorker, setMaidCardWorker] = useState<Worker | null>(null);
  const [exporting, setExporting] = useState(false);
  const maidCardRef = useRef<HTMLDivElement>(null);
  const [pullWorkerOpen, setPullWorkerOpen] = useState(false);
  const [pullWorkerData, setPullWorkerData] = useState<{ id: string; name: string } | null>(null);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [newVideo, setNewVideo] = useState<File | null>(null);

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from("workers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setWorkers((data || []) as any);
    } catch (error: any) {
      console.error("Error loading workers:", error);
      toast({
        title: "Error",
        description: "Failed to load CVs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (worker: Worker) => {
    setSelectedWorker(worker);
    setEditedWorker({ ...worker });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleEdit = () => {
    if (!hasPermission('cv', 'edit')) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to edit CVs",
        variant: "destructive",
      });
      return;
    }
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editedWorker) return;

    try {
      const updateData: any = {
        name: editedWorker.name,
        age: editedWorker.age,
        nationality_code: editedWorker.nationality_code,
        job1: editedWorker.job1,
        job2: editedWorker.job2,
        salary: editedWorker.salary,
        status: editedWorker.status,
      };

      // Handle file uploads if new files were selected
      if (newPhoto || newVideo) {
        const files = editedWorker.files || {};
        
        if (newPhoto) {
          const reader = new FileReader();
          const photoBase64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(newPhoto);
          });
          files.photo = photoBase64;
        }
        
        if (newVideo) {
          const reader = new FileReader();
          const videoBase64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(newVideo);
          });
          files.video = videoBase64;
        }
        
        updateData.files = files;
      }

      const { error } = await supabase
        .from("workers")
        .update(updateData)
        .eq("id", editedWorker.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "CV updated successfully",
      });

      setIsEditing(false);
      setNewPhoto(null);
      setNewVideo(null);
      setSelectedWorker(editedWorker);
      loadWorkers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditedWorker(selectedWorker ? { ...selectedWorker } : null);
    setNewPhoto(null);
    setNewVideo(null);
    setIsEditing(false);
  };

  const handleShowMaidCard = (worker: Worker) => {
    setMaidCardWorker(worker);
    setMaidCardOpen(true);
  };

  const skillsList = (skills: any) => {
    if (!skills) return [];
    return Object.entries(skills)
      .filter(([_, value]) => value === true)
      .map(([key]) => key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()));
  };

  const handleExportMaidCard = async () => {
    if (!maidCardRef.current || !maidCardWorker) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(maidCardRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const fileName = maidCardWorker.center_ref 
          ? `${maidCardWorker.center_ref.replace(/\s+/g, " ")}.jpg`
          : `maid-card-${maidCardWorker.name.replace(/\s+/g, "-").toLowerCase()}.jpg`;
        link.download = fileName;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: `Maid card exported as ${fileName}`,
        });
      }, "image/jpeg", 0.95);
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: "Could not export the maid card. Please try using screenshot instead.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!hasPermission('cv', 'edit')) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to change CV status",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("workers")
        .update({ status: "Approved" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "CV approved",
      });

      loadWorkers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string) => {
    if (!hasPermission('cv', 'edit')) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to change CV status",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("workers")
        .update({ status: "Rejected" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "CV rejected",
      });

      loadWorkers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUnreject = async (id: string) => {
    if (!hasPermission('cv', 'edit')) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to change CV status",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("workers")
        .update({ status: "Available" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "CV unrejected and set back to Available",
      });

      loadWorkers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">CV Review</h1>
            <p className="text-muted-foreground">Review and approve worker CVs</p>
          </div>
          <Button onClick={() => window.location.href = '/cvwizard'}>
            Add CV
          </Button>
        </div>

        <div className="grid gap-4">
          {workers.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No CVs submitted yet
              </CardContent>
            </Card>
          )}

          {workers.map((worker) => (
            <Card key={worker.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{worker.name}</CardTitle>
                    <CardDescription>
                      {worker.center_ref} • {worker.passport_no}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      worker.status === "Approved"
                        ? "default"
                        : worker.status === "Rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {worker.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nationality</p>
                    <p className="font-medium">{worker.nationality_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Job</p>
                    <p className="font-medium">{worker.job1}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{worker.age}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium text-sm">{worker.maid_status}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleView(worker)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleShowMaidCard(worker)}
                    className="bg-primary/10"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Maid Card
                  </Button>

                  {worker.status === "Available" && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setPullWorkerData({ id: worker.id, name: worker.name });
                          setPullWorkerOpen(true);
                        }}
                      >
                        <Building2 className="mr-2 h-4 w-4" />
                        Pull from Supplier
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(worker.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(worker.id)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}

                  {worker.status === "Rejected" && hasPermission('cv', 'edit') && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleUnreject(worker.id)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Unreject
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedWorker && editedWorker && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>{selectedWorker.name}</DialogTitle>
                    <DialogDescription>{selectedWorker.center_ref}</DialogDescription>
                  </div>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Name</Label>
                    {isEditing ? (
                      <Input
                        value={editedWorker.name}
                        onChange={(e) => setEditedWorker({ ...editedWorker, name: e.target.value })}
                      />
                    ) : (
                      <p className="font-medium">{selectedWorker.name}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Passport No</Label>
                    <p className="font-medium">{selectedWorker.passport_no}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Age</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedWorker.age}
                        onChange={(e) => setEditedWorker({ ...editedWorker, age: parseInt(e.target.value) })}
                      />
                    ) : (
                      <p className="font-medium">{selectedWorker.age}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Nationality</Label>
                    {isEditing ? (
                      <Input
                        value={editedWorker.nationality_code}
                        onChange={(e) => setEditedWorker({ ...editedWorker, nationality_code: e.target.value })}
                      />
                    ) : (
                      <p className="font-medium">{selectedWorker.nationality_code}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Job 1</Label>
                    {isEditing ? (
                      <Input
                        value={editedWorker.job1}
                        onChange={(e) => setEditedWorker({ ...editedWorker, job1: e.target.value })}
                      />
                    ) : (
                      <p className="font-medium">{selectedWorker.job1}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Job 2</Label>
                    {isEditing ? (
                      <Input
                        value={editedWorker.job2 || ''}
                        onChange={(e) => setEditedWorker({ ...editedWorker, job2: e.target.value })}
                      />
                    ) : (
                      <p className="font-medium">{selectedWorker.job2 || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Salary (AED)</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedWorker.salary || ''}
                        onChange={(e) => setEditedWorker({ ...editedWorker, salary: e.target.value ? parseInt(e.target.value) : undefined })}
                      />
                    ) : (
                      <p className="font-medium">{selectedWorker.salary || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    {isEditing ? (
                      <Select
                        value={editedWorker.status}
                        onValueChange={(value) => setEditedWorker({ ...editedWorker, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Available">Available</SelectItem>
                          <SelectItem value="Ready for Market">Ready for Market</SelectItem>
                          <SelectItem value="Reserved">Reserved</SelectItem>
                          <SelectItem value="Sold">Sold</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{selectedWorker.status}</p>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-semibold text-sm">Update Files</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-photo">Photo</Label>
                      {selectedWorker.files?.photo && !newPhoto && (
                        <div className="mb-2">
                          <img 
                            src={selectedWorker.files.photo} 
                            alt="Current photo" 
                            className="h-20 w-20 object-cover rounded"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Current photo</p>
                        </div>
                      )}
                      <Input
                        id="edit-photo"
                        type="file"
                        accept="image/jpeg,image/png,image/*"
                        onChange={(e) => setNewPhoto(e.target.files?.[0] || null)}
                        className="text-sm"
                      />
                      {newPhoto && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-green-600">✓ New photo selected: {newPhoto.name}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setNewPhoto(null)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-video">Video</Label>
                      {selectedWorker.files?.video && !newVideo && (
                        <div className="mb-2">
                          <video 
                            src={selectedWorker.files.video} 
                            className="h-20 w-auto rounded"
                            controls
                          />
                          <p className="text-xs text-muted-foreground mt-1">Current video</p>
                        </div>
                      )}
                      <Input
                        id="edit-video"
                        type="file"
                        accept="video/mp4,video/quicktime,video/*"
                        onChange={(e) => setNewVideo(e.target.files?.[0] || null)}
                        className="text-sm"
                      />
                      {newVideo && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-green-600">✓ New video selected: {newVideo.name}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setNewVideo(null)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Languages</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorker.languages.map((lang, i) => (
                      <Badge key={i} variant="secondary">
                        {lang.name} - {lang.level}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Experience</p>
                  {selectedWorker.experience.length === 0 ? (
                    <p className="text-sm">No experience listed</p>
                  ) : (
                    <ul className="space-y-1">
                      {selectedWorker.experience.map((exp, i) => (
                        <li key={i} className="text-sm">
                          {exp.country}: {exp.years} years
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {selectedWorker.financials && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Financials</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Cost</p>
                        <p className="font-medium">
                          {selectedWorker.financials.total_cost || 0} AED
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Revenue</p>
                        <p className="font-medium">
                          {selectedWorker.financials.total_revenue || 0} AED
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">P&L</p>
                        <p
                          className={`font-medium ${
                            (selectedWorker.financials.pnl || 0) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {selectedWorker.financials.pnl || 0} AED
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {maidCardWorker && (
          <Dialog open={maidCardOpen} onOpenChange={setMaidCardOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>Maid Card - {maidCardWorker.name}</DialogTitle>
                  <Button 
                    onClick={handleExportMaidCard}
                    disabled={exporting}
                    size="sm"
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export JPG
                      </>
                    )}
                  </Button>
                </div>
              </DialogHeader>

              <div ref={maidCardRef} className="bg-white p-6 space-y-6">
                {/* Header */}
                <div className="text-center border-b-4 border-primary pb-4">
                  <h1 className="text-3xl font-bold text-primary">MAID CARD</h1>
                  {maidCardWorker.center_ref && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Ref: {maidCardWorker.center_ref}
                    </p>
                  )}
                </div>

                {/* Photo and Basic Info */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-1 space-y-4">
                    {maidCardWorker.files?.photo ? (
                      <img
                        src={maidCardWorker.files.photo}
                        alt={maidCardWorker.name}
                        className="w-full aspect-[3/4] object-cover rounded-lg border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No Photo</span>
                      </div>
                    )}
                    
                    {/* Video Section */}
                    {maidCardWorker.files?.video && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm">Video</h3>
                        <video 
                          controls 
                          className="w-full rounded-lg border-2 border-gray-200"
                          preload="metadata"
                        >
                          <source src={maidCardWorker.files.video} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 space-y-3">
                    <div>
                      <h2 className="text-2xl font-bold">{maidCardWorker.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {maidCardWorker.nationality_code} • {maidCardWorker.age} years old
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {maidCardWorker.religion && (
                        <div>
                          <span className="font-semibold">Religion:</span> {maidCardWorker.religion}
                        </div>
                      )}
                      {maidCardWorker.marital_status && (
                        <div>
                          <span className="font-semibold">Marital Status:</span> {maidCardWorker.marital_status}
                        </div>
                      )}
                      {maidCardWorker.children !== undefined && (
                        <div>
                          <span className="font-semibold">Children:</span> {maidCardWorker.children}
                        </div>
                      )}
                      {maidCardWorker.height_cm && (
                        <div>
                          <span className="font-semibold">Height:</span> {maidCardWorker.height_cm} cm
                        </div>
                      )}
                      {maidCardWorker.weight_kg && (
                        <div>
                          <span className="font-semibold">Weight:</span> {maidCardWorker.weight_kg} kg
                        </div>
                      )}
                      {maidCardWorker.salary && (
                        <div className="col-span-2">
                          <span className="font-semibold">Expected Salary:</span> {maidCardWorker.salary} AED/month
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t">
                      <h3 className="font-semibold text-primary mb-2">Job Roles</h3>
                      <div className="flex gap-2">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                          {maidCardWorker.job1}
                        </Badge>
                        {maidCardWorker.job2 && (
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                            {maidCardWorker.job2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <h3 className="font-semibold text-primary mb-3 text-lg border-b pb-2">
                    Languages
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {maidCardWorker.languages.map((lang, idx) => (
                      <Badge key={idx} variant="secondary">
                        {lang.name} <span className="text-xs ml-1">({lang.level})</span>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                {maidCardWorker.experience && maidCardWorker.experience.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-primary mb-3 text-lg border-b pb-2">
                      Work Experience
                    </h3>
                    <div className="space-y-2">
                      {maidCardWorker.experience.map((exp, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-muted p-2 rounded"
                        >
                          <span className="font-medium">{exp.country}</span>
                          <span className="text-sm text-muted-foreground">
                            {exp.years} {exp.years === 1 ? "year" : "years"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {maidCardWorker.skills && skillsList(maidCardWorker.skills).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-primary mb-3 text-lg border-b pb-2">
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {skillsList(maidCardWorker.skills).map((skill, idx) => (
                        <Badge
                          key={idx}
                          className="bg-green-50 text-green-700 hover:bg-green-100"
                        >
                          ✓ {skill}
                        </Badge>
                      ))}
                    </div>
                    {maidCardWorker.skills.cook_details && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          <span className="font-semibold">Cooking Details:</span>{" "}
                          {maidCardWorker.skills.cook_details}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="text-center text-xs text-muted-foreground pt-4 border-t">
                  <p>Generated on {new Date().toLocaleDateString()}</p>
                  <p className="mt-2 text-xs italic">
                    Tip: Use browser&apos;s Print function (Ctrl+P / Cmd+P) or screenshot tool to save as image
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {pullWorkerData && (
          <PullWorkerDialog
            open={pullWorkerOpen}
            onOpenChange={setPullWorkerOpen}
            workerId={pullWorkerData.id}
            workerName={pullWorkerData.name}
            onSuccess={() => {
              loadWorkers();
              setPullWorkerData(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default CVWizardReview;
