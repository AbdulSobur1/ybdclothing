import { Resend } from "resend";
import { config } from "@/lib/config";

/** Lazy Resend client — created on first use so builds work without env vars */
function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

/**
 * Send a notification to the store owner when a new order is placed.
 */
export async function sendNewOrderNotification(params: {
  orderId: number;
  customerName: string;
  customerEmail: string;
  total: number; // in Naira
  adminUrl: string;
}) {
  const { orderId, customerName, customerEmail, total, adminUrl } = params;

  try {
    await getResend().emails.send({
      from: config.resendFrom,
      to: config.ownerEmail,
      subject: `🛍️ New Order #${orderId} — YBD Clothing`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, sans-serif; background: #F2EDE1; padding: 32px;">
            <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px;">
              <h2 style="color: #4A6B6D; font-family: Georgia, serif;">New Order Received</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #666;">Order</td><td style="font-weight: 600;">#${orderId}</td></tr>
                <tr><td style="padding: 8px 0; color: #666;">Customer</td><td>${customerName}</td></tr>
                <tr><td style="padding: 8px 0; color: #666;">Email</td><td>${customerEmail}</td></tr>
                <tr><td style="padding: 8px 0; color: #666;">Total</td><td style="font-weight: 600;">₦${total.toLocaleString()}</td></tr>
              </table>
              <p style="margin-top: 24px;">
                <a href="${adminUrl}" style="display: inline-block; padding: 12px 24px; background: #4A6B6D; color: #fff; text-decoration: none; border-radius: 999px;">View Order</a>
              </p>
              <p style="color: #999; font-size: 14px; margin-top: 16px;">YBD Clothing — Automated notification</p>
            </div>
          </body>
        </html>
      `,
      text: `New Order #${orderId}\n\nCustomer: ${customerName} (${customerEmail})\nTotal: ₦${total.toLocaleString()}\n\nView at: ${adminUrl}`,
    });
  } catch (error) {
    console.error("Failed to send new-order email:", error);
    // Don't throw — email failure shouldn't block the order
  }
}

/**
 * Send a status update notification to a customer.
 */
export async function sendOrderStatusUpdate(params: {
  orderId: number;
  customerEmail: string;
  customerName: string;
  newStatus: string;
}) {
  const { orderId, customerEmail, customerName, newStatus } = params;

  const statusLabels: Record<string, string> = {
    pending_payment: "Pending Payment",
    pending_verification: "Pending Verification",
    confirmed: "Confirmed ✅",
    rejected: "Rejected ❌",
    shipped: "Shipped 🚚",
    completed: "Completed ✅",
  };

  const label = statusLabels[newStatus] ?? newStatus;

  try {
    await getResend().emails.send({
      from: config.resendFrom,
      to: customerEmail,
      subject: `Order #${orderId} is now ${label} — YBD Clothing`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, sans-serif; background: #F2EDE1; padding: 32px;">
            <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px;">
              <h2 style="color: #4A6B6D; font-family: Georgia, serif;">Hi ${customerName},</h2>
              <p>Your order <strong>#${orderId}</strong> status has been updated to:</p>
              <p style="font-size: 20px; font-weight: 600; color: ${newStatus === "rejected" ? "#c00" : "#4A6B6D"}; padding: 12px 0;">${label}</p>
              <p style="color: #999; font-size: 14px; margin-top: 16px;">YBD Clothing — Automated notification</p>
            </div>
          </body>
        </html>
      `,
      text: `Hi ${customerName},\n\nYour order #${orderId} status has been updated to: ${label}\n\nYBD Clothing`,
    });
  } catch (error) {
    console.error("Failed to send status-update email:", error);
  }
}
