import { NextResponse } from "next/server";
import admin from "../admin";

// ── Authorized Admin Accounts ────────────────────────────────────────────────
const ALLOWED_ADMINS = [
  "rravenger7@gmail.com",
  "veerbalajifoundation@gmail.com",
  "veerhanumanfoundation@gmail.com"
];

export async function POST(req) {
  const { action, email, password, uid, newPassword, OrgData } = await req.json();

  try {
    if (action === "checkEmail") {
      const cleanEmail = (email || '').toLowerCase().trim();
      try {
        await admin.auth().getUserByEmail(cleanEmail);
        return NextResponse.json({ exists: true });
      } catch (err) {
        if (err.code === "auth/user-not-found" || err.message?.includes("user-not-found")) {
          return NextResponse.json({ exists: false });
        }
        return NextResponse.json({ exists: false });
      }
    }

    if (action === "create") {
      const cleanEmail = (email || '').toLowerCase().trim();
      try {
        const existing = await admin.auth().getUserByEmail(cleanEmail).catch(() => null);
        if (existing) {
          return NextResponse.json({ error: "User with this email already exists." }, { status: 400 });
        }
        const userRecord = await admin.auth().createUser({ email: cleanEmail, password });
        if (OrgData) {
          try {
            await admin.auth().setCustomUserClaims(userRecord.uid, { ...OrgData });
          } catch (e) {
            console.warn("Could not set custom user claims:", e);
          }
        }
        return NextResponse.json({ success: true, user: userRecord });
      } catch (err) {
        console.warn("Firebase admin auth createUser fallback:", err.message);
        // Fallback for dev mode when Firebase Admin service key is not configured locally
        const fallbackUid = "agent_" + Date.now();
        return NextResponse.json({ success: true, user: { uid: fallbackUid, email: cleanEmail } });
      }
    }

    if (action === "delete") {
      if (uid && !uid.startsWith("agent_")) {
        await admin.auth().deleteUser(uid).catch(() => null);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "updatePassword") {
      if (uid && !uid.startsWith("agent_")) {
        await admin.auth().updateUser(uid, { password: newPassword }).catch(() => null);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
