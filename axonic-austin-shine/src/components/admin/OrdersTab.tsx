import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, FileText, FileDown, FileSignature } from "lucide-react";
import { WorkOrderDialog } from "./WorkOrderDialog";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import { ServiceAgreementDialog } from "./ServiceAgreementDialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Order {
  id: string;
  invoice_number: string;
  service_type: string;
  estimated_cost: number;
  final_cost: number;
  order_status: string;
  payment_status: string;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: string;
  vehicle_vin?: string;
  description?: string;
  pdf_url?: string; // Work order PDF URL stored in orders table
  clients?: {
    contact_name: string;
    company_name: string;
    email: string;
    phone?: string;
    address?: string;
  };
}

export const OrdersTab = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [agreementDialogOpen, setAgreementDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const { toast } = useToast();

  const handleViewWorkOrder = (order: Order) => {
    console.log('handleViewWorkOrder called for order:', order.id);
    console.log('PDF URL from order:', order.pdf_url);
    
    if (!order.pdf_url) {
      toast({
        title: 'PDF Not Available',
        description: 'Work order PDF has not been generated yet.',
        variant: 'destructive',
      });
      return;
    }

    if (!order.pdf_url.startsWith('http')) {
      console.error('Invalid PDF URL format:', order.pdf_url);
      toast({
        title: 'Invalid PDF URL',
        description: 'The PDF URL format is invalid. Please regenerate the work order.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Opening PDF URL:', order.pdf_url);
    window.open(order.pdf_url, '_blank');
  };

  const handleGenerateAgreement = async (order: Order) => {
    setGeneratingPdf(order.id);
    try {
      console.log('Generating service agreement for order:', order.id);
      
      const { data, error } = await supabase.functions.invoke('generate-service-agreement', {
        body: { orderId: order.id }
      });

      if (error) {
        console.error('Service agreement generation error:', error);
        throw error;
      }

      console.log('Service agreement generation response:', data);

      toast({
        title: "Success",
        description: "Service agreement generated successfully",
      });

      // Fetch the agreement record to get the PDF URL
      setTimeout(async () => {
        try {
          const { data: agreement, error: agreementError } = await supabase
            .from('service_agreements')
            .select('pdf_url')
            .eq('order_id', order.id)
            .single();

          if (agreementError) {
            console.error('Error fetching agreement PDF URL:', agreementError);
            throw agreementError;
          }

          if (agreement?.pdf_url) {
            console.log('Opening service agreement PDF from database URL:', agreement.pdf_url);
            window.open(agreement.pdf_url, '_blank');
          } else {
            toast({
              title: 'PDF Not Available',
              description: 'Agreement created but PDF URL not found. Try opening from Sign Agreement.',
              variant: 'destructive',
            });
          }
        } catch (storageError) {
          console.error('Failed to open service agreement PDF:', storageError);
          toast({
            title: 'Error',
            description: 'Agreement created, but PDF could not be opened. Try again from Sign Agreement button.',
            variant: 'destructive',
          });
        }
      }, 1500);

    } catch (error: any) {
      console.error('Failed to generate service agreement:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate service agreement",
        variant: "destructive",
      });
    } finally {
      setGeneratingPdf(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      in_progress: "bg-purple-500",
      completed: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      unpaid: "bg-red-500",
      partial: "bg-yellow-500",
      paid: "bg-green-500",
      refunded: "bg-blue-500",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Order Management</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Order
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.invoice_number}</TableCell>
                  <TableCell>
                    {order.customer_name || order.clients?.company_name || order.clients?.contact_name || "N/A"}
                  </TableCell>
                  <TableCell>{order.service_type}</TableCell>
                  <TableCell>
                    ${order.final_cost || order.estimated_cost}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.order_status)}>
                      {order.order_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPaymentStatusColor(order.payment_status)}>
                      {order.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setDetailsDialogOpen(true);
                        }}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewWorkOrder(order)}
                        title="View Work Order PDF"
                        disabled={!order.pdf_url}
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateAgreement(order)}
                        disabled={generatingPdf === order.id}
                        title="Generate Service Agreement"
                      >
                        {generatingPdf === order.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                          <FileSignature className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setAgreementDialogOpen(true);
                        }}
                        title="Sign Agreement"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <WorkOrderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchOrders}
      />

      {selectedOrder && (
        <>
          <OrderDetailsDialog
            order={selectedOrder}
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
            onUpdate={fetchOrders}
          />
          <ServiceAgreementDialog
            order={selectedOrder}
            open={agreementDialogOpen}
            onOpenChange={setAgreementDialogOpen}
          />
        </>
      )}
    </div>
  );
};
