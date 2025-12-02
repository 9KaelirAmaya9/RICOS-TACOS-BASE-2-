import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Trash2 } from "lucide-react";
import { generateWorkOrderPDF } from "@/lib/generateWorkOrderPDF";
import { uploadPDFWithRetry, logPDFSizes } from "@/lib/pdfUploadHelpers";
import logoFull from "@/assets/logo-full.png";

interface CreateWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateWorkOrderDialog = ({ open, onOpenChange, onSuccess }: CreateWorkOrderDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    vehicle_year: "",
    vehicle_make: "",
    vehicle_model: "",
    vehicle_color: "",
    vehicle_vin: "",
    vehicle_license_plate: "",
    labor_cost: "",
    parts_cost: "",
    notes: "",
  });

  const [services, setServices] = useState<string[]>([""]);

  const addService = () => {
    setServices([...services, ""]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, value: string) => {
    const updated = [...services];
    updated[index] = value;
    setServices(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const laborCost = parseFloat(formData.labor_cost) || 0;
      const partsCost = parseFloat(formData.parts_cost) || 0;
      const totalCost = laborCost + partsCost;

      const filteredServices = services.filter((s) => s.trim() !== "");

      if (filteredServices.length === 0) {
        throw new Error("Please add at least one service");
      }

      // First insert work order to get the invoice_number
      const { data: newWorkOrder, error } = await supabase
        .from("orders")
        .insert({
          service_type: "Work Order",
          description: filteredServices.join(", "),
          estimated_cost: totalCost,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone || null,
          vehicle_year: formData.vehicle_year || null,
          vehicle_make: formData.vehicle_make || null,
          vehicle_model: formData.vehicle_model || null,
          vehicle_color: formData.vehicle_color || null,
          vehicle_vin: formData.vehicle_vin || null,
          vehicle_license_plate: formData.vehicle_license_plate || null,
          labor_rate: laborCost,
          parts_total: partsCost,
          notes: formData.notes || null,
          order_status: "pending",
          client_id: null, // Optional - can be linked to client later
          invoice_number: "",
        } as any)
        .select()
        .single();

      if (error) throw error;

      let pdfUrl: string | null = null;

      // Generate Work Order PDF and upload to storage
      try {
        console.log("[CreateWorkOrder] Generating Work Order PDF", {
          orderId: newWorkOrder.id,
          invoiceNumber: newWorkOrder.invoice_number,
        });

        const pdfData = {
          ...newWorkOrder,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          services_requested: filteredServices,
          labor_cost: laborCost,
          parts_cost: partsCost,
          total_cost: totalCost,
          work_order_number: newWorkOrder.invoice_number,
          created_at: newWorkOrder.created_at || new Date().toISOString(),
        };

        // Generate Work Order PDF
        const workOrderPDFBlob: Blob = await generateWorkOrderPDF(pdfData);

        // Log file size for debugging
        logPDFSizes([
          { name: 'Work Order', blob: workOrderPDFBlob },
        ]);

        console.log("[CreateWorkOrder] Work Order PDF generated, uploading to storage");

        // Upload PDF with retry logic
        pdfUrl = await uploadPDFWithRetry(
          workOrderPDFBlob,
          'work-orders',
          `${newWorkOrder.id}/work-order.pdf`
        );

        // Log upload result
        console.log("[CreateWorkOrder] Upload result:", {
          workOrderId: newWorkOrder.id,
          pdfUrl: pdfUrl || 'FAILED',
        });

        // Update order with PDF URL
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            pdf_url: pdfUrl,
          })
          .eq("id", newWorkOrder.id);

        if (updateError) {
          console.error("[CreateWorkOrder] Failed to update PDF URL", updateError);
        }

        // Download PDF automatically
        const downloadPDF = (blob: Blob, filename: string) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();

          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 100);
        };

        downloadPDF(workOrderPDFBlob, `WorkOrder-${newWorkOrder.invoice_number}.pdf`);

        // Load branding for email
        const { data: brandingData } = await supabase
          .from("branding_settings")
          .select("*")
          .single();

        // Send confirmation email
        try {
          const vehicleInfo = [
            newWorkOrder.vehicle_year,
            newWorkOrder.vehicle_make,
            newWorkOrder.vehicle_model,
          ]
            .filter(Boolean)
            .join(" ");

          await supabase.functions.invoke("send-work-order-email", {
            body: {
              recipientEmail: formData.customer_email,
              recipientName: formData.customer_name,
              workOrderNumber: newWorkOrder.invoice_number,
              workOrderUrl: pdfUrl,
              vehicleInfo: vehicleInfo || undefined,
              services: filteredServices,
              totalCost: totalCost,
              companyInfo: {
                name: brandingData?.company_name || "Axonic Motorworks",
                tagline:
                  brandingData?.tagline ||
                  "Veteran-Owned Auto Body & Paint Excellence",
                phone: brandingData?.phone || "210-823-1595",
                email: brandingData?.email || "sales@axonicmoto.com",
                address:
                  brandingData?.address ||
                  "15600 Marsha Street, Building 1 Unit 1A, Austin, TX",
                primaryColor: brandingData?.primary_color || "#1a365d",
              },
            },
          });
        } catch (emailError) {
          console.error("[CreateWorkOrder] Failed to send email", emailError);
          // Don't fail the whole operation if email fails
        }

        // Check if PDF failed to upload and warn user
        if (!pdfUrl) {
          toast({
            title: "Partial Upload Failure",
            description: "Order created successfully, but Work Order PDF failed to upload. Use 'Regenerate PDF' button in order details.",
            variant: "destructive",
          });
        }
      } catch (pdfError: any) {
        console.error("[CreateWorkOrder] PDF generation/upload error", pdfError);

        // Order is already created, so this is just a warning about PDF
        toast({
          title: "Warning",
          description: "Work order created but PDF failed to generate. You can regenerate it from order details.",
          variant: "destructive",
        });
      }

      // Show success message (order was created even if PDF failed)
      if (pdfUrl) {
        toast({
          title: "Success",
          description: "Work order created successfully!",
        });
      } else {
        toast({
          title: "Order Created",
          description: "Work order created. Use 'Regenerate' button for PDF.",
        });
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
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

  const resetForm = () => {
    setFormData({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      vehicle_year: "",
      vehicle_make: "",
      vehicle_model: "",
      vehicle_color: "",
      vehicle_vin: "",
      vehicle_license_plate: "",
      labor_cost: "",
      parts_cost: "",
      notes: "",
    });
    setServices([""]);
  };

  const totalCost = (parseFloat(formData.labor_cost) || 0) + (parseFloat(formData.parts_cost) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <img src={logoFull} alt="Axonic Motorworks" className="h-20 w-auto" />
          </div>
          <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
            <FileText className="h-6 w-6" />
            Create Work Order
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customer_email">Email *</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customer_phone">Phone</Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="vehicle_year">Year</Label>
                <Input
                  id="vehicle_year"
                  placeholder="2024"
                  value={formData.vehicle_year}
                  onChange={(e) => setFormData({ ...formData, vehicle_year: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="vehicle_make">Make</Label>
                <Input
                  id="vehicle_make"
                  placeholder="Toyota"
                  value={formData.vehicle_make}
                  onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="vehicle_model">Model</Label>
                <Input
                  id="vehicle_model"
                  placeholder="Camry"
                  value={formData.vehicle_model}
                  onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="vehicle_color">Color</Label>
                <Input
                  id="vehicle_color"
                  placeholder="Silver"
                  value={formData.vehicle_color}
                  onChange={(e) => setFormData({ ...formData, vehicle_color: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="vehicle_license_plate">License Plate</Label>
                <Input
                  id="vehicle_license_plate"
                  placeholder="ABC-1234"
                  value={formData.vehicle_license_plate}
                  onChange={(e) => setFormData({ ...formData, vehicle_license_plate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="vehicle_vin">VIN</Label>
                <Input
                  id="vehicle_vin"
                  placeholder="1HGBH41JXMN109186"
                  value={formData.vehicle_vin}
                  onChange={(e) => setFormData({ ...formData, vehicle_vin: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Services Requested</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addService}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {services.map((service, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Service ${index + 1}`}
                    value={service}
                    onChange={(e) => updateService(index, e.target.value)}
                  />
                  {services.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeService(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="labor_cost">Labor Cost ($)</Label>
                <Input
                  id="labor_cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.labor_cost}
                  onChange={(e) => setFormData({ ...formData, labor_cost: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="parts_cost">Parts Cost ($)</Label>
                <Input
                  id="parts_cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.parts_cost}
                  onChange={(e) => setFormData({ ...formData, parts_cost: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="total_cost">Total Cost</Label>
                <Input
                  id="total_cost"
                  value={`$${totalCost.toFixed(2)}`}
                  disabled
                  className="font-semibold"
                />
              </div>
              <div className="md:col-span-3">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this work order..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create & Save PDF"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
