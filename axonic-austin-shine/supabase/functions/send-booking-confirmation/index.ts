const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingRequest {
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  year: string;
  make: string;
  model: string;
  vin?: string;
  preferredDate?: string;
  preferredTime?: string;
  message?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bookingData: BookingRequest = await req.json();
    
    console.log("Processing booking confirmation for:", bookingData.email);

    const { name, email, phone, serviceType, year, make, model, vin, preferredDate, preferredTime, message } = bookingData;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    // Send confirmation email to customer
    const customerEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Axonic Motorworks <sales@axonicmoto.com>",
        to: [email],
        subject: "Appointment Request Received - Axonic Motorworks",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #0a4a7d 0%, #0a4a7d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .badge { background: #0a4a7d; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; display: inline-block; margin-bottom: 10px; }
                .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .detail-row { padding: 8px 0; border-bottom: 1px solid #eee; }
                .detail-label { font-weight: bold; color: #0a4a7d; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                .cta-button { background: #0a4a7d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🚗 Appointment Request Received!</h1>
                </div>
                <div class="content">
                  <div class="badge">🇺🇸 Veteran Owned & Operated</div>
                  <h2>Thank you, ${name}!</h2>
                  <p>We've received your appointment request and will contact you within 24 hours to confirm your booking.</p>
                  
                  <div class="details">
                    <h3 style="color: #0a4a7d; margin-top: 0;">📋 Booking Details</h3>
                    <div class="detail-row">
                      <span class="detail-label">Service Type:</span> ${serviceType}
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Vehicle:</span> ${year} ${make} ${model}
                    </div>
                    ${vin ? `<div class="detail-row"><span class="detail-label">VIN:</span> ${vin}</div>` : ''}
                    ${preferredDate ? `<div class="detail-row"><span class="detail-label">Preferred Date:</span> ${preferredDate}${preferredTime ? ` at ${preferredTime}` : ''}</div>` : ''}
                    <div class="detail-row">
                      <span class="detail-label">Contact Phone:</span> ${phone}
                    </div>
                    ${message ? `<div class="detail-row"><span class="detail-label">Additional Notes:</span> ${message}</div>` : ''}
                  </div>

                  <p><strong>What happens next?</strong></p>
                  <ul>
                    <li>Our team will review your request</li>
                    <li>We'll call you at ${phone} to confirm availability</li>
                    <li>You'll receive a detailed estimate for the service</li>
                  </ul>

                  <div style="text-align: center;">
                    <a href="tel:2108231595" class="cta-button">Call Us: 210-823-1595</a>
                  </div>

                  <p style="margin-top: 30px; color: #666; font-size: 14px;">
                    <strong>Questions?</strong> Feel free to call us at 210-823-1595 or reply to this email.
                  </p>
                </div>
                <div class="footer">
                  <p><strong>Axonic Motorworks</strong><br>
                  15600 Marsha Street, Austin, TX<br>
                  210-823-1595 | info@axonicmotorworks.com</p>
                  <p style="font-size: 12px; color: #999;">
                    Austin's premier full-service vehicle center • Proudly Veteran Owned
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    const customerEmailData = await customerEmailResponse.json();
    console.log("Customer email sent successfully:", customerEmailData);

    // Send notification email to business
    const businessEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Axonic Motorworks Bookings <sales@axonicmoto.com>",
        to: ["j.alberti@axonicmoto.com"], // Changed to verified test email - update to info@axonicmotorworks.com after domain verification
        subject: `New Booking Request from ${name}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0a4a7d; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .detail-row { padding: 8px 0; border-bottom: 1px solid #eee; }
                .detail-label { font-weight: bold; color: #0a4a7d; min-width: 140px; display: inline-block; }
                .urgent { background: #ff9800; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>🔔 New Booking Request</h2>
                </div>
                <div class="content">
                  <p><strong>A new appointment request has been submitted.</strong></p>
                  
                  <div class="details">
                    <h3 style="color: #0a4a7d; margin-top: 0;">Customer Information</h3>
                    <div class="detail-row">
                      <span class="detail-label">Name:</span> ${name}
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Email:</span> <a href="mailto:${email}">${email}</a>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Phone:</span> <a href="tel:${phone}">${phone}</a>
                    </div>
                  </div>

                  <div class="details">
                    <h3 style="color: #0a4a7d; margin-top: 0;">Service Details</h3>
                    <div class="detail-row">
                      <span class="detail-label">Service Type:</span> ${serviceType}
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Vehicle:</span> ${year} ${make} ${model}
                    </div>
                    ${vin ? `<div class="detail-row"><span class="detail-label">VIN:</span> ${vin}</div>` : ''}
                    ${preferredDate ? `<div class="detail-row"><span class="detail-label">Preferred Date & Time:</span> <span class="urgent">REQUESTED</span> ${preferredDate}${preferredTime ? ` at ${preferredTime}` : ''}</div>` : ''}
                    ${message ? `<div class="detail-row"><span class="detail-label">Additional Notes:</span><br><p style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-left: 3px solid #0a4a7d;">${message}</p></div>` : ''}
                  </div>

                  <p style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ff9800; border-radius: 4px;">
                    <strong>⏰ Action Required:</strong> Contact customer within 24 hours to confirm appointment.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    const businessEmailData = await businessEmailResponse.json();
    console.log("Business notification email sent successfully:", businessEmailData);

    return new Response(
      JSON.stringify({ 
        success: true,
        customerEmail: customerEmailData,
        businessEmail: businessEmailData 
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-booking-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
