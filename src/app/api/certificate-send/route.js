import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { memberData, selectedProgram } = body;

    const { createCanvas, loadImage, registerFont } = await import("canvas");
    const PDFDocument = (await import("pdfkit")).default;

    const members = Array.isArray(memberData) ? memberData : (memberData ? [memberData] : []);

    if (members.length === 0) {
      return NextResponse.json(
        { error: "No member data provided" },
        { status: 400, headers: corsHeaders }
      );
    }

    const fontPath = path.join(process.cwd(), "public/static/font/NotoSansDevanagari-Bold.ttf");
    try {
      registerFont(fontPath, { family: "NSDBold" });
    } catch (e) {
      // Font may already be registered across requests
    }

    const certDir = path.join(process.cwd(), "public/certificates");

    const chunks = [];
    const doc = new PDFDocument({
      size: [841.89, 595.28],
      autoFirstPage: false,
      margin: 0,
      font: fontPath,
    });

    doc.on("data", (chunk) => chunks.push(chunk));
    const pdfDone = new Promise((resolve, reject) => {
      doc.on("end", resolve);
      doc.on("error", reject);
    });

    for (const member of members) {
      // Determine program files
      const programName =
        selectedProgram?.name ||
        selectedProgram?.hiname ||
        member?.programName ||
        "";

      let p1File = "suraksha_p1.png";
      let p2File = "suraksha_p2.png";

      if (programName.includes("मायरा") || selectedProgram?.isMamera) {
        p1File = "mayra_p1.png";
        p2File = "mayra_p2.png";
      } else if (programName.includes("विवाह") || selectedProgram?.isVivah) {
        p1File = "vivah_p1.png";
        p2File = "vivah_p2.png";
      }

      const bg1Path = path.join(certDir, p1File);
      const bg2Path = path.join(certDir, p2File);

      // Create 2000x1414 canvas for 100% exact background composition
      const canvas = createCanvas(2000, 1414);
      const ctx = canvas.getContext("2d");

      // 1. Draw Canva background PNG
      const bg1 = await loadImage(bg1Path);
      ctx.drawImage(bg1, 0, 0, 2000, 1414);

      // 2. Extract fields
      const name       = member?.displayName || member?.name || "";
      const fatherName = member?.fatherName || "";
      const dob        = member?.bobDate || member?.dob || "";
      const phone      = member?.phone || member?.mobile || "";
      const aadhaar    = member?.aadhaarNo || "";
      const gotra      = member?.gotra || member?.jati || "";
      const address    = member?.currentAddress || member?.address || "";
      const village    = member?.village || "";
      const fullAddr   = [address, village].filter(Boolean).join(", ");
      const guardian   = member?.guardian || "";
      const relation   = member?.guardianRelation || "";
      const agCode     = member?.agentCode || member?.agentId || "";
      const photoURL   = member?.photoURL || null;

      const regNoRaw   = member?.registrationNumber || member?.applicationNumber || "0000";
      const regNo      = String(regNoRaw).replace(/\D/g, "").padStart(4, "0").slice(-4);
      const joinDate   = member?.dateJoin || "";

      let dateStr = "        ";
      if (joinDate) {
        const clean = joinDate.replace(/[^0-9]/g, "");
        if (clean.length === 8) dateStr = clean;
      }

      // 3. Reg boxes (top left: 50, 446)
      ctx.font = 'bold 30px "NSDBold"';
      ctx.fillStyle = "#000000";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      regNo.split("").forEach((ch, i) => {
        const x = 50 + i * (44 + 4) + 14;
        ctx.fillText(ch, x, 446);
      });

      // 4. Date boxes (top right: 1592, 448)
      dateStr.split("").forEach((ch, i) => {
        const x = 1592 + i * (36 + 4) + 10;
        if (ch.trim()) ctx.fillText(ch, x, 448);
      });

      // 5. Member Photo
      if (photoURL) {
        try {
          let photoImg;
          if (photoURL.startsWith("http")) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3000);
            const res = await fetch(photoURL, { signal: controller.signal });
            clearTimeout(timer);
            if (res.ok) {
              const buf = Buffer.from(await res.arrayBuffer());
              photoImg = await loadImage(buf);
            }
          } else if (photoURL.startsWith("data:")) {
            photoImg = await loadImage(photoURL);
          }

          if (photoImg) {
            ctx.drawImage(photoImg, 1630, 575, 290, 318);
          }
        } catch (e) {
          console.error("Photo load error:", e.message);
        }
      }

      // 6. Text Overlays (Exact fit for Canva dotted lines)
      ctx.fillStyle = "#111111";

      ctx.font = 'bold 35px "NSDBold"';
      ctx.fillText(name,       200, 490);
      ctx.fillText(dob,        290, 556);
      ctx.fillText(phone,      290, 622);

      ctx.font = 'bold 30px "NSDBold"';
      ctx.fillText(fullAddr,   150, 688);

      ctx.font = 'bold 35px "NSDBold"';
      ctx.fillText(guardian,   270, 754);
      ctx.fillText(agCode,     270, 820);

      // Right column
      ctx.fillText(fatherName, 1140, 490);
      ctx.fillText(gotra,      990,  556);
      ctx.fillText(aadhaar,    1140, 622);
      ctx.fillText(relation,   1030, 754);

      // Convert composite canvas to PNG Buffer
      const p1PngBuffer = canvas.toBuffer("image/png");

      // PAGE 1 — 100% Exact Canva background + dynamic text overlay
      doc.addPage({ size: [841.89, 595.28], margin: 0 });
      doc.image(p1PngBuffer, 0, 0, { width: 841.89, height: 595.28 });

      // PAGE 2 — 100% Exact Canva Terms & Conditions background
      doc.addPage({ size: [841.89, 595.28], margin: 0 });
      doc.image(bg2Path, 0, 0, { width: 841.89, height: 595.28 });
    }

    doc.end();
    await pdfDone;

    const pdfBuffer = Buffer.concat(chunks);
    return NextResponse.json(
      { base64: pdfBuffer.toString("base64") },
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF: " + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
