import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { SignatureModal } from "@/components/admin/SignatureModal";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const SignAgreement = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("orders")
        .select(`
          *,
          clients:client_id (
            contact_name,
            email,
            phone
          )
        `)
        .eq("id", orderId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError("Agreement not found");
        return;
      }

      setOrder(data);

      // Auto-open signature modal if not signed
      if (!data.agreement_signed) {
        setSignatureModalOpen(true);
      }
    } catch (err: any) {
      console.error("Error fetching order:", err);
      setError(err.message || "Failed to load agreement");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{error || "Agreement not found"}</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (order.agreement_signed) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                Agreement Already Signed
              </CardTitle>
              <CardDescription>
                This agreement has been signed and is now complete.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Signed by {order.agreement_signed_by} on{" "}
                  {new Date(order.agreement_signed_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h3 className="font-semibold">Agreement Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Agreement #:</div>
                  <div className="font-medium">{order.invoice_number}</div>
                  
                  <div className="text-muted-foreground">Client:</div>
                  <div className="font-medium">
                    {order.customer_name || order.clients?.contact_name || "N/A"}
                  </div>
                  
                  {order.vehicle_make && (
                    <>
                      <div className="text-muted-foreground">Vehicle:</div>
                      <div className="font-medium">
                        {order.vehicle_year} {order.vehicle_make} {order.vehicle_model}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {order.agreement_signed_pdf_url && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted p-3 font-semibold text-sm">
                    Signed Agreement
                  </div>
                  <iframe
                    src={order.agreement_signed_pdf_url}
                    className="w-full h-96"
                    title="Signed Agreement"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle>Sign Your Service Agreement</CardTitle>
            <CardDescription>
              Agreement #{order.invoice_number}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Client Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Name:</div>
                <div className="font-medium">
                  {order.customer_name || order.clients?.contact_name || "N/A"}
                </div>
                
                <div className="text-muted-foreground">Email:</div>
                <div className="font-medium">
                  {order.customer_email || order.clients?.email || "N/A"}
                </div>
                
                {(order.customer_phone || order.clients?.phone) && (
                  <>
                    <div className="text-muted-foreground">Phone:</div>
                    <div className="font-medium">
                      {order.customer_phone || order.clients?.phone}
                    </div>
                  </>
                )}
              </div>
            </div>

            {(order.vehicle_make || order.vehicle_model) && (
              <div className="space-y-2">
                <h3 className="font-semibold">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Vehicle:</div>
                  <div className="font-medium">
                    {order.vehicle_year} {order.vehicle_make} {order.vehicle_model}
                  </div>
                  
                  {order.vehicle_vin && (
                    <>
                      <div className="text-muted-foreground">VIN:</div>
                      <div className="font-medium">{order.vehicle_vin}</div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-semibold">Service Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Service:</div>
                <div className="font-medium">{order.service_type}</div>
                
                {order.description && (
                  <>
                    <div className="text-muted-foreground">Description:</div>
                    <div className="font-medium">{order.description}</div>
                  </>
                )}
                
                <div className="text-muted-foreground">Estimated Cost:</div>
                <div className="font-medium">
                  ${(order.final_cost || order.estimated_cost || 0).toFixed(2)}
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please review the complete agreement and provide your digital signature to proceed.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
      <Footer />

      <SignatureModal
        open={signatureModalOpen}
        onOpenChange={setSignatureModalOpen}
        order={order}
        onSuccess={fetchOrder}
      />
    </div>
  );
};

export default SignAgreement;
