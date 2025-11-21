import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Upload, FileSpreadsheet } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ImportContracts() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-contracts-excel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      const data = await response.json();
      setResult(data);

      if (data.errors.length === 0) {
        toast.success(`Successfully imported ${data.workersCreated} workers, ${data.contractsCreated} contracts, and ${data.employeesCreated} employees`);
      } else {
        toast.warning(`Import completed with ${data.errors.length} errors`);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || "Failed to import contracts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/admin")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
        <h1 className="text-3xl font-bold">Import Contracts from Excel</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload Contract Data
          </CardTitle>
          <CardDescription>
            Import workers, employees, and contracts from an Excel/CSV file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              <strong>Required columns:</strong> name, nationality, employer_name, date_of_join_or_contract, amount, employer_email, employer_phone_number
              <br />
              <br />
              • Staff with employer_name "tadmaids" or amount = 0 will be created as employees
              <br />
              • Others will be created as workers with contracts
              <br />
              • Contracts will be 2-year monthly contracts with 5% VAT
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleImport}
              disabled={!file || loading}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {loading ? "Importing..." : "Import Contracts"}
            </Button>
          </div>

          {result && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Workers Created:</strong> {result.workersCreated}</p>
                    <p><strong>Contracts Created:</strong> {result.contractsCreated}</p>
                    <p><strong>Employees Created:</strong> {result.employeesCreated}</p>
                    {result.errors.length > 0 && (
                      <p className="text-destructive"><strong>Errors:</strong> {result.errors.length}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {result.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-destructive">Import Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {result.errors.map((error: string, index: number) => (
                        <p key={index} className="text-sm text-muted-foreground">
                          {error}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
