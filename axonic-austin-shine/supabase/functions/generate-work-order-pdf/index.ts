import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import jsPDF from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkOrderRequest {
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
    const { orderId }: WorkOrderRequest = await req.json();

    console.log('Generating work order PDF for order:', orderId);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        clients (
          contact_name,
          company_name,
          email,
          phone,
          address
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Generate work order PDF
    const pdfBlob = await generateWorkOrderPDF(order);
    const bucketName = 'work-orders';
    const pdfPath = `${orderId}/work-order.pdf`;

    console.log('Uploading work order PDF to storage', {
      bucket: bucketName,
      pdfPath,
      orderId,
    });
    
    const { error: pdfUploadError } = await supabase.storage
      .from(bucketName)
      .upload(pdfPath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (pdfUploadError) {
      console.error('Storage upload error', {
        bucket: bucketName,
        pdfPath,
        orderId,
        error: pdfUploadError,
      });

      const message = pdfUploadError.message?.toLowerCase().includes('bucket')
        ? 'Storage configuration error. Please contact administrator.'
        : `PDF upload failed: ${pdfUploadError.message}`;

      throw new Error(message);
    }

    const { data: { publicUrl: pdfUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(pdfPath);

    console.log('Generated public URL for work order PDF', {
      bucket: bucketName,
      pdfPath,
      pdfUrl,
    });
    // Store PDF URL in orders table
    await supabase
      .from('orders')
      .update({ notes: `Work Order PDF: ${pdfUrl}` })
      .eq('id', orderId);

    // Send email notification if Resend is configured
    if (resendKey && order.clients.email) {
      const resend = new Resend(resendKey);
      const recipients = [
        order.clients.email,
        'j.alberti@axonicmoto.com'
      ];
      
      try {
        await resend.emails.send({
          from: 'Axonic Motorworks <sales@axonicmoto.com>',
          to: recipients,
          subject: `Work Order Confirmation - ${order.invoice_number}`,
          html: generateEmailContent(order, pdfUrl)
        });
        console.log('Email sent successfully to:', recipients.join(', '));
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the whole request if email fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in generate-work-order-pdf:', error);
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

async function generateWorkOrderPDF(order: any): Promise<Uint8Array> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 20;

  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('AXONIC MOTORWORKS', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(18);
  doc.text('WORK ORDER', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${order.invoice_number}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;

  // Customer Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Information', 14, yPos);
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${order.clients.contact_name}`, 14, yPos);
  yPos += 5;
  
  if (order.clients.company_name) {
    doc.text(`Company: ${order.clients.company_name}`, 14, yPos);
    yPos += 5;
  }
  
  doc.text(`Email: ${order.clients.email}`, 14, yPos);
  yPos += 5;
  doc.text(`Phone: ${order.clients.phone || 'N/A'}`, 14, yPos);
  yPos += 5;
  doc.text(`Address: ${order.clients.address || 'N/A'}`, 14, yPos);
  yPos += 10;

  // Vehicle Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Vehicle Information', 14, yPos);
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Year: ${order.vehicle_year || 'N/A'}`, 14, yPos);
  yPos += 5;
  doc.text(`Make: ${order.vehicle_make || 'N/A'}`, 14, yPos);
  yPos += 5;
  doc.text(`Model: ${order.vehicle_model || 'N/A'}`, 14, yPos);
  yPos += 5;
  doc.text(`Color: ${order.vehicle_color || 'N/A'}`, 14, yPos);
  yPos += 5;
  doc.text(`VIN: ${order.vehicle_vin || 'N/A'}`, 14, yPos);
  yPos += 5;
  doc.text(`License Plate: ${order.vehicle_license_plate || 'N/A'}`, 14, yPos);
  yPos += 5;
  doc.text(`Mileage: ${order.vehicle_mileage || 'N/A'}`, 14, yPos);
  yPos += 10;

  // Service Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Service Details', 14, yPos);
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Service Type: ${order.service_type}`, 14, yPos);
  yPos += 5;
  doc.text(`Description: ${order.description || 'N/A'}`, 14, yPos);
  yPos += 5;
  doc.text(`Parts Needed: ${order.parts_needed || 'N/A'}`, 14, yPos);
  yPos += 10;

  // Financial Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Details', 14, yPos);
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const laborCost = ((order.labor_hours || 0) * (order.labor_rate || 0)).toFixed(2);
  doc.text(`Labor: ${order.labor_hours || 0} hrs @ $${order.labor_rate || 0}/hr = $${laborCost}`, 14, yPos);
  yPos += 5;
  doc.text(`Parts Total: $${(order.parts_total || 0).toFixed(2)}`, 14, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`Estimated Total: $${(order.estimated_cost || 0).toFixed(2)}`, 14, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Customer Deposit: $${(order.customer_deposit || 0).toFixed(2)}`, 14, yPos);
  yPos += 5;
  doc.text(`Payment Method: ${order.payment_method || 'N/A'}`, 14, yPos);
  yPos += 10;

  // Warranty Information
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Warranty Information', 14, yPos);
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('• Paint work includes a 2-year warranty', 14, yPos);
  yPos += 5;
  doc.text('• Warranties on other services are subject to evaluation', 14, yPos);
  yPos += 5;
  doc.text('• Warranty covers defects in workmanship only', 14, yPos);

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
    .button { display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AXONIC MOTORWORKS</h1>
      <p>Work Order Confirmation</p>
    </div>
    
    <div class="content">
      <h2>Hello ${order.clients.contact_name},</h2>
      <p>Thank you for choosing Axonic Motorworks! Your work order has been created and confirmed.</p>
      
      <h3>Order Details:</h3>
      <ul>
        <li><strong>Invoice Number:</strong> ${order.invoice_number}</li>
        <li><strong>Service Type:</strong> ${order.service_type}</li>
        <li><strong>Vehicle:</strong> ${order.vehicle_year} ${order.vehicle_make} ${order.vehicle_model}</li>
        <li><strong>Estimated Cost:</strong> $${(order.estimated_cost || 0).toFixed(2)}</li>
        ${order.scheduled_date ? `<li><strong>Scheduled Date:</strong> ${new Date(order.scheduled_date).toLocaleDateString()}</li>` : ''}
      </ul>
      
      <a href="${pdfUrl}" class="button">View Work Order</a>
      
      <p style="margin-top: 20px;">If you have any questions, please don't hesitate to contact us at <a href="mailto:sales@axonicmoto.com">sales@axonicmoto.com</a>.</p>
    </div>
    
    <div class="footer">
      <p>Axonic Motorworks - Building 1 Unit 1A</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
}
