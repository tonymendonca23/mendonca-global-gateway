import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
const FROM_ADDRESS = import.meta.env.RESEND_FROM_EMAIL || 'Mendonca Global Gateway <no-reply@resend.mendoncagg.com>';

interface WelcomeEmailParams {
  email: string;
  name: string;
  customerCode: string | null;
  warehouseAddress: string | null;
}

export async function sendWelcomeEmail({
  email,
  name,
  customerCode,
  warehouseAddress,
}: WelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const safeName = name || 'there';
    const codeLine = customerCode
      ? `<p style="margin: 0 0 16px; font-size: 15px; color: #1a365d;"><strong>Customer ID:</strong> ${customerCode}</p>`
      : '';

    const addressBlock = warehouseAddress
      ? `<pre style="background-color: #f7fafc; padding: 12px 16px; border-radius: 8px; font-size: 14px; line-height: 1.5; white-space: pre-line; border: 1px solid #e2e8f0;">${warehouseAddress}</pre>`
      : '<p style="font-size: 14px; color: #4a5568; margin: 0;">Your US warehouse address will be available in your dashboard shortly.</p>';

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; color: #1a202c;">
        <div style="text-align: center; margin-bottom: 32px;">
          <img src="${SITE_URL}/logo.svg" alt="MGG Logo" style="height: 48px; width: auto;" />
        </div>
        
        <h1 style="font-size: 24px; margin-bottom: 24px; color: #1a365d; text-align: center;">Welcome to Mendonca Global Gateway!</h1>
        
        <p style="font-size: 16px; color: #4a5568; margin: 0 0 20px; line-height: 1.6;">Hi ${safeName},</p>
        
        <p style="font-size: 16px; color: #4a5568; margin: 0 0 24px; line-height: 1.6;">
          I'm excited to let you know that your dedicated mailbox with Mendonca's Global Gateway is now active and ready for use! You can start shipping your packages to the following address:
        </p>

        <div style="background-color: #f8fafc; border-left: 4px solid #ed8936; padding: 20px; border-radius: 4px; margin-bottom: 24px;">
          <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 15px; color: #2d3748; line-height: 1.8;">
            <div><strong>Name:</strong> ${safeName} + MGG</div>
            <div><strong>Address Line 1:</strong> 146-19 228th Street</div>
            <div><strong>City:</strong> Springfield Gardens</div>
            <div><strong>State:</strong> New York</div>
            <div><strong>Zip Code:</strong> 11413</div>
            <div><strong>Phone:</strong> (917) 660-6872</div>
          </div>
        </div>

        <p style="font-size: 16px; color: #4a5568; margin: 0 0 20px; line-height: 1.6;">
          Please make sure that all your orders are addressed exactly as shown above to avoid any delays. Once your packages arrive at the mailbox, we'll process them promptly and keep you updated every step of the way.
        </p>

        <p style="font-size: 16px; color: #4a5568; margin: 0 0 32px; line-height: 1.6;">
          If you have any questions or need assistance, feel free to reach out—I'm here to help!<br><br>
          Looking forward to serving you.
        </p>

        <div style="border-top: 2px solid #e2e8f0; padding-top: 32px; margin-top: 32px;">
          <p style="font-size: 15px; color: #4a5568; margin: 0 0 16px; line-height: 1.6;">
            Best regards,<br>
            <strong>Miguel Mendonca</strong><br>
            <span style="color: #718096;">Founder & CEO</span><br>
            <span style="color: #ed8936; font-weight: 600;">Mendonca's Global Gateway</span>
          </p>
          
          <div style="font-size: 14px; color: #718096; line-height: 1.6;">
            📞 +592 671-7816<br>
            📧 miguel_ceo@mendoncagg.com<br>
            🌐 <a href="https://www.mendoncagg.com" style="color: #ed8936; text-decoration: none;">www.mendoncagg.com</a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 40px;">
          <a
            href="${SITE_URL}/dashboard"
            style="display: inline-block; background-color: #1a365d; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: 600;"
          >
            Access Your Dashboard
          </a>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: 'Welcome to Mendonca Global Gateway',
      html,
    });

    return { success: true };
  } catch (error) {
    ;
    return { success: false, error: 'Failed to send welcome email' };
  }
}

interface InvoiceEmailParams {
  email: string;
  name: string | null;
  invoiceNumber: string;
  totalGyd: number;
  invoiceUrl: string;
}

export async function sendInvoiceEmail({
  email,
  name,
  invoiceNumber,
  totalGyd,
  invoiceUrl,
}: InvoiceEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const safeName = name && name.trim().length > 0 ? name.trim() : 'there';

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; color: #1a202c;">
        <h1 style="font-size: 22px; margin-bottom: 8px; color: #1a365d;">Your Mendonca Global Gateway Invoice</h1>
        <p style="font-size: 15px; color: #4a5568; margin: 0 0 16px;">Hi ${safeName},</p>
        <p style="font-size: 15px; color: #4a5568; margin: 0 0 16px;">
          Your invoice <strong>${invoiceNumber}</strong> is ready.
        </p>
        <p style="font-size: 15px; color: #4a5568; margin: 0 0 16px;">
          <strong>Total due:</strong> GYD ${totalGyd.toLocaleString('en-US')}.
        </p>
        <p style="font-size: 14px; color: #4a5568; margin: 0 0 16px;">
          You can view or download the full invoice as a PDF using the link below:
        </p>
        <p style="margin: 0 0 20px;">
          <a href="${invoiceUrl}" style="display: inline-block; background-color: #ed64a6; color: #ffffff; padding: 10px 20px; border-radius: 999px; text-decoration: none; font-size: 14px; font-weight: 600;">View Invoice PDF</a>
        </p>
        <p style="font-size: 13px; color: #718096; margin: 0 0 8px;">
          If you have any questions about your charges, please contact our support team.
        </p>
        <p style="font-size: 13px; color: #a0aec0; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          Mendonca Global Gateway &mdash; Thank you for shipping with us.
        </p>
      </div>
    `;

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: `Your invoice ${invoiceNumber}`,
      html,
    });

    return { success: true };
  } catch (error) {
    ;
    return { success: false, error: 'Failed to send invoice email' };
  }
}

interface PasswordResetEmailParams {
  email: string;
  name: string | null;
  resetUrl: string;
}

export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
}: PasswordResetEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const safeName = name && name.trim().length > 0 ? name.trim() : 'there';

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; color: #1a202c;">
        <div style="text-align: center; margin-bottom: 32px;">
          <img src="${SITE_URL}/logo.svg" alt="MGG Logo" style="height: 48px; width: auto;" />
        </div>
        
        <h1 style="font-size: 24px; margin-bottom: 24px; color: #1a365d; text-align: center;">Reset Your Password</h1>
        
        <p style="font-size: 16px; color: #4a5568; margin: 0 0 20px; line-height: 1.6;">Hi ${safeName},</p>
        
        <p style="font-size: 16px; color: #4a5568; margin: 0 0 24px; line-height: 1.6;">
          We received a request to reset your password for your Mendonca Global Gateway account. If you didn't make this request, you can safely ignore this email.
        </p>

        <p style="font-size: 16px; color: #4a5568; margin: 0 0 32px; line-height: 1.6;">
          To reset your password, click the button below:
        </p>

        <div style="text-align: center; margin-bottom: 40px;">
          <a
            href="${resetUrl}"
            style="display: inline-block; background-color: #ed8936; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: 600;"
          >
            Reset Password
          </a>
        </div>

        <p style="font-size: 14px; color: #718096; margin: 0 0 32px; line-height: 1.6;">
          Or copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #ed8936; word-break: break-all;">${resetUrl}</a>
        </p>

        <div style="border-top: 2px solid #e2e8f0; padding-top: 32px;">
          <p style="font-size: 15px; color: #4a5568; margin: 0 0 16px; line-height: 1.6;">
            Best regards,<br>
            <strong>Miguel Mendonca</strong><br>
            <span style="color: #718096;">Founder & CEO</span><br>
            <span style="color: #ed8936; font-weight: 600;">Mendonca's Global Gateway</span>
          </p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: 'Reset your Mendonca Global Gateway password',
      html,
    });

    return { success: true };
  } catch (error) {
    ;
    return { success: false, error: 'Failed to send password reset email' };
  }
}

interface PackageStatusEmailParams {
  email: string;
  name: string;
  trackingNumber: string;
  originalTracking?: string;
  newStatus: string;
}

export async function sendPackageStatusEmail({
  email,
  name,
  trackingNumber,
  originalTracking,
  newStatus,
}: PackageStatusEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const safeName = name && name.trim().length > 0 ? name.trim() : 'there';
    const displayTracking = originalTracking ? originalTracking : trackingNumber;

    let statusHeader = '';
    let statusMessage = '';

    switch (newStatus) {
      case 'at_warehouse':
        statusHeader = '📦 Package Arrived at US Warehouse';
        statusMessage = `Great news! Your package (Tracking: <strong>${displayTracking}</strong>) has successfully arrived at our US Warehouse in Miami. It is currently being processed and will be prepared for flight to Guyana soon.`;
        break;
      case 'in_transit':
        statusHeader = '✈️ Package is in Transit';
        statusMessage = `Your package (Tracking: <strong>${displayTracking}</strong>) is officially in transit! It is on its way to Guyana right now. We'll let you know once it arrives and begins customs clearance.`;
        break;
      case 'customs':
        statusHeader = '📋 Package at Customs Clearance';
        statusMessage = `Your package (Tracking: <strong>${displayTracking}</strong>) has arrived in Guyana and is currently undergoing customs clearance. This process typically takes a short while. We will notify you as soon as it's ready for pickup!`;
        break;
      default:
        // Fallback for other statuses just in case
        statusHeader = '📦 Package Status Update';
        statusMessage = `The status of your package (Tracking: <strong>${displayTracking}</strong>) has been updated to: ${newStatus.replace('_', ' ')}.`;
    }

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; color: #1a202c;">
        <h1 style="font-size: 22px; margin-bottom: 16px; color: #1a365d;">${statusHeader}</h1>
        <p style="font-size: 15px; color: #4a5568; margin: 0 0 16px;">Hi ${safeName},</p>
        <p style="font-size: 15px; color: #4a5568; margin: 0 0 24px; line-height: 1.6;">
          ${statusMessage}
        </p>
        <div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
          <a
            href="${SITE_URL}/dashboard/packages"
            style="display: inline-block; background-color: #1a365d; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: 600;"
          >
            Track in your Dashboard
          </a>
        </div>
        <p style="font-size: 13px; color: #a0aec0; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          Mendonca Global Gateway &mdash; Thank you for shipping with us.
        </p>
      </div>
    `;

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: statusHeader,
      html,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to send package status email' };
  }
}
