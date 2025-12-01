const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (order) => {
  const transporter = createTransporter();

  const itemsList = order.items.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px; color: #333;">${item.quantity}x ${item.menu_item_name}</td>
      <td style="padding: 10px; text-align: right; color: #333;">$${parseFloat(item.unit_price).toFixed(2)}</td>
    </tr>
    ${item.customizations ? `
    <tr>
      <td colspan="2" style="padding: 0 10px 10px; color: #777; font-size: 12px;">
        🌶️ ${item.customizations}
      </td>
    </tr>
    ` : ''}
  `).join('');

  const orderTypeInfo = order.order_type === 'DELIVERY'
    ? `<p style="margin: 5px 0;"><strong>📍 Delivery Address:</strong> ${order.delivery_address || 'Not specified'}</p>`
    : `<p style="margin: 5px 0;"><strong>📍 Pickup:</strong> Ready in 15-20 minutes</p>`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Ricos Tacos" <orders@losricostacos.com>',
    to: order.customer_email,
    subject: `🌮 Order Confirmed #${order.id} - Ricos Tacos`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with Logo -->
        <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; border-radius: 8px 8px 0 0;">
          <img src="${process.env.FRONTEND_URL || 'https://losricostacos.com'}/images/ricos-tacos-logo.jpg" 
               alt="Ricos Tacos" 
               style="max-width: 200px; height: auto; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);" />
          <h1 style="margin: 10px 0 0; font-size: 32px;">🌮 Ricos Tacos</h1>
          <p style="margin: 10px 0 0; font-size: 18px; opacity: 0.95;">Order Confirmed!</p>
          <p style="margin: 10px 0 0; font-size: 24px; font-weight: bold; background-color: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 20px; display: inline-block;">
            Order #${order.id}
          </p>
        </div>
        
        <!-- Body -->
        <div style="padding: 30px 20px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #333;">Hi ${order.customer_name},</p>
          <p style="font-size: 16px; color: #333;">¡Gracias! Your taco order is confirmed and we're getting it ready for you! 🎉</p>
          
          <!-- Order Info Card -->
          <div style="background: linear-gradient(135deg, #FFF5EB 0%, #FFE8D6 100%); padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #FF6B35;">
            <h3 style="margin-top: 0; color: #FF6B35; font-size: 18px;">📋 Order Details</h3>
            <p style="margin: 8px 0; color: #555;"><strong>Status:</strong> <span style="color: #10B981; font-weight: bold;">${order.status}</span></p>
            <p style="margin: 8px 0; color: #555;"><strong>Order Type:</strong> ${order.order_type === 'DELIVERY' ? '🚗 Delivery' : '🏃 Pickup'}</p>
            ${orderTypeInfo}
            <p style="margin: 8px 0; color: #555;"><strong>⏰ Time:</strong> ${order.pickup_time || 'ASAP (15-20 mins)'}</p>
            ${order.notes ? `<p style="margin: 8px 0; color: #555;"><strong>📝 Special Instructions:</strong> ${order.notes}</p>` : ''}
            <p style="margin: 8px 0; color: #555;"><strong>📞 Phone:</strong> ${order.customer_phone}</p>
          </div>

          <!-- Items Table -->
          <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">🌮 Your Tacos</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white;">
                <th style="padding: 12px; text-align: left; font-weight: 600;">Item</th>
                <th style="padding: 12px; text-align: right; font-weight: 600;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
            <tfoot>
              <tr style="background-color: #FFF5EB; font-weight: bold; font-size: 18px;">
                <td style="padding: 15px; text-align: right; color: #FF6B35;">Total:</td>
                <td style="padding: 15px; text-align: right; color: #FF6B35;">$${order.total_amount}</td>
              </tr>
            </tfoot>
          </table>

          <!-- Payment Status -->
          ${order.payment_status === 'PAID' ? `
          <div style="background-color: #D1FAE5; border: 1px solid #10B981; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
            <p style="margin: 0; color: #065F46; font-weight: 600;">✅ Payment Confirmed</p>
          </div>
          ` : `
          <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
            <p style="margin: 0; color: #92400E; font-weight: 600;">💳 Payment: ${order.payment_status || 'Pending'}</p>
          </div>
          `}

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://localhost'}/order-confirmation/${order.id}" 
               style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); 
                      color: white; 
                      padding: 14px 32px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold;
                      font-size: 16px;
                      display: inline-block;
                      box-shadow: 0 4px 6px rgba(255, 107, 53, 0.3);">
              🔍 Track Your Order
            </a>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; text-align: center;">
            <p style="color: #718096; font-size: 14px; margin: 5px 0;">
              Questions? Reply to this email or call us!
            </p>
            <p style="color: #A0AEC0; font-size: 12px; margin: 15px 0 5px;">
              Ricos Tacos - Authentic Tacos Made Fresh Daily
            </p>
            <p style="color: #CBD5E0; font-size: 11px; margin: 0;">
              This is an automated confirmation email.
            </p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Order confirmation email sent to:', order.customer_email);
    return true;
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error);
    // Don't throw, just log error so order process completes
    return false;
  }
};

// Send verification email
const sendVerificationEmail = async (email, name, token) => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Ricos Tacos" <noreply@losricostacos.com>',
    to: email,
    subject: 'Verify your email - Ricos Tacos',
    html: `
            <h1>Welcome to Ricos Tacos, ${name}!</h1>
            <p>Please verify your email address by clicking the link below:</p>
            <a href="${verificationUrl}">Verify Email</a>
            <p>This link will expire in 24 hours.</p>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, name, token) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Ricos Tacos" <noreply@losricostacos.com>',
    to: email,
    subject: 'Reset your password - Ricos Tacos',
    html: `
            <h1>Password Reset Request</h1>
            <p>Hi ${name},</p>
            <p>You requested to reset your password. Click the link below to reset it:</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return false;
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Ricos Tacos" <noreply@losricostacos.com>',
    to: email,
    subject: 'Welcome to Ricos Tacos!',
    html: `
            <h1>Welcome, ${name}!</h1>
            <p>Your email has been verified. You can now order delicious tacos!</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/menu">View Menu</a>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return false;
  }
};

module.exports = {
  sendOrderConfirmationEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
