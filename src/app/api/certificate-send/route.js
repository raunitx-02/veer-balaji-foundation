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

// ─── Coordinate helpers ─────────────────────────────────────────────────────
// Template images: 2000 × 1414 px  |  PDF page: 595.28 × 420.94 pt (A4 landscape)
const IMG_W = 2000;
const IMG_H = 1414;
const PDF_W = 595.28;
const PDF_H = 420.94;

const px = (x) => (x / IMG_W) * PDF_W;   // image pixel X → PDF point
const py = (y) => (y / IMG_H) * PDF_H;   // image pixel Y → PDF point
const pf = (f) => f * (PDF_W / IMG_W);   // image pixel size → PDF pt font size

// ─── Draw one member's data on top of template image ───────────────────────
async function drawMemberPage(doc, templatePath, member, agentCode) {
  // Full-page background template
  doc.image(templatePath, 0, 0, { width: PDF_W, height: PDF_H });

  const fontBold = path.join(process.cwd(), "public/static/font/NotoSansDevanagari-Bold.ttf");
  const fontReg  = path.join(process.cwd(), "public/static/font/NotoSansDevanagari.ttf");
  doc.registerFont("NSD",      fontReg);
  doc.registerFont("NSD-Bold", fontBold);

  // ── Extract member fields (exact Firestore field names) ─────────────────
  const name       = member?.displayName         || member?.name    || "";
  const fatherName = member?.fatherName          || "";
  const dob        = member?.bobDate             || member?.dob     || "";
  const phone      = member?.phone               || member?.mobile  || "";
  const aadhaar    = member?.aadhaarNo           || "";
  const gotra      = member?.gotra               || member?.jati    || "";
  const address    = member?.currentAddress      || member?.address || "";
  const village    = member?.village             || "";
  const fullAddr   = [address, village].filter(Boolean).join(", ");
  const guardian   = member?.guardian            || "";
  const relation   = member?.guardianRelation    || "";
  const agCode     = agentCode || member?.agentCode || member?.agentId || "";
  const photoURL   = member?.photoURL            || null;

  const regNoRaw   = member?.registrationNumber || member?.applicationNumber || "0000";
  const regNo      = String(regNoRaw).replace(/\D/g, "").padStart(4, "0").slice(-4);
  const joinDate   = member?.dateJoin || "";

  // Parse joinDate "DD-MM-YYYY" → "DDMMYYYY"
  let dateStr = "        ";
  if (joinDate) {
    const clean = joinDate.replace(/[^0-9]/g, "");
    if (clean.length === 8) dateStr = clean;
  }

  // ── Reg-number boxes (top-left): pixel origin x=50, y=468; box 44×62 px ──
  const boxY   = py(468);
  const boxH   = py(62);
  const boxW   = px(44);
  const boxGap = px(4);

  regNo.split("").forEach((ch, i) => {
    const bx = px(50) + i * (boxW + boxGap);
    doc.rect(bx, boxY, boxW, boxH).stroke("#8B0000");
    doc.font("NSD-Bold").fontSize(pf(30)).fillColor("#000000")
       .text(ch, bx, boxY + py(10), { width: boxW, align: "center" });
  });

  // ── Date boxes (top-right): pixel origin x=1592, y=468; box 36×62 px ────
  const dBoxW  = px(36);
  const dBoxGap = px(4);
  dateStr.split("").forEach((ch, i) => {
    const bx = px(1592) + i * (dBoxW + dBoxGap);
    doc.rect(bx, boxY, dBoxW, boxH).stroke("#8B0000");
    doc.font("NSD-Bold").fontSize(pf(26)).fillColor("#000000")
       .text(ch.trim(), bx, boxY + py(12), { width: dBoxW, align: "center" });
  });

  // ── Text overlays — calibrated pixel positions ───────────────────────────
  // Left column (value starts after label, on the dotted line):
  //   नाम         y ≈ 626 px
  //   जन्म तिथि  y ≈ 692 px
  //   मोबाइल न.  y ≈ 758 px
  //   पता         y ≈ 822 px
  //   वारिसदार   y ≈ 886 px
  //   एजेंट कोड  y ≈ 952 px
  //
  // Right column:
  //   पिता का नाम  y ≈ 626 px, x=1090
  //   गौत्र         y ≈ 692 px, x=1090
  //   आधार संख्या  y ≈ 758 px, x=1090
  //   सम्बन्ध      y ≈ 886 px, x=1090

  const FS = pf(38);       // main font size
  const FS_SMALL = pf(33); // for address (wider text)

  doc.font("NSD-Bold").fontSize(FS).fillColor("#111111");

  // Left column
  doc.text(name,     px(300), py(626), { lineBreak: false });
  doc.text(dob,      px(300), py(692), { lineBreak: false });
  doc.text(phone,    px(300), py(758), { lineBreak: false });

  doc.font("NSD-Bold").fontSize(FS_SMALL).fillColor("#111111");
  doc.text(fullAddr, px(120), py(822), { width: px(1510), lineBreak: false });

  doc.font("NSD-Bold").fontSize(FS).fillColor("#111111");
  doc.text(guardian, px(250), py(886), { lineBreak: false });
  doc.text(agCode,   px(248), py(952), { lineBreak: false });

  // Right column
  doc.text(fatherName, px(1090), py(626), { width: px(520), lineBreak: false });
  doc.text(gotra,      px(1090), py(692), { lineBreak: false });
  doc.text(aadhaar,    px(1090), py(758), { lineBreak: false });
  doc.text(relation,   px(1090), py(886), { lineBreak: false });

  // ── Member photo (far-right box) ─────────────────────────────────────────
  // Photo placeholder box: pixel x=1682–1930, y=570–898
  if (photoURL) {
    try {
      let photoBuffer;
      if (photoURL.startsWith("http")) {
        const res = await fetch(photoURL);
        if (res.ok) photoBuffer = Buffer.from(await res.arrayBuffer());
      } else if (photoURL.startsWith("data:")) {
        photoBuffer = Buffer.from(photoURL.split(",")[1], "base64");
      }
      if (photoBuffer) {
        doc.image(photoBuffer, px(1685), py(575), {
          width:  px(242),
          height: py(318),
          fit:    [px(242), py(318)],
          align:  "center",
          valign: "center",
        });
      }
    } catch (e) {
      console.error("Photo load error:", e.message);
    }
  }
}

// ─── POST handler ───────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const { memberData, selectedProgram } = await req.json();

    const PDFDocument = (await import("pdfkit")).default;

    const members = Array.isArray(memberData) ? memberData : [memberData];

    // Pick template set by program name
    const programName =
      selectedProgram?.name ||
      selectedProgram?.hiname ||
      members[0]?.programName ||
      "";

    let p1File, p2File;
    if (programName.includes("मायरा") || selectedProgram?.isMamera) {
      p1File = "mayra_p1.png";
      p2File = "mayra_p2.png";
    } else if (programName.includes("विवाह") || selectedProgram?.isVivah) {
      p1File = "vivah_p1.png";
      p2File = "vivah_p2.png";
    } else {
      // Default → सुरक्षा सहयोग
      p1File = "suraksha_p1.png";
      p2File = "suraksha_p2.png";
    }

    const certDir = path.join(process.cwd(), "public/certificates");
    const tmpl1   = path.join(certDir, p1File);
    const tmpl2   = path.join(certDir, p2File);

    if (!fs.existsSync(tmpl1) || !fs.existsSync(tmpl2)) {
      return NextResponse.json(
        { error: `Template not found: ${p1File}` },
        { status: 500, headers: corsHeaders }
      );
    }

    const doc = new PDFDocument({
      size: [PDF_W, PDF_H],
      autoFirstPage: false,
      margin: 0,
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    const pdfDone = new Promise((resolve, reject) => {
      doc.on("end", resolve);
      doc.on("error", reject);
    });

    for (const member of members) {
      const agentCode = member?.agentCode || "";

      // Page 1 — certificate data page
      doc.addPage({ size: [PDF_W, PDF_H], margin: 0 });
      await drawMemberPage(doc, tmpl1, member, agentCode);

      // Page 2 — terms & conditions (static image only)
      doc.addPage({ size: [PDF_W, PDF_H], margin: 0 });
      doc.image(tmpl2, 0, 0, { width: PDF_W, height: PDF_H });
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
