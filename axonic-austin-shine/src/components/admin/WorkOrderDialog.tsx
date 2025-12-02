import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Printer } from "lucide-react";
import logoFull from "@/assets/logo-full.png";

interface WorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const WorkOrderDialog = ({ open, onOpenChange, onSuccess }: WorkOrderDialogProps) => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    client_id: "",
    service_type: "",
    description: "",
    estimated_cost: "",
    scheduled_date: "",
    vehicle_year: "",
    vehicle_make: "",
    vehicle_model: "",
    vehicle_color: "",
    vehicle_license_plate: "",
    vehicle_mileage: "",
    vehicle_vin: "",
    technician_name: "",
    reference_number: "",
    parts_needed: "",
    customer_deposit: "",
    labor_hours: "",
    labor_rate: "85",
    parts_total: "",
    payment_method: "",
  });

  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  useEffect(() => {
    calculateEstimatedCost();
  }, [formData.labor_hours, formData.labor_rate, formData.parts_total, formData.customer_deposit]);

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("*");
    setClients(data || []);
  };

  const calculateEstimatedCost = () => {
    const laborCost = (parseFloat(formData.labor_hours) || 0) * (parseFloat(formData.labor_rate) || 0);
    const parts = parseFloat(formData.parts_total) || 0;
    const total = laborCost + parts;
    
    setFormData(prev => ({ ...prev, estimated_cost: total > 0 ? total.toFixed(2) : "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: newOrder, error } = await supabase.from("orders").insert({
        client_id: formData.client_id,
        service_type: formData.service_type,
        description: formData.description,
        estimated_cost: parseFloat(formData.estimated_cost) || null,
        scheduled_date: formData.scheduled_date || null,
        vehicle_year: formData.vehicle_year || null,
        vehicle_make: formData.vehicle_make || null,
        vehicle_model: formData.vehicle_model || null,
        vehicle_color: formData.vehicle_color || null,
        vehicle_license_plate: formData.vehicle_license_plate || null,
        vehicle_mileage: formData.vehicle_mileage ? parseInt(formData.vehicle_mileage) : null,
        vehicle_vin: formData.vehicle_vin || null,
        technician_name: formData.technician_name || null,
        reference_number: formData.reference_number || null,
        parts_needed: formData.parts_needed || null,
        customer_deposit: parseFloat(formData.customer_deposit) || 0,
        labor_hours: parseFloat(formData.labor_hours) || null,
        labor_rate: parseFloat(formData.labor_rate) || null,
        parts_total: parseFloat(formData.parts_total) || null,
        payment_method: formData.payment_method || null,
        invoice_number: "",
      }).select().single();

      if (error) throw error;

      // Generate work order PDF
      try {
        const { error: pdfError } = await supabase.functions.invoke('generate-work-order-pdf', {
          body: { orderId: newOrder.id }
        });

        if (pdfError) {
          console.error('Failed to generate work order PDF:', pdfError);
          toast({
            title: "Warning",
            description: "Order created but PDF generation failed",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Work order created and PDF generated",
          });
        }
      } catch (pdfError) {
        console.error('Error generating work order PDF:', pdfError);
        toast({
          title: "Warning",
          description: "Order created but PDF generation failed",
          variant: "destructive",
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
      client_id: "",
      service_type: "",
      description: "",
      estimated_cost: "",
      scheduled_date: "",
      vehicle_year: "",
      vehicle_make: "",
      vehicle_model: "",
      vehicle_color: "",
      vehicle_license_plate: "",
      vehicle_mileage: "",
      vehicle_vin: "",
      technician_name: "",
      reference_number: "",
      parts_needed: "",
      customer_deposit: "",
      labor_hours: "",
      labor_rate: "85",
      parts_total: "",
      payment_method: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <img src={logoFull} alt="Axonic Motorworks" className="h-24 w-auto" />
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
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name || client.contact_name} - {client.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label htmlFor="vehicle_mileage">Mileage</Label>
                <Input
                  id="vehicle_mileage"
                  type="number"
                  placeholder="50000"
                  value={formData.vehicle_mileage}
                  onChange={(e) => setFormData({ ...formData, vehicle_mileage: e.target.value })}
                />
              </div>
              <div className="md:col-span-3">
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
              <CardTitle className="text-lg">Service Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service_type">Service Type *</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Auto Painting">Auto Painting</SelectItem>
                    <SelectItem value="Automotive Repair">Automotive Repair</SelectItem>
                    <SelectItem value="Bodywork Services">Bodywork Services</SelectItem>
                    <SelectItem value="Boat Repair">Boat Repair</SelectItem>
                    <SelectItem value="Custom Paint">Custom Paint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="scheduled_date">Scheduled Date</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="technician_name">Technician</Label>
                <Input
                  id="technician_name"
                  placeholder="Technician name"
                  value={formData.technician_name}
                  onChange={(e) => setFormData({ ...formData, technician_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reference_number">Reference #</Label>
                <Input
                  id="reference_number"
                  placeholder="REF-001"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Work Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the work to be performed..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="parts_needed">Parts Needed</Label>
                <Textarea
                  id="parts_needed"
                  placeholder="List required parts..."
                  value={formData.parts_needed}
                  onChange={(e) => setFormData({ ...formData, parts_needed: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="labor_hours">Labor Hours</Label>
                <Input
                  id="labor_hours"
                  type="number"
                  step="0.5"
                  placeholder="8.0"
                  value={formData.labor_hours}
                  onChange={(e) => setFormData({ ...formData, labor_hours: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="labor_rate">Labor Rate ($/hr)</Label>
                <Input
                  id="labor_rate"
                  type="number"
                  step="0.01"
                  placeholder="85.00"
                  value={formData.labor_rate}
                  onChange={(e) => setFormData({ ...formData, labor_rate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="parts_total">Parts Total</Label>
                <Input
                  id="parts_total"
                  type="number"
                  step="0.01"
                  placeholder="250.00"
                  value={formData.parts_total}
                  onChange={(e) => setFormData({ ...formData, parts_total: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="estimated_cost">Estimated Total *</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  step="0.01"
                  value={formData.estimated_cost}
                  onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                  required
                  className="font-semibold"
                />
              </div>
              <div>
                <Label htmlFor="customer_deposit">Customer Deposit</Label>
                <Input
                  id="customer_deposit"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.customer_deposit}
                  onChange={(e) => setFormData({ ...formData, customer_deposit: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Debit Card">Debit Card</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                    <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Work Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};