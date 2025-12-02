import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateAgreementPDF } from "@/lib/generateAgreementPDF";
import { uploadPDFWithRetry } from "@/lib/pdfUploadHelpers";
import { Loader2 } from "lucide-react";

interface SignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  onSuccess: () => void;
}

export const SignatureModal = ({ open, onOpenChange, order, onSuccess }: SignatureModalProps) => {
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [clientName, setClientName] = useState(
    order?.customer_name || order?.clients?.contact_name || ""
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signing, setSigning] = useState(false);
  const { toast } = useToast();

  const handleClear = () => {
    sigPadRef.current?.clear();
  };

  const handleSign = async () => {
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
      toast({
        title: "Signature Required",
        description: "Please provide a signature before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!clientName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full legal name.",
        variant: "destructive",
      });
      return;
    }

    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions.",
        variant: "destructive",
      });
      return;
    }

    setSigning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get signature as base64
      const signatureImage = sigPadRef.current.toDataURL();
      const signedDate = new Date().toISOString();

      // Generate signed PDF (signature will be embedded via storage later)
      const signedPDFBlob = await generateAgreementPDF({
        ...order,
        customer_name: order.customer_name || order.clients?.contact_name || "",
        customer_email: order.customer_email || order.clients?.email || "",
        customer_phone: order.customer_phone || order.clients?.phone || "",
        services_requested: order.description?.split(', ') || [],
        total_cost: order.estimated_cost || 0,
        created_at: order.created_at || new Date().toISOString(),
      });

      // Upload signed PDF
      const signedPDFUrl = await uploadPDFWithRetry(
        signedPDFBlob,
        'work-orders',
        `${order.id}/agreement-signed.pdf`
      );

      // Update database
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          agreement_signed_pdf_url: signedPDFUrl,
          agreement_signed: true,
          agreement_signed_by: clientName,
          agreement_signed_date: signedDate,
          signature_data: signatureImage,
        })
        .eq("id", order.id);

      if (updateError) throw updateError;

      // Download signed PDF
      const url = URL.createObjectURL(signedPDFBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Agreement-${order.invoice_number}-SIGNED.pdf`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      toast({
        title: "Agreement Signed",
        description: "The agreement has been signed successfully and saved.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error signing agreement:", error);
      toast({
        title: "Signing Failed",
        description: error.message || "Failed to sign agreement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sign Client Services Agreement</DialogTitle>
          <DialogDescription>
            Agreement #{order?.invoice_number || ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Agreement Preview */}
          {order?.agreement_pdf_url && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-3 font-semibold text-sm">
                Agreement Preview
              </div>
              <iframe
                src={order.agreement_pdf_url}
                className="w-full h-64"
                title="Agreement Preview"
              />
              <div className="p-3 bg-muted/50 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(order.agreement_pdf_url, "_blank")}
                >
                  Open Full Agreement
                </Button>
              </div>
            </div>
          )}

          {/* Terms Acceptance */}
          <div className="flex items-start space-x-3 border rounded-lg p-4 bg-muted/30">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I have read and agree to all terms and conditions
              </label>
              <p className="text-xs text-muted-foreground">
                By checking this box, you acknowledge that you have read and understood the complete agreement.
              </p>
            </div>
          </div>

          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="clientName">Full Legal Name *</Label>
            <Input
              id="clientName"
              placeholder="Enter your full legal name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>

          {/* Date (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              value={new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              disabled
            />
          </div>

          {/* Signature Pad */}
          <div className="space-y-2">
            <Label>Signature *</Label>
            <div className="border-2 border-dashed rounded-lg p-2 bg-white">
              <SignatureCanvas
                ref={sigPadRef}
                canvasProps={{
                  width: 500,
                  height: 150,
                  className: "signature-canvas w-full",
                }}
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Sign above using your mouse or touchscreen
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
              >
                Clear Signature
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={signing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSign}
              disabled={
                !termsAccepted ||
                !clientName.trim() ||
                signing ||
                sigPadRef.current?.isEmpty()
              }
            >
              {signing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Agreement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
