import { NextResponse } from "next/server";
import admin from "../admin";

export async function POST(req) {
  const { secret, email, password, displayName } = await req.json();

  // Simple secret check so random people can't use this
  if (secret !== "veer-hanuman-init-2025") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let uid;
    try {
      const user = await admin.auth().createUser({ email, password, displayName });
      uid = user.uid;
    } catch (err) {
      if (err.code === "auth/email-already-exists") {
        const existing = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(existing.uid, { password, displayName });
        uid = existing.uid;
      } else {
        throw err;
      }
    }
    return NextResponse.json({ success: true, uid });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
