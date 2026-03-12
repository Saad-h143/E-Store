const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN!;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID!;
const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP_NUMBER!; // Your personal number to receive order alerts
const WHATSAPP_API = `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`;

interface OrderItem {
  title: string;
  price: number;
  quantity: number;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

async function sendWhatsAppMessage(to: string, body: object) {
  try {
    const res = await fetch(WHATSAPP_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        ...body,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[WhatsApp] API error:", err);
      return { success: false, error: err };
    }

    const data = await res.json();
    console.log("[WhatsApp] Message sent:", data);
    return { success: true, data };
  } catch (err) {
    console.error("[WhatsApp] Send error:", err);
    return { success: false, error: err };
  }
}

// Format phone number to international format (Pakistan)
function formatPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, "");
  // If starts with 0, replace with 92 (Pakistan)
  if (cleaned.startsWith("0")) {
    cleaned = "92" + cleaned.slice(1);
  }
  // If doesn't start with country code, add 92
  if (!cleaned.startsWith("92") && !cleaned.startsWith("+")) {
    cleaned = "92" + cleaned;
  }
  // Remove + if present
  cleaned = cleaned.replace("+", "");
  return cleaned;
}

export async function sendOrderConfirmationWhatsApp(data: {
  customerName: string;
  customerPhone: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  shippingAddress: string;
}) {
  const phone = formatPhone(data.customerPhone);

  const itemsList = data.items
    .map((item, i) => `${i + 1}. ${item.title} x${item.quantity} — ${formatPrice(item.price * item.quantity)}`)
    .join("\n");

  const message = `🛍️ *Order Confirmed!*

Hi ${data.customerName}, your order has been placed successfully!

📋 *Order:* ${data.orderNumber}

*Items:*
${itemsList}

💰 *Total:* ${formatPrice(data.total)}

📍 *Delivery to:*
${data.shippingAddress}

We'll notify you when your order status changes. Thank you for shopping with *Ezee Store*! 🎉`;

  return sendWhatsAppMessage(phone, {
    type: "text",
    text: { body: message },
  });
}

export async function sendStatusUpdateWhatsApp(data: {
  customerName: string;
  customerPhone: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  total: number;
}) {
  const phone = formatPhone(data.customerPhone);

  const statusEmoji: Record<string, string> = {
    confirmed: "✅",
    processing: "⚙️",
    shipped: "🚚",
    delivered: "📦",
    cancelled: "❌",
  };

  const statusMessages: Record<string, string> = {
    confirmed: "Your order has been confirmed and is being prepared.",
    processing: "Your order is being processed and packed.",
    shipped: "Your order has been shipped and is on its way!",
    delivered: "Your order has been delivered. Enjoy!",
    cancelled: "Your order has been cancelled. Contact us if you have questions.",
  };

  const emoji = statusEmoji[data.status] || "📋";
  const statusMsg = statusMessages[data.status] || `Your order status is now: ${data.status}`;

  const itemsList = data.items
    .map((item) => `• ${item.title} x${item.quantity}`)
    .join("\n");

  const message = `${emoji} *Order Status Update*

Hi ${data.customerName},

Your order *${data.orderNumber}* is now: *${data.status.toUpperCase()}*

${statusMsg}

*Items:*
${itemsList}

💰 *Total:* ${formatPrice(data.total)}

— *Ezee Store*`;

  return sendWhatsAppMessage(phone, {
    type: "text",
    text: { body: message },
  });
}

// Admin notification — sends to your personal WhatsApp when a new order comes in
export async function sendAdminOrderAlert(data: {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  shippingAddress: string;
}) {
  const adminPhone = formatPhone(ADMIN_WHATSAPP);

  const itemsList = data.items
    .map((item, i) => `${i + 1}. ${item.title} x${item.quantity} — ${formatPrice(item.price * item.quantity)}`)
    .join("\n");

  const message = `🔔 *New Order Received!*

📋 *Order:* ${data.orderNumber}

👤 *Customer:* ${data.customerName}
📧 *Email:* ${data.customerEmail}
📱 *Phone:* ${data.customerPhone}

*Items:*
${itemsList}

💰 *Total:* ${formatPrice(data.total)}

📍 *Ship to:*
${data.shippingAddress}

⏰ ${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}`;

  return sendWhatsAppMessage(adminPhone, {
    type: "text",
    text: { body: message },
  });
}
