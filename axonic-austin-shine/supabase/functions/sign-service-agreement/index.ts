import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignAgreementRequest {
  orderId: string;
  signatureDataUrl: string;
  agreementText: string;
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
    const { orderId, signatureDataUrl, agreementText }: SignAgreementRequest = await req.json();

    console.log('Processing service agreement signature for order:', orderId);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Upload signature
    const signatureBuffer = Uint8Array.from(
      atob(signatureDataUrl.split(',')[1]),
      c => c.charCodeAt(0)
    );
    
    const signaturePath = `service-agreements/${orderId}/signature.png`;
    console.log('Uploading signature to bucket:', 'work-orders');
    console.log('Signature file path:', signaturePath);

    const { error: uploadError } = await supabase.storage
      .from('work-orders')
      .upload(signaturePath, signatureBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Signature upload storage error:', uploadError);
      throw new Error(`Signature upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl: signatureUrl } } = supabase.storage
      .from('work-orders')
      .getPublicUrl(signaturePath);

    console.log('Generated public signature URL:', signatureUrl);
    // Generate signed agreement PDF
    const agreementPdfContent = generateSignedAgreementContent(order, agreementText, signatureUrl);
    const agreementPdfBuffer = new TextEncoder().encode(agreementPdfContent);
    const agreementPdfPath = `service-agreements/${orderId}/service-agreement.html`;

    console.log('Uploading signed agreement HTML to bucket:', 'work-orders');
    console.log('Agreement HTML file path:', agreementPdfPath);
    
    const { error: agreementUploadError } = await supabase.storage
      .from('work-orders')
      .upload(agreementPdfPath, agreementPdfBuffer, {
        contentType: 'text/html',
        upsert: true
      });

    if (agreementUploadError) {
      console.error('Agreement HTML upload storage error:', agreementUploadError);
      throw new Error(`Agreement PDF upload failed: ${agreementUploadError.message}`);
    }

    const { data: { publicUrl: agreementPdfUrl } } = supabase.storage
      .from('work-orders')
      .getPublicUrl(agreementPdfPath);

    console.log('Generated public signed agreement URL:', agreementPdfUrl);
    // Update or create service agreement record
    const { error: upsertError } = await supabase
      .from('service_agreements')
      .upsert({
        order_id: orderId,
        agreement_text: agreementText,
        signature_url: signatureUrl,
        pdf_url: agreementPdfUrl,
        signed_at: new Date().toISOString()
      }, {
        onConflict: 'order_id'
      });

    if (upsertError) {
      console.error('Failed to save service agreement:', upsertError);
    }

    // Send email notification with both work order and signed agreement
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
          subject: `Service Agreement Signed - ${order.invoice_number}`,
          html: generateAgreementEmailContent(order, agreementPdfUrl)
        });
        console.log('Agreement email sent successfully to:', recipients.join(', '));
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        signatureUrl,
        agreementPdfUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in sign-service-agreement:', error);
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

function generateSignedAgreementContent(order: any, agreementText: string, signatureUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Service Agreement - ${order.invoice_number}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .content { margin-bottom: 30px; white-space: pre-wrap; }
    .signature-section { margin-top: 50px; border-top: 2px solid #ddd; padding-top: 30px; }
    .signature-box { border: 2px solid #333; padding: 20px; background-color: #f9f9f9; }
  </style>
</head>
<body>
  <div class="header">
    <h1>AXONIC MOTORWORKS</h1>
    <h2>Service Agreement</h2>
    <p><strong>Agreement Number:</strong> ${order.invoice_number}</p>
    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="content">
    ${agreementText}
  </div>

  <div class="signature-section">
    <h3>Customer Signature</h3>
    <div class="signature-box">
      <img src="${signatureUrl}" alt="Customer Signature" style="max-width: 400px; display: block;">
      <p style="margin-top: 20px;">
        <strong>Signed by:</strong> ${order.customer_name || 'N/A'}<br>
        <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
        <strong>Time:</strong> ${new Date().toLocaleTimeString()}
      </p>
    </div>
  </div>

  <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
    <p><strong>Axonic Motorworks</strong><br>
    Building 1 Unit 1A<br>
    Austin, TX<br>
    Phone: 210-823-1595<br>
    Email: sales@axonicmoto.com</p>
  </div>
</body>
</html>
  `;
}

function generateAgreementEmailContent(order: any, agreementPdfUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a1a2e; color: white; padding: 30px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 30px; margin-top: 20px; }
    .button { display: inline-block; padding: 15px 30px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; font-weight: bold; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
    .success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AXONIC MOTORWORKS</h1>
      <p style="margin: 0; font-size: 18px;">Service Agreement Confirmation</p>
    </div>
    
    <div class="content">
      <div class="success">
        <strong>✓ Service Agreement Signed Successfully</strong>
      </div>
      
      <h2>Hello ${order.customer_name || 'Customer'},</h2>
      <p>Thank you for signing the service agreement! We have received your signature and are ready to begin work.</p>
      
      <h3>Agreement Details:</h3>
      <ul>
        <li><strong>Invoice Number:</strong> ${order.invoice_number}</li>
        <li><strong>Service Type:</strong> ${order.service_type}</li>
        <li><strong>Vehicle:</strong> ${order.vehicle_year} ${order.vehicle_make} ${order.vehicle_model}</li>
        <li><strong>Estimated Cost:</strong> $${(order.estimated_cost || 0).toFixed(2)}</li>
        <li><strong>Signed:</strong> ${new Date().toLocaleDateString()}</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${agreementPdfUrl}" class="button">Download Signed Agreement</a>
      </div>
      
      <h3>What's Next?</h3>
      <p>Your vehicle is now scheduled for service. We'll keep you updated on the progress and notify you when the work is complete.</p>
      
      <p style="margin-top: 30px;">If you have any questions, please don't hesitate to contact us:</p>
      <ul>
        <li>Email: <a href="mailto:sales@axonicmoto.com">sales@axonicmoto.com</a></li>
        <li>Phone: 210-823-1595</li>
      </ul>
    </div>
    
    <div class="footer">
      <p><strong>Axonic Motorworks</strong><br>
      Building 1 Unit 1A, Austin, TX<br>
      Proudly Veteran Owned & Operated 🇺🇸</p>
      <p style="margin-top: 15px;">This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
}
