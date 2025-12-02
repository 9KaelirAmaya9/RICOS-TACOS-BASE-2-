import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoFull from "@/assets/logo-full.png";

interface ServiceAgreementDialogProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ServiceAgreementDialog = ({ order, open, onOpenChange }: ServiceAgreementDialogProps) => {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingAgreement, setExistingAgreement] = useState<any>(null);
  const [loadingAgreement, setLoadingAgreement] = useState(true);

  useEffect(() => {
    if (open) {
      fetchExistingAgreement();
    }
  }, [open, order.id]);

  const fetchExistingAgreement = async () => {
    try {
      const { data } = await supabase
        .from('service_agreements')
        .select('*')
        .eq('order_id', order.id)
        .single();
      
      setExistingAgreement(data);
    } catch (error) {
      console.error('Error fetching agreement:', error);
    } finally {
      setLoadingAgreement(false);
    }
  };

  const handleClearSignature = () => {
    signatureRef.current?.clear();
  };

  const handleSubmit = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error("Please provide a signature");
      return;
    }

    setIsSubmitting(true);
    try {
      const signatureDataUrl = signatureRef.current.toDataURL();

      // Call edge function to sign service agreement
      const { data, error } = await supabase.functions.invoke('sign-service-agreement', {
        body: {
          orderId: order.id,
          signatureDataUrl,
          agreementText: agreementTemplate
        }
      });

      if (error) throw error;

      toast.success("Service agreement signed successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error('Error signing agreement:', error);
      toast.error("Failed to sign agreement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const agreementTemplate = existingAgreement?.agreement_text || `
AXONIC MOTORWORKS SERVICE AGREEMENT

Customer Information:
Name: ${order.clients?.contact_name || 'N/A'}
Phone: ${order.clients?.phone || 'N/A'}
Address: ${order.clients?.address || 'N/A'}
Email: ${order.clients?.email || 'N/A'}
Vehicle: ${order.vehicle_year || ''} ${order.vehicle_make || ''} ${order.vehicle_model || ''}
VIN: ${order.vehicle_vin || 'N/A'}

1. PARTIES
This Service Agreement ("Agreement") is made between Axonic Motorworks LLC ("Company") and the customer identified above ("Customer").

2. SCOPE OF SERVICES
Service Type: ${order.service_type}
Description: ${order.description || 'N/A'}

3. PAYMENT TERMS
Estimated Cost: $${order.estimated_cost || 0}
A 50% deposit is required before work begins. Balance is due before release.

4. WARRANTY
A 2-year workmanship warranty applies to body and paint repairs.
Warranty excludes rust, prior repairs, corrosion, or environmental damage.

By signing below, the customer accepts these terms and authorizes the work.
  `.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <img src={logoFull} alt="Axonic Motorworks" className="h-20 w-auto" />
          </div>
          <DialogTitle>Service Agreement - {order.invoice_number}</DialogTitle>
        </DialogHeader>
        
        <Card>
          <CardContent className="pt-6 space-y-6">
            {loadingAgreement ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {existingAgreement?.signed_at && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-800 font-semibold">
                      ✓ Agreement signed on {new Date(existingAgreement.signed_at).toLocaleDateString()}
                    </p>
                    {existingAgreement.pdf_url && (
                      <Button
                        variant="link"
                        onClick={() => window.open(existingAgreement.pdf_url, '_blank')}
                        className="mt-2 p-0 h-auto text-green-700"
                      >
                        View Signed Agreement PDF
                      </Button>
                    )}
                  </div>
                )}

                <pre className="whitespace-pre-wrap font-sans text-sm bg-muted p-4 rounded-lg">{agreementTemplate}</pre>
                
                {existingAgreement?.pdf_url && !existingAgreement?.signed_at && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(existingAgreement.pdf_url, '_blank')}
                    className="w-full"
                  >
                    View Generated Agreement PDF
                  </Button>
                )}

                {!existingAgreement?.signed_at && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Customer Signature</h3>
                    <div className="border rounded-lg p-4 bg-white">
                      <SignatureCanvas
                        ref={signatureRef}
                        canvasProps={{
                          className: "w-full h-40 border rounded",
                        }}
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={handleClearSignature}
                        disabled={isSubmitting}
                      >
                        Clear Signature
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="ml-auto"
                      >
                        {isSubmitting ? "Processing..." : "Sign Service Agreement"}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
