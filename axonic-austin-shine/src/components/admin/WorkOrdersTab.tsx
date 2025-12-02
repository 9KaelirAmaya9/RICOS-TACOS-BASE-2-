import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileDown, Trash2, Search, FileText, ExternalLink, RefreshCw, Link as LinkIcon, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { generateWorkOrderPDF } from "@/lib/generateWorkOrderPDF";
import { uploadPDFWithRetry } from "@/lib/pdfUploadHelpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SignatureModal } from "./SignatureModal";
import { DocumentGenerator } from "@/lib/documentGenerator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, FileSpreadsheet, FileCheck } from "lucide-react";

interface WorkOrder {
  id: string;
  invoice_number: string;
  client_id: string;
  service_type: string;
  description?: string;
  estimated_cost?: number;
  final_cost?: number;
  order_status: string;
  payment_status?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: string;
  vehicle_color?: string;
  vehicle_vin?: string;
  vehicle_license_plate?: string;
  vehicle_mileage?: number;
  labor_hours?: number;
  labor_rate?: number;
  parts_total?: number;
  notes?: string;
  pdf_url?: string;
  invoice_pdf_url?: string;
  agreement_pdf_url?: string;
  agreement_signed_pdf_url?: string;
  agreement_signed?: boolean;
  agreement_signed_date?: string;
  agreement_signed_by?: string;
  signature_data?: string;
  contractor_agreement_pdf_url?: string;
  client_services_agreement_pdf_url?: string;
  created_at: string;
  scheduled_date?: string;
  clients?: {
    contact_name: string;
    email: string;
    phone?: string;
    address?: string;
  };
}

export const WorkOrdersTab = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorkOrders(data || []);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to load work orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const handleGenerateDocument = async (order: WorkOrder, type: "invoice" | "vehicle-investment" | "client-services" | "contractor-agreement") => {
    try {
      toast({
        title: "Generating Document...",
        description: "Please wait while we create your PDF.",
      });

      // Map WorkOrder data to Template Data
      let docData: Record<string, unknown>;
      let storagePath = "";

      if (type === "invoice") {
        docData = {
          invoice_number: order.invoice_number,
          created_at: new Date().toISOString(),
          customer_name: order.customer_name || order.clients?.contact_name || "Valued Customer",
          customer_email: order.customer_email || order.clients?.email || "",
          customer_phone: order.customer_phone || order.clients?.phone || "",
          vehicle_info: (order.vehicle_year || order.vehicle_make) ? {
            year: order.vehicle_year,
            make: order.vehicle_make,
            model: order.vehicle_model,
            vin: order.vehicle_vin,
            mileage: order.vehicle_mileage?.toString()
          } : undefined,
          items: [
            {
              description: order.service_type,
              quantity: 1,
              rate: order.labor_rate || 0, // Simplified mapping
              amount: (order.labor_rate || 0) * (order.labor_hours || 0) + (order.parts_total || 0)
            }
          ],
          subtotal: (order.final_cost || order.estimated_cost || 0),
          tax: 0,
          total: (order.final_cost || order.estimated_cost || 0),
          balance_due: (order.final_cost || order.estimated_cost || 0),
          notes: order.notes
        };
        storagePath = `invoices/${order.id}/invoice.pdf`;
      } else if (type === "vehicle-investment") {
        docData = {
          agreement_number: `VIA-${order.invoice_number}`,
          created_at: new Date().toISOString(),
          client_name: order.customer_name || order.clients?.contact_name || "Investor",
          client_email: order.customer_email || order.clients?.email,
          vehicle_info: `${order.vehicle_year} ${order.vehicle_make} ${order.vehicle_model}`,
          investment_amount: order.estimated_cost || 0,
          projected_return: undefined // To be filled manually or calculated if data exists
        };
        storagePath = `agreements/${order.id}/vehicle-investment.pdf`;
      } else if (type === "client-services") {
        docData = {
          agreement_number: `CSA-${order.invoice_number}`,
          created_at: new Date().toISOString(),
          client_name: order.customer_name || order.clients?.contact_name || "Client",
          client_phone: order.customer_phone || order.clients?.phone,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          client_address: (order.clients as any)?.address, // Assuming address is on clients table
          client_email: order.customer_email || order.clients?.email,
          vehicle_info: `${order.vehicle_year} ${order.vehicle_make} ${order.vehicle_model}`,
          vin: order.vehicle_vin,
          services_description: order.description || order.service_type,
          total_estimated_cost: order.estimated_cost || 0
        };
        storagePath = `agreements/${order.id}/client-services.pdf`;
      } else if (type === "contractor-agreement") {
        docData = {
          agreement_number: `CA-${order.invoice_number}`,
          created_at: new Date().toISOString(),
          contractor_name: order.customer_name || order.clients?.contact_name || "Contractor",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          contractor_address: (order.clients as any)?.address,
          contractor_phone: order.customer_phone || order.clients?.phone,
          contractor_email: order.customer_email || order.clients?.email,
          role: order.service_type || "Technician",
          rate: order.labor_rate ? `$${order.labor_rate}/hr` : "$0.00",
          start_date: new Date().toLocaleDateString()
        };
        storagePath = `agreements/${order.id}/contractor-agreement.pdf`;
      }

      // Generate Blob
      const pdfBlob = await DocumentGenerator.generateDocument(type, docData);

      // Upload to Supabase
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('work-orders') // Using existing bucket for simplicity
        .upload(storagePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('work-orders')
        .getPublicUrl(storagePath);

      // Update Database
      const updatePayload: Record<string, string | null> = {};
      if (type === "invoice") updatePayload.invoice_pdf_url = publicUrl;
      else updatePayload.agreement_pdf_url = publicUrl;

      const { error: dbError } = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", order.id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document generated and saved.",
      });

      fetchWorkOrders(); // Refresh UI

    } catch (error: unknown) {
      console.error("Error generating document:", error);
      toast({
        title: "Error",
        description: "Failed to generate document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRegeneratePDF = async (workOrder: WorkOrder) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      console.log("[WorkOrdersTab] Regenerating PDF for order", {
        orderId: workOrder.id,
        invoiceNumber: workOrder.invoice_number,
      });

      // Build work order data for PDF generation
      const pdfData = {
        ...workOrder,
        work_order_number: workOrder.invoice_number,
        customer_name: workOrder.customer_name || workOrder.clients?.contact_name || "",
        customer_email: workOrder.customer_email || workOrder.clients?.email || "",
        customer_phone: workOrder.customer_phone || workOrder.clients?.phone || "",
        services_requested: workOrder.description ? [workOrder.description] : [workOrder.service_type],
        labor_cost: (workOrder.labor_hours || 0) * (workOrder.labor_rate || 0),
        parts_cost: workOrder.parts_total || 0,
        total_cost: workOrder.final_cost || workOrder.estimated_cost || 0,
        status: workOrder.order_status,
      };

      const pdfBlob: Blob = await generateWorkOrderPDF(pdfData);

      const pdfUrl = await uploadPDFWithRetry(
        pdfBlob,
        'work-orders',
        `${workOrder.id}/work-order.pdf`
      );

      const { error: updateError } = await supabase
        .from("orders")
        .update({ pdf_url: pdfUrl })
        .eq("id", workOrder.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "PDF regenerated and saved successfully",
      });

      fetchWorkOrders();
    } catch (error: unknown) {
      console.error("[WorkOrdersTab] Error regenerating PDF", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to regenerate PDF",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled") => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ order_status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated",
      });
      fetchWorkOrders();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWorkOrder = async (workOrder: WorkOrder) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
      // Note: PDFs are stored in Supabase Storage bucket 'work-orders'
      // and will be cleaned up by bucket policies

      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", workOrder.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order deleted",
      });
      fetchWorkOrders();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Invoice #",
      "Customer Name",
      "Email",
      "Phone",
      "Vehicle",
      "Service Type",
      "Total Cost",
      "Status",
      "Date",
    ];

    const rows = filteredOrders.map((order) => {
      const customerName = order.customer_name || order.clients?.contact_name || "N/A";
      const email = order.customer_email || order.clients?.email || "N/A";
      const phone = order.customer_phone || order.clients?.phone || "N/A";
      const vehicle = `${order.vehicle_year || ""} ${order.vehicle_make || ""} ${order.vehicle_model || ""}`.trim() || "N/A";
      const totalCost = order.final_cost || order.estimated_cost || 0;

      return [
        order.invoice_number,
        customerName,
        email,
        phone,
        vehicle,
        order.service_type,
        totalCost.toFixed(2),
        order.order_status,
        new Date(order.created_at).toLocaleDateString(),
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    toast({
      title: "Success",
      description: "CSV exported successfully",
    });
  };

  const filteredOrders = workOrders.filter((order) => {
    const customerName = (order.customer_name || order.clients?.contact_name || "").toLowerCase();
    const email = (order.customer_email || order.clients?.email || "").toLowerCase();
    const invoiceNumber = order.invoice_number?.toLowerCase() || "";
    const serviceType = order.service_type?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      customerName.includes(search) ||
      email.includes(search) ||
      invoiceNumber.includes(search) ||
      serviceType.includes(search);

    const matchesStatus = statusFilter === "all" || order.order_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCopySignatureLink = (orderId: string, invoiceNumber: string) => {
    const signatureUrl = `${window.location.origin}/sign-agreement/${orderId}`;
    navigator.clipboard.writeText(signatureUrl);
    toast({
      title: "Link Copied",
      description: `Signature link for ${invoiceNumber} copied to clipboard`,
    });
  };

  const handleOpenSignature = (order: WorkOrder) => {
    setSelectedOrder(order);
    setSignatureModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "confirmed":
        return "bg-blue-500";
      case "in_progress":
        return "bg-purple-500";
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Work Orders
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice #, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Work Order</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Agreement</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const totalCost = order.final_cost || order.estimated_cost || 0;
                  const vehicle = order.vehicle_year || order.vehicle_make || order.vehicle_model
                    ? `${order.vehicle_year || ""} ${order.vehicle_make || ""} ${order.vehicle_model || ""}`.trim()
                    : "N/A";

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.invoice_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {order.customer_name || order.clients?.contact_name || "N/A"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.customer_email || order.clients?.email || ""}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{vehicle}</TableCell>
                      <TableCell>
                        <div className="text-sm">{order.service_type}</div>
                      </TableCell>
                      <TableCell className="font-semibold">${totalCost.toFixed(2)}</TableCell>
                      <TableCell>
                        <Select
                          value={order.order_status}
                          onValueChange={(value: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled") => handleUpdateStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue>
                              <Badge className={getStatusColor(order.order_status)}>
                                {order.order_status.replace("_", " ")}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 text-blue-600">
                              <FileText className="h-4 w-4" />
                              Documents
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {order.invoice_pdf_url && (
                              <DropdownMenuItem onClick={() => window.open(order.invoice_pdf_url, "_blank")}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Invoice
                              </DropdownMenuItem>
                            )}
                            {order.agreement_pdf_url && (
                              <DropdownMenuItem onClick={() => window.open(order.agreement_pdf_url, "_blank")}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Agreement
                              </DropdownMenuItem>
                            )}
                            {(order.invoice_pdf_url || order.agreement_pdf_url) && <DropdownMenuSeparator />}
                            <DropdownMenuLabel>Generate Document</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleGenerateDocument(order, "invoice")}>
                              <FileSpreadsheet className="mr-2 h-4 w-4" />
                              Invoice (Zoho Style)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGenerateDocument(order, "client-services")}>
                              <FileCheck className="mr-2 h-4 w-4" />
                              Service Agreement
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGenerateDocument(order, "vehicle-investment")}>
                              <FileCheck className="mr-2 h-4 w-4" />
                              Investment Agreement
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGenerateDocument(order, "contractor-agreement")}>
                              <FileCheck className="mr-2 h-4 w-4" />
                              Contractor Agreement
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>
                        {order.pdf_url ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(order.pdf_url, "_blank")}
                            className="gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRegeneratePDF(order)}
                            className="gap-2 text-amber-600"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Generate
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.invoice_pdf_url ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(order.invoice_pdf_url, "_blank")}
                            className="gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {order.agreement_signed ? (
                            <>
                              <Badge className="bg-green-500 gap-1 text-xs">
                                <CheckCircle2 className="h-3 w-3" />
                                Signed
                              </Badge>
                              {order.agreement_signed_pdf_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(order.agreement_signed_pdf_url, "_blank")}
                                  className="gap-1 h-7 text-xs"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View Signed
                                </Button>
                              )}
                            </>
                          ) : order.agreement_pdf_url ? (
                            <>
                              <Badge variant="outline" className="gap-1 text-xs border-amber-500 text-amber-600">
                                <AlertCircle className="h-3 w-3" />
                                Awaiting
                              </Badge>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopySignatureLink(order.id, order.invoice_number)}
                                  className="gap-1 h-7 text-xs"
                                >
                                  <LinkIcon className="h-3 w-3" />
                                  Copy Link
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenSignature(order)}
                                  className="gap-1 h-7 text-xs"
                                >
                                  <Send className="h-3 w-3" />
                                  Sign
                                </Button>
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Order Details</DialogTitle>
                              </DialogHeader>
                              {selectedOrder && (
                                <div className="space-y-4">
                                  <div>
                                    <Label className="font-semibold">Invoice #</Label>
                                    <p>{selectedOrder.invoice_number}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Customer</Label>
                                    <p>{selectedOrder.customer_name || selectedOrder.clients?.contact_name || "N/A"}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedOrder.customer_email || selectedOrder.clients?.email || ""}
                                    </p>
                                    {(selectedOrder.customer_phone || selectedOrder.clients?.phone) && (
                                      <p className="text-sm text-muted-foreground">
                                        {selectedOrder.customer_phone || selectedOrder.clients?.phone}
                                      </p>
                                    )}
                                  </div>
                                  {(selectedOrder.vehicle_make || selectedOrder.vehicle_model) && (
                                    <div>
                                      <Label className="font-semibold">Vehicle</Label>
                                      <p>
                                        {selectedOrder.vehicle_year} {selectedOrder.vehicle_make} {selectedOrder.vehicle_model}
                                      </p>
                                      {selectedOrder.vehicle_color && <p className="text-sm">Color: {selectedOrder.vehicle_color}</p>}
                                      {selectedOrder.vehicle_vin && <p className="text-sm">VIN: {selectedOrder.vehicle_vin}</p>}
                                      {selectedOrder.vehicle_license_plate && (
                                        <p className="text-sm">License: {selectedOrder.vehicle_license_plate}</p>
                                      )}
                                      {selectedOrder.vehicle_mileage && (
                                        <p className="text-sm">Mileage: {selectedOrder.vehicle_mileage.toLocaleString()}</p>
                                      )}
                                    </div>
                                  )}
                                  <div>
                                    <Label className="font-semibold">Service</Label>
                                    <p>{selectedOrder.service_type}</p>
                                    {selectedOrder.description && (
                                      <p className="text-sm text-muted-foreground mt-1">{selectedOrder.description}</p>
                                    )}
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Costs</Label>
                                    {selectedOrder.labor_hours && selectedOrder.labor_rate && (
                                      <p>Labor: {selectedOrder.labor_hours}hrs × ${selectedOrder.labor_rate}/hr = ${(selectedOrder.labor_hours * selectedOrder.labor_rate).toFixed(2)}</p>
                                    )}
                                    {selectedOrder.parts_total && (
                                      <p>Parts: ${selectedOrder.parts_total.toFixed(2)}</p>
                                    )}
                                    <p className="font-semibold mt-2">
                                      {selectedOrder.final_cost ? "Final" : "Estimated"} Total: ${(selectedOrder.final_cost || selectedOrder.estimated_cost || 0).toFixed(2)}
                                    </p>
                                  </div>
                                  {selectedOrder.notes && (
                                    <div>
                                      <Label className="font-semibold">Notes</Label>
                                      <p className="text-sm">{selectedOrder.notes}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteWorkOrder(order)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {selectedOrder && (
        <SignatureModal
          open={signatureModalOpen}
          onOpenChange={setSignatureModalOpen}
          order={selectedOrder}
          onSuccess={fetchWorkOrders}
        />
      )}
    </Card>
  );
};
