import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Shield } from "lucide-react";
import { format } from "date-fns";
import { Navigate } from "react-router-dom";

interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_data: any;
  new_data: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const AuditLogs = () => {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [tableFilter, setTableFilter] = useState<string>("all");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs", searchTerm, actionFilter, tableFilter],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (searchTerm) {
        query = query.or(`user_email.ilike.%${searchTerm}%,action.ilike.%${searchTerm}%`);
      }

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      if (tableFilter !== "all") {
        query = query.eq("table_name", tableFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as AuditLog[];
    },
    enabled: isAdmin,
  });

  const { data: uniqueActions } = useQuery({
    queryKey: ["audit-actions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs" as any)
        .select("action")
        .not("action", "is", null);
      
      if (error) throw error;
      const actions = [...new Set((data as any[]).map((log) => log.action))];
      return actions.sort();
    },
    enabled: isAdmin,
  });

  const { data: uniqueTables } = useQuery({
    queryKey: ["audit-tables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs" as any)
        .select("table_name")
        .not("table_name", "is", null);
      
      if (error) throw error;
      const tables = [...new Set((data as any[]).map((log) => log.table_name))];
      return tables.sort();
    },
    enabled: isAdmin,
  });

  if (adminLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const getActionColor = (action: string) => {
    if (action.toLowerCase().includes("create") || action.toLowerCase().includes("insert")) return "default";
    if (action.toLowerCase().includes("update") || action.toLowerCase().includes("edit")) return "secondary";
    if (action.toLowerCase().includes("delete") || action.toLowerCase().includes("remove")) return "destructive";
    return "outline";
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Audit Log Tracking</h1>
            <p className="text-muted-foreground">Monitor all user activities across the system</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter & Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user email or action..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions?.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by table" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  {uniqueTables?.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Record ID</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), "MMM dd, yyyy HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.user_email || "Unknown"}</div>
                            {log.user_id && (
                              <div className="text-xs text-muted-foreground font-mono">
                                {log.user_id.substring(0, 8)}...
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionColor(log.action) as any}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.table_name ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded">{log.table_name}</code>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.record_id ? log.record_id.substring(0, 8) + "..." : "-"}
                        </TableCell>
                        <TableCell>
                          {(log.old_data || log.new_data) && (
                            <details className="cursor-pointer">
                              <summary className="text-sm text-primary hover:underline">
                                View changes
                              </summary>
                              <div className="mt-2 p-2 bg-muted rounded text-xs space-y-2 max-w-md">
                                {log.old_data && (
                                  <div>
                                    <div className="font-semibold mb-1">Before:</div>
                                    <pre className="overflow-auto">
                                      {JSON.stringify(log.old_data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.new_data && (
                                  <div>
                                    <div className="font-semibold mb-1">After:</div>
                                    <pre className="overflow-auto">
                                      {JSON.stringify(log.new_data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </details>
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

        {logs && logs.length > 0 && (
          <div className="text-sm text-muted-foreground text-center">
            Showing {logs.length} most recent logs (max 500)
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AuditLogs;
