import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD,
  },
});

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
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
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
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px 16px 0 0;padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">Ezee Store</h1>
    </div>
    <!-- Body -->
    <div style="background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;">
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

    <p style="margin:24px 0 0;color:#71717a;font-size:13px;">We'll send you an update when your order status changes.</p>
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
