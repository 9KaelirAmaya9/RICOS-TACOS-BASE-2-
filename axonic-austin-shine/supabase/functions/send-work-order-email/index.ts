import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WorkOrderEmailRequest {
  recipientEmail: string;
  recipientName: string;
  workOrderNumber: string;
  workOrderUrl: string;
  vehicleInfo?: string;
  services: string[];
  totalCost: number;
  companyInfo: {
    name: string;
    tagline: string;
    phone: string;
    email: string;
    address: string;
    primaryColor: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      recipientEmail,
      recipientName,
      workOrderNumber,
      workOrderUrl,
      vehicleInfo,
      services,
      totalCost,
      companyInfo,
    }: WorkOrderEmailRequest = await req.json();

    console.log("Sending work order email to:", recipientEmail);

    // Create branded HTML email
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, ${companyInfo.primaryColor} 0%, ${companyInfo.primaryColor}dd 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              margin: 0 0 5px 0;
              font-size: 28px;
              font-weight: bold;
            }
            .header p {
              margin: 0;
              font-size: 14px;
              opacity: 0.9;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e0e0e0;
              border-top: none;
            }
            .work-order-box {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 6px;
              margin: 20px 0;
              border-left: 4px solid ${companyInfo.primaryColor};
            }
            .work-order-number {
              font-size: 24px;
              font-weight: bold;
              color: ${companyInfo.primaryColor};
              margin: 0 0 10px 0;
            }
            .info-row {
              margin: 10px 0;
            }
            .info-label {
              font-weight: 600;
              color: #555;
            }
            .services-list {
              list-style: none;
              padding: 0;
              margin: 15px 0;
            }
            .services-list li {
              padding: 8px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .services-list li:last-child {
              border-bottom: none;
            }
            .total-cost {
              font-size: 20px;
              font-weight: bold;
              color: ${companyInfo.primaryColor};
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              background: ${companyInfo.primaryColor};
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .button:hover {
              opacity: 0.9;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 8px 8px;
              font-size: 13px;
              color: #666;
              border: 1px solid #e0e0e0;
              border-top: none;
            }
            .footer strong {
              color: ${companyInfo.primaryColor};
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${companyInfo.name}</h1>
            <p>${companyInfo.tagline}</p>
          </div>
          
          <div class="content">
            <h2>Hello ${recipientName},</h2>
            <p>Thank you for choosing ${companyInfo.name}! Your work order has been created and is ready for review.</p>
            
            <div class="work-order-box">
              <div class="work-order-number">Work Order #${workOrderNumber}</div>
              ${vehicleInfo ? `<div class="info-row"><span class="info-label">Vehicle:</span> ${vehicleInfo}</div>` : ''}
              
              <div class="info-row">
                <span class="info-label">Services Requested:</span>
              </div>
              <ul class="services-list">
                ${services.map(service => `<li>${service}</li>`).join('')}
              </ul>
              
              <div class="total-cost">
                Estimated Total: $${totalCost.toFixed(2)}
              </div>
            </div>
            
            <p>You can view and download your complete work order PDF using the button below:</p>
            
            <center>
              <a href="${workOrderUrl}" class="button">View Work Order PDF</a>
            </center>
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Review your work order details</li>
              <li>Contact us if you have any questions</li>
              <li>We'll update you on the progress of your work</li>
            </ul>
            
            <p>If you have any questions or concerns, please don't hesitate to reach out to us.</p>
          </div>
          
          <div class="footer">
            <strong>${companyInfo.name}</strong><br>
            ${companyInfo.address}<br>
            Phone: ${companyInfo.phone} | Email: ${companyInfo.email}
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: `${companyInfo.name} <onboarding@resend.dev>`,
      to: [recipientEmail, "j.alberti@axonicmoto.com"],
      subject: `Work Order #${workOrderNumber} - ${companyInfo.name}`,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-work-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);