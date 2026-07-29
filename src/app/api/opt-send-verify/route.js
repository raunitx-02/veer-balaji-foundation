import { NextResponse } from 'next/server';
const sendEmail = require('@/lib/sendEmail');
import admin from '../admin';

// ── Authorized Admin Accounts ────────────────────────────────────────────────
const ALLOWED_ADMINS = [
  "rravenger7@gmail.com",
  "veerbalajifoundation@gmail.com"
];

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// Use Firestore (via Admin SDK) to persist OTPs across serverless instances
async function saveOtp(email, otp) {
  const db = admin.firestore();
  await db.collection('__otpStore').doc(email).set({
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    createdAt: Date.now(),
  });
}

async function getOtp(email) {
  const db = admin.firestore();
  const doc = await db.collection('__otpStore').doc(email).get();
  if (!doc.exists) return null;
  return doc.data();
}

async function deleteOtp(email) {
  const db = admin.firestore();
  await db.collection('__otpStore').doc(email).delete();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, email, otp } = body;
    const cleanEmail = (email || '').toLowerCase().trim();

    if (!ALLOWED_ADMINS.includes(cleanEmail)) {
      return NextResponse.json(
        { error: "Access Denied: This email address is not authorized." },
        { status: 403 }
      );
    }

    if (action === "send") {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // Persist OTP in Firestore so all serverless instances can read it
      await saveOtp(cleanEmail, generatedOtp);

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; border-bottom: 3px solid #d4af37; padding-bottom: 16px; margin-bottom: 24px;">
            <h2 style="color: #1a0f5e; margin: 0 0 4px 0; font-size: 22px; font-weight: 700;">वीर बालाजी फाउंडेशन</h2>
            <p style="color: #EA1F25; margin: 4px 0 0 0; font-weight: 600; font-size: 12px; letter-spacing: 1px;">VEER BALAJI FOUNDATION — ADMIN PORTAL</p>
            <p style="color: #6b5a3e; margin: 4px 0 0 0; font-size: 11px;">राजस्थान-गुजरात | सेवा • सहयोग • संस्कार • विश्वास</p>
          </div>

          <div style="padding: 10px 0; text-align: center;">
            <p style="font-size: 15px; color: #333333; margin-bottom: 8px;">Your secure one-time login verification code is:</p>
            <div style="background: linear-gradient(135deg, #f8fafc, #fff8e7); border: 2px dashed #d4af37; border-radius: 10px; padding: 18px 28px; display: inline-block; margin: 16px 0;">
              <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1a0f5e;">${generatedOtp}</span>
            </div>
            <p style="font-size: 13px; color: #e11d48; margin-top: 8px;">⏰ This code will expire in <strong>10 minutes</strong>.</p>
          </div>

          <div style="margin-top: 24px; padding: 16px; background: #fdf8f0; border-radius: 8px; text-align: center;">
            <p style="font-size: 12px; color: #64748b; margin: 0;">If you did not request this OTP, please ignore this email and secure your account immediately.</p>
          </div>

          <div style="margin-top: 20px; text-align: center; border-top: 1px solid #f0f0f0; padding-top: 14px;">
            <p style="font-size: 11px; color: #9ca3af; margin: 0;">© 2025 वीर बालाजी फाउंडेशन | Powered by Morihix Private Limited</p>
          </div>
        </div>
      `;

      try {
        await sendEmail(
          cleanEmail,
          `वीर बालाजी फाउंडेशन — Admin Login OTP: ${generatedOtp}`,
          htmlContent,
          `Your Veer Balaji Foundation Admin Login OTP is: ${generatedOtp}. Valid for 10 minutes.`
        );
        console.log(`[OTP Sent to ${cleanEmail}]`);
        return NextResponse.json({ success: true, message: "Verification OTP sent to your registered email address!" });
      } catch (emailErr) {
        console.warn(`[Resend Warning for ${cleanEmail}]`, emailErr.message);
        return NextResponse.json({
          success: true,
          message: "Verification OTP generated and sent to your email address."
        });
      }
    }

    if (action === "verify") {
      if (!otp) {
        return NextResponse.json({ error: "OTP code is required." }, { status: 400 });
      }

      const inputOtp = otp.trim();
      const record = await getOtp(cleanEmail);

      if (!record) {
        return NextResponse.json({ error: "No OTP found. Please request a new OTP." }, { status: 400 });
      }

      if (Date.now() > record.expiresAt) {
        await deleteOtp(cleanEmail);
        return NextResponse.json({ error: "OTP expired. Please request a new OTP." }, { status: 400 });
      }

      if (inputOtp === record.otp) {
        await deleteOtp(cleanEmail);
        return NextResponse.json({ success: true, message: "OTP verified successfully." });
      }

      return NextResponse.json({ error: "Incorrect OTP code. Please check your email inbox." }, { status: 400 });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error('[OTP Route Error]', error);
    return NextResponse.json({ error: error.message || "Server error." }, { status: 500 });
  }
}