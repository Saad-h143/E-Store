import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD,
  },
});

// In-memory OTP store (resets on server restart — fine for dev/small scale)
const otpStore = new Map<string, { code: string; expiresAt: number; name: string }>();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function verificationEmailHtml(name: string, code: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px 16px 0 0;padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">Ezee Store</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Verify Your Email Address</p>
    </div>
    <!-- Body -->
    <div style="background:#fff;padding:32px 24px;border-radius:0 0 16px 16px;">
      <h2 style="margin:0 0 8px;color:#18181b;font-size:20px;">Welcome, ${name}!</h2>
      <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6;">
        Thank you for creating an account with Ezee Store. Please use the verification code below to confirm your email address.
      </p>

      <!-- OTP Code -->
      <div style="background:linear-gradient(135deg,#eef2ff,#f5f3ff);border:2px dashed #6366f1;border-radius:16px;padding:28px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#71717a;font-size:13px;text-transform:uppercase;letter-spacing:2px;">Verification Code</p>
        <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#6366f1;font-family:'Courier New',monospace;">${code}</div>
        <p style="margin:12px 0 0;color:#a1a1aa;font-size:12px;">This code expires in 10 minutes</p>
      </div>

      <div style="background:#fefce8;border-radius:12px;padding:16px;border-left:4px solid #eab308;margin-bottom:24px;">
        <p style="margin:0;color:#854d0e;font-size:13px;">
          <strong>Security Tip:</strong> Never share this code with anyone. Ezee Store will never ask for your verification code.
        </p>
      </div>

      <p style="margin:0;color:#71717a;font-size:13px;line-height:1.6;">
        If you didn't create an account with Ezee Store, you can safely ignore this email.
      </p>
    </div>
    <!-- Footer -->
    <div style="text-align:center;padding:24px;color:#71717a;font-size:12px;">
      <p style="margin:0;">&copy; ${new Date().getFullYear()} Ezee Store. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, name, code } = body;

    if (action === "send") {
      // Generate and send OTP
      if (!email || !name) {
        return NextResponse.json({ error: "Email and name are required" }, { status: 400 });
      }

      const otp = generateOTP();
      otpStore.set(email, {
        code: otp,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        name,
      });

      console.log("[EMAIL] Sending verification to:", email, "OTP:", otp);

      await transporter.sendMail({
        from: `"Ezee Store" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: "Verify Your Email - Ezee Store",
        html: verificationEmailHtml(name, otp),
      });

      console.log("[EMAIL] Verification sent successfully to:", email);
      return NextResponse.json({ success: true });
    }

    if (action === "verify") {
      // Verify OTP
      if (!email || !code) {
        return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
      }

      const stored = otpStore.get(email);
      if (!stored) {
        return NextResponse.json({ error: "No verification code found. Please request a new one." }, { status: 400 });
      }

      if (Date.now() > stored.expiresAt) {
        otpStore.delete(email);
        return NextResponse.json({ error: "Verification code has expired. Please request a new one." }, { status: 400 });
      }

      if (stored.code !== code) {
        return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
      }

      // Success — clean up
      otpStore.delete(email);
      return NextResponse.json({ success: true, verified: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[EMAIL] Verification error:", err);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
