import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import jsPDF from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceAgreementRequest {
  orderId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { orderId }: ServiceAgreementRequest = await req.json();

    console.log('Generating service agreement for order:', orderId);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Check if agreement already exists
    const { data: existingAgreement } = await supabase
      .from('service_agreements')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (existingAgreement) {
      return new Response(
        JSON.stringify({ 
          success: true,
          agreementId: existingAgreement.id,
          message: 'Agreement already exists'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Generate service agreement text with populated data
    const agreementText = generateAgreementText(order);

    // Generate PDF
    const pdfBlob = await generateAgreementPDF(order, agreementText);
    const pdfPath = `service-agreements/${orderId}/service-agreement.pdf`;

    console.log('Uploading service agreement PDF to bucket:', 'work-orders');
    console.log('Agreement PDF file path:', pdfPath);
    
    const { error: pdfUploadError } = await supabase.storage
      .from('work-orders')
      .upload(pdfPath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (pdfUploadError) {
      console.error('Agreement PDF upload storage error:', pdfUploadError);
      throw new Error(`PDF upload failed: ${pdfUploadError.message}`);
    }

    const { data: { publicUrl: pdfUrl } } = supabase.storage
      .from('work-orders')
      .getPublicUrl(pdfPath);

    console.log('Generated public agreement PDF URL:', pdfUrl);
    // Create service agreement record
    const { data: agreement, error: agreementError } = await supabase
      .from('service_agreements')
      .insert({
        order_id: orderId,
        agreement_text: agreementText,
        pdf_url: pdfUrl
      })
      .select()
      .single();

    if (agreementError) {
      throw new Error(`Failed to create agreement record: ${agreementError.message}`);
    }

    // Send email notification if Resend is configured
    if (resendKey && order.customer_email) {
      const resend = new Resend(resendKey);
      const recipients = [
        order.customer_email,
        'j.alberti@axonicmoto.com'
      ];
      
      try {
        await resend.emails.send({
          from: 'Axonic Motorworks <sales@axonicmoto.com>',
          to: recipients,
          subject: `Service Agreement Ready - ${order.invoice_number}`,
          html: generateEmailContent(order, pdfUrl)
        });
        console.log('Email sent successfully to:', recipients.join(', '));
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        agreementId: agreement.id,
        pdfUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in generate-service-agreement:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function generateAgreementText(order: any): string {
  const vehicleInfo = `${order.vehicle_year || ''} ${order.vehicle_make || ''} ${order.vehicle_model || ''}`.trim() || 'N/A';
  
  return `AXONIC MOTORWORKS SERVICE AGREEMENT

Customer Information:
Name: ${order.customer_name || 'N/A'}
Phone: ${order.customer_phone || 'N/A'}
Address: ${order.customer_address || 'N/A'}
Email: ${order.customer_email || 'N/A'}
Vehicle Year/Make/Model: ${vehicleInfo}
VIN: ${order.vehicle_vin || 'N/A'}

1. PARTIES
This Service Agreement ("Agreement") is made between Axonic Motorworks LLC ("Company") and the customer identified above ("Customer").

2. SCOPE OF SERVICES
The company agrees to perform repair, paint, body, mechanical, and/or restoration work ("Services") as described in the approved Estimate or Work Order.

3. ESTIMATES & AUTHORIZATION
Customer acknowledges receipt of an estimate and authorizes all required repairs, use of OEM/used/aftermarket parts, and operation of the vehicle for testing.

4. PAYMENT TERMS
A 50% deposit is required before work begins. Deposits are non-refundable. Balance is due before release. Storage fees apply after 3 business days. Late fees apply after 5 days.

5. WARRANTY
A 2-year workmanship warranty applies to body and paint repairs. Warranty excludes rust, prior repairs, corrosion, or environmental damage.

6. DISCLAIMER OF WARRANTIES
Except for the stated warranty, all other warranties are disclaimed. The company is not liable for loss of use, rental fees, diminished value, or consequential damages.

7. PROPERTY & RISK OF LOSS
Customers must remove valuables. The company is not responsible for personal items. Unclaimed vehicles after 30 days may be subject to lien and sale.

8. AUTHORIZATION TO OPERATE VEHICLE
The customer authorizes the Company to operate the vehicle for testing or transport. The company maintains garage liability insurance.

9. INSURANCE CLAIMS
Customers are responsible for deductibles and uncovered items. Insurance payments must be endorsed to Company.

10. PARTS & STORAGE POLICY
Replaced parts become Company property unless requested beforehand. Paint match cannot be guaranteed due to fade or material variations.

11. INDEMNIFICATION
Customer indemnifies Company against losses from misrepresentation, unpaid invoices, or customer-supplied parts.

12. TERMINATION
The company may terminate due to non-payment or safety concerns. Work completed will be billed accordingly.

13. DISPUTE RESOLUTION
Agreement governed by Texas law. Disputes resolved via binding arbitration in Travis County, Texas.

14. PRIVACY AGREEMENT
Axonic Motorworks may temporarily collect and securely store personal identification documents for verification and legal compliance, and will delete all scanned personal identification numbers and related digital copies within seven (7) business days after full payment, unless legally required to retain them.

15. ENTIRE AGREEMENT
This Agreement supersedes prior communications. Changes must be in writing and signed by both parties.`;
}

async function generateAgreementPDF(order: any, agreementText: string): Promise<Uint8Array> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;
  const maxWidth = pageWidth - (margin * 2);
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('AXONIC MOTORWORKS', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(16);
  doc.text('SERVICE AGREEMENT', pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;

  // Split text into lines and sections
  const lines = agreementText.split('\n');
  doc.setFontSize(10);
  
  for (const line of lines) {
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    if (line.trim() === '') {
      yPos += 3;
      continue;
    }

    // Check if it's a section header (numbered)
    if (/^\d+\./.test(line.trim())) {
      doc.setFont('helvetica', 'bold');
      yPos += 3;
    } else if (line.includes(':') && !line.startsWith(' ') && !line.startsWith('•')) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }

    const wrappedLines = doc.splitTextToSize(line, maxWidth);
    for (const wrappedLine of wrappedLines) {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(wrappedLine, margin, yPos);
      yPos += 5;
    }
  }

  // Signature section
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = 20;
  }

  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER ACCEPTANCE', margin, yPos);
  yPos += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Customer Signature: _________________________________', margin, yPos);
  yPos += 10;
  doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPos);

  return doc.output('arraybuffer');
}

function generateEmailContent(order: any, pdfUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a1a2e; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AXONIC MOTORWORKS</h1>
      <p>Service Agreement Ready for Review</p>
    </div>
    
    <div class="content">
      <h2>Hello ${order.customer_name || 'Customer'},</h2>
      <p>Your service agreement is ready for review and signature.</p>
      
      <h3>Order Details:</h3>
      <ul>
        <li><strong>Invoice Number:</strong> ${order.invoice_number}</li>
        <li><strong>Service Type:</strong> ${order.service_type}</li>
        <li><strong>Vehicle:</strong> ${order.vehicle_year} ${order.vehicle_make} ${order.vehicle_model}</li>
        <li><strong>Estimated Cost:</strong> $${(order.estimated_cost || 0).toFixed(2)}</li>
      </ul>
      
      <a href="${pdfUrl}" class="button">View Service Agreement</a>
      
      <p style="margin-top: 20px;">Please review the agreement carefully. If you have any questions, contact us at <a href="mailto:sales@axonicmoto.com">sales@axonicmoto.com</a>.</p>
    </div>
    
    <div class="footer">
      <p>Axonic Motorworks - Building 1 Unit 1A</p>
      <p>Veteran Owned - Precision Restored</p>
    </div>
  </div>
</body>
</html>
  `;
}
