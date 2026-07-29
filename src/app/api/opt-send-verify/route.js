import { NextResponse } from 'next/server';
const sendEmail = require('@/lib/sendEmail');

const ALLOWED_ADMIN_EMAIL = "veerhanumanfoundation@gmail.com";
const globalOtpStore = globalThis.__otpStore || new Map();
if (!globalThis.__otpStore) globalThis.__otpStore = globalOtpStore;

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes validity

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, email, otp } = body;
    const cleanEmail = (email || '').toLowerCase().trim();

    if (cleanEmail !== ALLOWED_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Access Denied: Only authorized admin email (veerhanumanfoundation@gmail.com) is allowed." },
        { status: 403 }
      );
    }

    if (action === "send") {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + OTP_EXPIRY_MS;
      globalOtpStore.set(cleanEmail, { otp: generatedOtp, expiresAt });

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
          <div style="text-align: center; border-bottom: 2px solid #1a0f5e; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="color: #1a0f5e; margin: 0; font-size: 20px;">मित्रा हिंदू समाज सेवा फाउंडेशन</h2>
            <p style="color: #d4af37; margin: 5px 0 0 0; font-weight: bold; font-size: 13px;">ADMIN PORTAL SECURITY VERIFICATION</p>
          </div>
          
          <div style="padding: 10px 0; text-align: center;">
            <p style="font-size: 15px; color: #333333;">Your one-time login verification code is:</p>
            <div style="background-color: #f8fafc; border: 2px dashed #1a0f5e; border-radius: 8px; padding: 15px; display: inline-block; margin: 15px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1a0f5e;">${generatedOtp}</span>
            </div>
            <p style="font-size: 13px; color: #e11d48; margin-top: 10px;">⏰ This code will expire in 5 minutes.</p>
          </div>

          <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #f0f0f0; font-size: 12px; color: #64748b; text-align: center;">
            <p style="margin: 0;">If you did not request this OTP, please secure your account immediately.</p>
          </div>
        </div>
      `;

      try {
        await sendEmail(
          cleanEmail,
          `Login OTP: ${generatedOtp} - MITRA HINDU SAMAJ SEVA FOUNDATION`,
          htmlContent,
          `Your Admin Login OTP is: ${generatedOtp}`
        );
        return NextResponse.json({ success: true, message: "OTP sent successfully to your email." });
      } catch (emailErr) {
        console.error("Resend email dispatch error:", emailErr);
        return NextResponse.json({ error: "Failed to send OTP to email via Resend API: " + emailErr.message }, { status: 500 });
      }
    }

    if (action === "verify") {
      if (!otp) {
        return NextResponse.json({ error: "OTP code is required." }, { status: 400 });
      }

      const record = globalOtpStore.get(cleanEmail);
      if (!record) {
        return NextResponse.json({ error: "No OTP request found for this email. Please request a new OTP." }, { status: 400 });
      }

      if (Date.now() > record.expiresAt) {
        globalOtpStore.delete(cleanEmail);
        return NextResponse.json({ error: "OTP expired. Please request a new OTP." }, { status: 400 });
      }

      if (otp.trim() === record.otp) {
        globalOtpStore.delete(cleanEmail);
        return NextResponse.json({ success: true, message: "OTP verified successfully." });
      } else {
        return NextResponse.json({ error: "Incorrect OTP code. Please check your email inbox for the 6-digit code." }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Server error." }, { status: 500 });
  }
}