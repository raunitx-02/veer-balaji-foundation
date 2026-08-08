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

    const fontPath = path.join(process.cwd(), "public/static/font/AnekDevanagari-Bold.ttf");
    try {
      registerFont(fontPath, { family: "AnekDevanagariBold" });
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
      const name         = member?.displayName || member?.name || "";
      const fatherName   = member?.fatherName || "";
      const dob          = member?.bobDate || member?.dob || "";
      const phone        = member?.phone || member?.mobile || "";
      const aadhaar      = member?.aadhaarNo || "";
      const gotra        = member?.gotra || member?.jati || "";
      const address      = member?.currentAddress || member?.address || "";
      const village      = member?.village || "";
      const stateDistrict= [member?.district, member?.state].filter(Boolean).join(", ");
      const guardian     = member?.guardian || "";
      const relation     = member?.guardianRelation || "";
      const agCode       = member?.agentCode || member?.agentId || "";
      const agName       = member?.agentName || member?.agent || "";
      const agentDisplay = agName ? (agCode ? `${agName} (${agCode})` : agName) : agCode;
      const photoURL     = member?.photoURL || null;
      const guardianAadhaar = member?.guardianAadhaar || member?.warisAadhaar || "";
      const noteInfo     = programName;

      // Age calculation
      let ageStr = "";
      if (member?.age) {
        ageStr = `${member.age} वर्ष`;
      } else if (dob) {
        try {
          const parts = dob.split("-");
          if (parts.length === 3) {
            const birthYear = parseInt(parts[2], 10);
            const currentYear = new Date().getFullYear();
            if (birthYear > 1900 && birthYear <= currentYear) {
              ageStr = `${currentYear - birthYear} वर्ष`;
            }
          }
        } catch (e) {}
      }

      const regNoRaw   = member?.registrationNumber || member?.applicationNumber || "0000";
      const regNo      = String(regNoRaw).replace(/\D/g, "").padStart(4, "0").slice(-4);
      const joinDate   = member?.dateJoin || "";

      let dateStrWithSlashes = "";
      if (joinDate) {
        const clean = joinDate.replace(/[^0-9]/g, "");
        if (clean.length === 8) {
          // DD/MM/YYYY format
          dateStrWithSlashes = `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4)}`;
        }
      }

      // 3. Reg boxes (X centers: 75, 136, 203, 265, Y center: 556)
      ctx.font = 'bold 36px "AnekDevanagariBold"';
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const regCenters = [75, 136, 203, 265];
      regNo.split("").forEach((ch, i) => {
        if (regCenters[i]) {
          ctx.fillText(ch, regCenters[i], 556);
        }
      });

      // 4. Date box with slashes: DD / MM / YYYY (X centers: 1565, 1605, 1640, 1675, 1715, 1750, 1785, 1825, 1865, 1905)
      ctx.font = 'bold 32px "AnekDevanagariBold"';
      const calcDateCenters = [1565, 1605, 1640, 1675, 1715, 1750, 1785, 1825, 1865, 1905];
      dateStrWithSlashes.split("").forEach((ch, i) => {
        if (ch.trim() && calcDateCenters[i]) {
          ctx.fillText(ch, calcDateCenters[i], 550);
        }
      });

      // Reset alignment for field text
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      // 5. Member Photo (Inner Frame: X=1612, Y=649, W=312, H=368)
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
            ctx.drawImage(photoImg, 1612, 649, 312, 368);
          }
        } catch (e) {
          console.error("Photo load error:", e.message);
        }
      }

      // 6. Text Overlays (Anek Devanagari 38px Font)
      ctx.fillStyle = "#111111";
      ctx.font = 'bold 38px "AnekDevanagariBold"';

      const payAmountVal = member?.payAmount || member?.paymentAmount || selectedProgram?.payAmount || "";
      const kishtStr = payAmountVal ? `${payAmountVal}` : "";

      // Left Column
      ctx.fillText(name,       220, 650);
      ctx.fillText(fatherName, 485, 710);
      ctx.fillText(phone,      330, 778);
      ctx.fillText(guardian,   280, 848);
      ctx.fillText(gotra,      190, 913);
      ctx.fillText(village,    170, 978);
      ctx.fillText(kishtStr,   180, 1043);
      ctx.fillText(noteInfo,   290, 1108);

      // Middle Column
      ctx.fillText(dob,             1150, 634);
      ctx.fillText(aadhaar,         1140, 698);
      ctx.fillText(ageStr,          1020, 757);
      ctx.fillText(guardianAadhaar, 1260, 807);
      ctx.fillText(relation,        1040, 868);
      ctx.fillText(village,         1220, 933);
      ctx.fillText(stateDistrict,   1200, 998);
      ctx.fillText(agCode,          1150, 1063);

      // 7. Worker Signature Area (Above कार्यकर्ता)
      if (agentDisplay) {
        ctx.fillText(agentDisplay, 120, 1260);
      }

      // Convert composite canvas to PNG Buffer
      const p1PngBuffer = canvas.toBuffer("image/png");

      // PAGE 1 ONLY — 100% Exact Canva background + dynamic text overlay
      doc.addPage({ size: [841.89, 595.28], margin: 0 });
      doc.image(p1PngBuffer, 0, 0, { width: 841.89, height: 595.28 });
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
