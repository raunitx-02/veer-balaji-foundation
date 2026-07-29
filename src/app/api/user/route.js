import { NextResponse } from "next/server";
import admin from "../admin";

const ALLOWED_ADMIN_EMAIL = "veerhanumanfoundation@gmail.com";

export async function POST(req) {
  const { action, email, password, uid, newPassword, OrgData } = await req.json();

  try {
    if (action === "checkEmail") {
      const cleanEmail = (email || '').toLowerCase().trim();
      if (cleanEmail !== ALLOWED_ADMIN_EMAIL) {
        return NextResponse.json({ 
          exists: false, 
          error: "Access Denied: Only authorized email (veerhanumanfoundation@gmail.com) is permitted to access this panel." 
        }, { status: 403 });
      }
      return NextResponse.json({ exists: true });
    }

    if (action === "create") {
      try {
        await admin.auth().getUserByEmail(email);
        return NextResponse.json({ error: "User with this email already exists." }, { status: 400 });
      } catch (err) {
        if (err.code !== "auth/user-not-found") {
          return NextResponse.json({ error: err.message }, { status: 500 });
        }
      }

      const userRecord = await admin.auth().createUser({ email, password });
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        ...OrgData
      });

      return NextResponse.json({ success: true, user: userRecord });
    }

    if (action === "delete") {
      await admin.auth().deleteUser(uid);
      return NextResponse.json({ success: true });
    }

    if (action === "updatePassword") {
      await admin.auth().updateUser(uid, { password: newPassword });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
