import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, ExternalLink, Download, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import JSZip from "jszip";
import { generateWorkOrderPDF } from "@/lib/generateWorkOrderPDF";
import { uploadPDFWithRetry } from "@/lib/pdfUploadHelpers";

interface OrderDetailsDialogProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const OrderDetailsDialog = ({ order, open, onOpenChange, onUpdate }: OrderDetailsDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [regeneratingPDF, setRegeneratingPDF] = useState<string | null>(null);
  const [agreementData, setAgreementData] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    order_status: order.order_status,
    payment_status: order.payment_status,
    final_cost: order.final_cost || order.estimated_cost,
    amount_paid: order.amount_paid || 0,
    notes: order.notes || "",
  });

  useEffect(() => {
    if (open) {
      fetchAgreementData();
    }
  }, [open, order.id]);

  const fetchAgreementData = async () => {
    try {
      const { data, error } = await supabase
        .from('service_agreements')
        .select('pdf_url, signature_url, signed_at')
        .eq('order_id', order.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching agreement data:', error);
      } else {
        setAgreementData(data);
      }
    } catch (error) {
      console.error('Failed to fetch agreement data:', error);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          order_status: formData.order_status,
          payment_status: formData.payment_status,
          final_cost: parseFloat(formData.final_cost.toString()),
          amount_paid: parseFloat(formData.amount_paid.toString()),
          notes: formData.notes,
          completion_date: formData.order_status === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", order.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order updated successfully",
      });

      onUpdate();
      onOpenChange(false);
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

  const handleDownloadAll = async () => {
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      let fileCount = 0;

      // Helper function to fetch and add file to zip
      const addFileToZip = async (url: string, filename: string) => {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Failed to fetch ${filename}`);
          const blob = await response.blob();
          zip.file(filename, blob);
          fileCount++;
        } catch (error) {
          console.error(`Error fetching ${filename}:`, error);
          toast({
            title: "Warning",
            description: `Could not include ${filename} in ZIP`,
            variant: "destructive",
          });
        }
      };

      // Add work order PDF
      if (order.pdf_url) {
        await addFileToZip(order.pdf_url, `work-order-${order.invoice_number}.pdf`);
      }

      // Add invoice PDF
      if (order.invoice_pdf_url) {
        await addFileToZip(order.invoice_pdf_url, `invoice-${order.invoice_number}.pdf`);
      }

      // Add service agreement PDF
      if (agreementData?.pdf_url) {
        await addFileToZip(agreementData.pdf_url, `service-agreement-${order.invoice_number}.pdf`);
      }

      // Add signature image if available
      if (agreementData?.signature_url) {
        await addFileToZip(agreementData.signature_url, `signature-${order.invoice_number}.png`);
      }

      if (fileCount === 0) {
        toast({
          title: "No Documents",
          description: "No documents available to download",
          variant: "destructive",
        });
        return;
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `order-${order.invoice_number}-documents.zip`;
      link.target = "_blank"; // Fallback
      document.body.appendChild(link);

      console.log(`[Download Debug] Clicking zip link`);
      link.click();

      // Small delay before cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log(`[Download Debug] Cleaned up zip link`);
      }, 100);

      toast({
        title: "Success",
        description: `Downloaded ${fileCount} document${fileCount > 1 ? 's' : ''} as ZIP`,
      });
    } catch (error: any) {
      console.error("Error creating ZIP:", error);
      toast({
        title: "Error",
        description: "Failed to create ZIP file",
        variant: "destructive",
      });
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleRegeneratePDF = async () => {
    setRegeneratingPDF('work-order');
    try {
      const pdfData = {
        ...order,
        services_requested: order.description?.split(', ') || [],
        labor_cost: order.labor_rate || 0,
        parts_cost: order.parts_total || 0,
        total_cost: order.estimated_cost || 0,
        work_order_number: order.invoice_number,
        created_at: order.created_at || new Date().toISOString(),
      };

      const blob = await generateWorkOrderPDF(pdfData);
      const path = `${order.id}/work-order.pdf`;
      const filename = `WorkOrder-${order.invoice_number}.pdf`;

      console.log(`[Regenerate] Uploading Work Order PDF, size: ${(blob.size / 1024).toFixed(2)} KB`);

      // Upload with retry
      const url = await uploadPDFWithRetry(blob, 'work-orders', path);

      // Update database
      const { error } = await supabase
        .from('orders')
        .update({ pdf_url: url })
        .eq('id', order.id);

      if (error) throw error;

      // Download PDF
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.target = "_blank"; // Fallback
      document.body.appendChild(link);

      console.log(`[Download Debug] Clicking link for ${filename}`);
      link.click();

      // Small delay before cleanup to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        console.log(`[Download Debug] Cleaned up ${filename}`);
      }, 100);

      toast({
        title: "Success",
        description: "Work Order PDF regenerated and downloaded!",
      });

      // Refresh order data
      onUpdate();
      fetchAgreementData();
    } catch (error: any) {
      console.error("[Regenerate] Failed to regenerate Work Order PDF:", error);
      toast({
        title: "Error",
        description: `Failed to regenerate PDF: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setRegeneratingPDF(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details - {order.invoice_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* PDF Documents Section */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Documents</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAll}
                disabled={downloadingZip || (!order.pdf_url && !agreementData?.pdf_url)}
                className="gap-2"
              >
                {downloadingZip ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Creating ZIP...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download All
                  </>
                )}
              </Button>
            </div>
            <div className="space-y-2">
              {/* Work Order PDF */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">Work Order PDF</span>
                <div className="flex items-center gap-2">
                  {order.pdf_url ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(order.pdf_url, '_blank')}
                        className="gap-2"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegeneratePDF}
                        disabled={regeneratingPDF === 'work-order'}
                        className="gap-2"
                      >
                        {regeneratingPDF === 'work-order' ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        Regenerate
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-yellow-600">⚠ Not uploaded</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegeneratePDF}
                        disabled={regeneratingPDF === 'work-order'}
                        className="gap-2"
                      >
                        {regeneratingPDF === 'work-order' ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        Generate
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Client</Label>
              <p className="text-sm">
                {order.customer_name || order.clients?.company_name || order.clients?.contact_name || "N/A"}
              </p>
            </div>
            <div>
              <Label>Service Type</Label>
              <p className="text-sm">{order.service_type}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="order_status">Order Status</Label>
            <Select
              value={formData.order_status}
              onValueChange={(value) => setFormData({ ...formData, order_status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="payment_status">Payment Status</Label>
            <Select
              value={formData.payment_status}
              onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="final_cost">Final Cost</Label>
              <Input
                id="final_cost"
                type="number"
                step="0.01"
                value={formData.final_cost}
                onChange={(e) => setFormData({ ...formData, final_cost: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="amount_paid">Amount Paid</Label>
              <Input
                id="amount_paid"
                type="number"
                step="0.01"
                value={formData.amount_paid}
                onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? "Updating..." : "Update Order"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
