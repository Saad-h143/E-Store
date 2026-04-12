import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD,
  },
} as SMTPTransport.Options);

const FROM_NAME = "Ezee Store";

interface OrderItem {
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  shippingAddress: string;
}

async function sendEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error("Gmail SMTP error:", err);
    return { success: false, error: err };
  }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

function baseLayout(title: string, content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px 16px 0 0;padding:20px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Ezee Store</h1>
    </div>
    <!-- Body -->
    <div style="background:#fff;padding:24px 20px;border-radius:0 0 16px 16px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="text-align:center;padding:24px;color:#71717a;font-size:12px;">
      <p style="margin:0;">&copy; ${new Date().getFullYear()} Ezee Store. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

function orderConfirmationHtml(data: OrderEmailData) {
  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f4f4f5;">
        <p style="margin:0;font-weight:600;color:#18181b;">${item.title}</p>
        <p style="margin:4px 0 0;color:#71717a;font-size:13px;">Qty: ${item.quantity}</p>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f4f4f5;text-align:right;font-weight:600;color:#18181b;">
        ${formatPrice(item.price * item.quantity)}
      </td>
    </tr>`
    )
    .join("");

  return baseLayout(
    "Order Confirmation",
    `
    <h2 style="margin:0 0 8px;color:#18181b;font-size:20px;">Order Confirmed!</h2>
    <p style="margin:0 0 24px;color:#52525b;">Hi ${data.customerName}, thank you for your order.</p>

    <div style="background:#f4f4f5;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#71717a;">Order Number</p>
      <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#6366f1;">${data.orderNumber}</p>
    </div>

    <h3 style="margin:0 0 12px;color:#18181b;font-size:16px;">Items Ordered</h3>
    <table style="width:100%;border-collapse:collapse;">
      ${itemsHtml}
      <tr>
        <td style="padding:16px 0 0;font-weight:700;font-size:16px;color:#18181b;">Total</td>
        <td style="padding:16px 0 0;text-align:right;font-weight:700;font-size:16px;color:#6366f1;">${formatPrice(data.total)}</td>
      </tr>
    </table>

    <div style="margin-top:24px;padding:16px;background:#f0fdf4;border-radius:12px;border-left:4px solid #22c55e;">
      <p style="margin:0;font-size:13px;color:#15803d;font-weight:600;">Shipping Address</p>
      <p style="margin:4px 0 0;color:#166534;">${data.shippingAddress}</p>
    </div>

    <!-- Payment Instructions -->
    <div style="margin-top:24px;padding:20px;background:linear-gradient(135deg,#fef3c7,#fef9c3);border-radius:12px;border:1px solid #f59e0b;">
      <h3 style="margin:0 0 12px;color:#92400e;font-size:16px;font-weight:700;">Payment Required</h3>
      <p style="margin:0 0 16px;color:#78350f;font-size:13px;line-height:1.6;">
        Please transfer the payment to the bank account below and send the receipt/proof of payment before we can dispatch your order.
      </p>

      <div style="background:#fff;border-radius:8px;padding:14px;margin-bottom:12px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr>
            <td style="padding:4px 0;color:#71717a;width:130px;">Account Holder</td>
            <td style="padding:4px 0;font-weight:600;color:#18181b;">ABDULLAH MOBILES LIMITED</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#71717a;">Bank</td>
            <td style="padding:4px 0;font-weight:600;color:#18181b;">Wise</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#71717a;">IBAN</td>
            <td style="padding:4px 0;font-weight:600;color:#18181b;">BE92 9050 2646 3223</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#71717a;">BIC/SWIFT</td>
            <td style="padding:4px 0;font-weight:600;color:#18181b;">TRWIBEB1XXX</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#71717a;">Bank Address</td>
            <td style="padding:4px 0;font-weight:500;color:#52525b;font-size:12px;">Rue du Tr&ocirc;ne 100, 3rd floor, Brussels 1050, Belgium</td>
          </tr>
        </table>
      </div>

      <p style="margin:0 0 8px;color:#78350f;font-size:13px;font-weight:600;">How to send payment proof:</p>
      <p style="margin:0;color:#78350f;font-size:13px;line-height:1.6;">
        1. Upload the receipt from your <strong>My Orders</strong> section on our website<br>
        2. Or send it via WhatsApp: <strong>+351 924 288 509</strong>
      </p>
    </div>

    <div style="margin-top:16px;padding:14px;background:#eff6ff;border-radius:12px;border-left:4px solid #3b82f6;">
      <p style="margin:0;color:#1e40af;font-size:13px;">
        <strong>Note:</strong> Your order will be processed and dispatched once we verify your payment. You will receive a confirmation email after verification.
      </p>
    </div>
  `
  );
}

function statusUpdateHtml(data: {
  customerName: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  total: number;
}) {
  const statusConfig: Record<string, { color: string; bg: string; label: string; message: string }> = {
    pending: { color: "#d97706", bg: "#fffbeb", label: "Pending", message: "Your order is pending and awaiting payment confirmation. Please upload your payment receipt to proceed." },
    payment_verified: { color: "#16a34a", bg: "#f0fdf4", label: "Payment Verified", message: "Your payment has been successfully verified! We are now preparing your order for dispatch. Thank you for your payment." },
    confirmed: { color: "#2563eb", bg: "#eff6ff", label: "Confirmed", message: "Your order has been confirmed and is being prepared." },
    processing: { color: "#7c3aed", bg: "#f5f3ff", label: "Processing", message: "Your order is being processed and packed." },
    shipped: { color: "#0891b2", bg: "#ecfeff", label: "Shipped", message: "Your order has been shipped and is on its way!" },
    delivered: { color: "#16a34a", bg: "#f0fdf4", label: "Delivered", message: "Your order has been delivered. Enjoy!" },
    cancelled: { color: "#dc2626", bg: "#fef2f2", label: "Cancelled", message: "Your order has been cancelled. Contact support if you have questions." },
  };

  const config = statusConfig[data.status] || {
    color: "#6366f1",
    bg: "#eef2ff",
    label: data.status,
    message: `Your order status is now: ${data.status}.`,
  };

  const itemsSummary = data.items
    .map((item) => `<li style="padding:4px 0;color:#52525b;">${item.title} x ${item.quantity}</li>`)
    .join("");

  return baseLayout(
    "Order Status Update",
    `
    <h2 style="margin:0 0 8px;color:#18181b;font-size:20px;">Order Status Update</h2>
    <p style="margin:0 0 24px;color:#52525b;">Hi ${data.customerName}, here's an update on your order.</p>

    <div style="background:${config.bg};border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:8px 0 4px;font-size:13px;color:#71717a;">Order ${data.orderNumber}</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:${config.color};text-transform:capitalize;">${config.label}</p>
      <p style="margin:12px 0 0;color:#52525b;font-size:14px;">${config.message}</p>
    </div>

    <h3 style="margin:0 0 8px;color:#18181b;font-size:14px;">Order Summary</h3>
    <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;">
      ${itemsSummary}
    </ul>
    <p style="margin:0;font-weight:700;color:#18181b;">Total: <span style="color:#6366f1;">${formatPrice(data.total)}</span></p>

    <p style="margin:24px 0 0;color:#71717a;font-size:13px;">If you have any questions, feel free to reach out to our support team.</p>
  `
  );
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  return sendEmail(
    data.customerEmail,
    `Order Confirmed - ${data.orderNumber} | Ezee Store`,
    orderConfirmationHtml(data)
  );
}

function adminOrderAlertHtml(data: OrderEmailData & { customerPhone: string }) {
  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;">
        <p style="margin:0;font-weight:600;color:#18181b;">${item.title}</p>
        <p style="margin:4px 0 0;color:#71717a;font-size:13px;">Qty: ${item.quantity}</p>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;text-align:right;font-weight:600;color:#18181b;">
        ${formatPrice(item.price * item.quantity)}
      </td>
    </tr>`
    )
    .join("");

  return baseLayout(
    "New Order Received",
    `
    <div style="background:#fef3c7;border-radius:10px;padding:10px;margin-bottom:16px;text-align:center;">
      <p style="margin:0;font-size:16px;font-weight:700;color:#b45309;">New Order Received!</p>
    </div>

    <div style="background:#f4f4f5;border-radius:10px;padding:12px;margin-bottom:16px;">
      <p style="margin:0;font-size:11px;color:#71717a;">Order Number</p>
      <p style="margin:2px 0 0;font-size:15px;font-weight:700;color:#6366f1;">${data.orderNumber}</p>
    </div>

    <h3 style="margin:0 0 8px;color:#18181b;font-size:14px;">Customer Details</h3>
    <table style="width:100%;margin-bottom:14px;font-size:13px;">
      <tr>
        <td style="padding:4px 0;color:#71717a;width:80px;">Name</td>
        <td style="padding:4px 0;font-weight:600;color:#18181b;">${data.customerName}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#71717a;">Email</td>
        <td style="padding:4px 0;font-weight:600;color:#18181b;">${data.customerEmail}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#71717a;">Phone</td>
        <td style="padding:4px 0;font-weight:600;color:#18181b;">${data.customerPhone}</td>
      </tr>
    </table>

    <h3 style="margin:0 0 8px;color:#18181b;font-size:14px;">Items Ordered</h3>
    <table style="width:100%;border-collapse:collapse;">
      ${itemsHtml}
      <tr>
        <td style="padding:10px 0 0;font-weight:700;font-size:14px;color:#18181b;">Total</td>
        <td style="padding:10px 0 0;text-align:right;font-weight:700;font-size:14px;color:#6366f1;">${formatPrice(data.total)}</td>
      </tr>
    </table>

    <div style="margin-top:14px;padding:10px 12px;background:#f0fdf4;border-radius:10px;border-left:3px solid #22c55e;">
      <p style="margin:0;font-size:11px;color:#15803d;font-weight:600;">Ship To</p>
      <p style="margin:2px 0 0;color:#166534;font-size:13px;">${data.shippingAddress}</p>
    </div>

    <div style="margin-top:16px;text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/orders" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;font-weight:700;font-size:13px;padding:10px 28px;border-radius:10px;">
        View Order in Dashboard
      </a>
    </div>

    <p style="margin:12px 0 0;color:#71717a;font-size:11px;text-align:center;">
      ${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}
    </p>
  `
  );
}

export async function sendAdminOrderAlertEmail(data: OrderEmailData & { customerPhone: string }) {
  const adminEmail = process.env.SMTP_EMAIL!;
  return sendEmail(
    adminEmail,
    `New Order - ${data.orderNumber} | ${data.customerName} | ${formatPrice(data.total)}`,
    adminOrderAlertHtml(data)
  );
}

export async function sendStatusUpdateEmail(data: {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  total: number;
}) {
  return sendEmail(
    data.customerEmail,
    `Order ${data.orderNumber} - ${data.status.charAt(0).toUpperCase() + data.status.slice(1)} | Ezee Store`,
    statusUpdateHtml(data)
  );
}
