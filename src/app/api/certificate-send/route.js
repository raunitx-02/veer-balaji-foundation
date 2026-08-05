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

// Place text at an ABSOLUTE position on the page (bypasses pdfkit cursor)
function absText(doc, text, x, y, opts = {}) {
  doc.text(text || "", x, y, {
    lineBreak: false,
    ...opts,
  });
  // Reset cursor back to (0,0) so next call doesn't accumulate Y
  doc.moveTo(0, 0);
}

// Draw a single character box (for reg# and date grids)
function drawBox(doc, ch, x, y, w, h) {
  doc.save();
  doc.rect(x, y, w, h).stroke("#8B0000");
  if (ch && ch.trim()) {
    doc.text(ch, x, y + (h - doc._fontSize) / 2, {
      width: w,
      align: "center",
      lineBreak: false,
    });
  }
  doc.restore();
  doc.moveTo(0, 0);
}

// ─── Draw one member certificate page ──────────────────────────────────────
async function drawMemberPage(doc, templatePath, member, agentCode) {
  // ── Step 1: Draw ALL text and boxes FIRST (so cursor issues don't matter) ──
  const fontBold = path.join(process.cwd(), "public/static/font/NotoSansDevanagari-Bold.ttf");
  const fontReg  = path.join(process.cwd(), "public/static/font/NotoSansDevanagari.ttf");
  doc.registerFont("NSD",      fontReg);
  doc.registerFont("NSD-Bold", fontBold);

  // ── Extract member fields ─────────────────────────────────────────────────
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

  let dateStr = "        ";
  if (joinDate) {
    const clean = joinDate.replace(/[^0-9]/g, "");
    if (clean.length === 8) dateStr = clean;
  }

  // ── Step 2: Draw member photo FIRST (before background covers nothing) ────
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
        // Photo box: pixel x=1685-1927, y=575-893 → PDF coords
        doc.image(photoBuffer, px(1685), py(575), {
          width:  px(242),
          height: py(318),
          fit:    [px(242), py(318)],
          align:  "center",
          valign: "center",
        });
        // Reset cursor after image
        doc.moveTo(0, 0);
      }
    } catch (e) {
      console.error("Photo load error:", e.message);
    }
  }

  // ── Step 3: Reg number boxes (top-left of page) ───────────────────────────
  // Pixel coords: x=50, y=468, each box 44×62px, gap 4px
  const boxY   = py(468);
  const boxH   = py(62);
  const boxW   = px(44);
  const boxGap = px(4);

  doc.font("NSD-Bold").fontSize(pf(30)).fillColor("#000000");
  regNo.split("").forEach((ch, i) => {
    const bx = px(50) + i * (boxW + boxGap);
    drawBox(doc, ch, bx, boxY, boxW, boxH);
  });

  // ── Step 4: Date boxes (top-right) ───────────────────────────────────────
  // Pixel coords: x=1592, y=468, each box 36×62px, gap 4px
  const dBoxW  = px(36);
  const dBoxGap = px(4);

  doc.font("NSD-Bold").fontSize(pf(26)).fillColor("#000000");
  dateStr.split("").forEach((ch, i) => {
    const bx = px(1592) + i * (dBoxW + dBoxGap);
    drawBox(doc, ch.trim(), bx, boxY, dBoxW, boxH);
  });

  // ── Step 5: Member data text overlays ────────────────────────────────────
  const FS       = pf(38);
  const FS_SMALL = pf(33);

  doc.font("NSD-Bold").fontSize(FS).fillColor("#111111");

  // Left column (after label, on dotted line):
  // नाम y≈626, जन्म तिथि y≈692, मोबाइल y≈758, पता y≈822, वारिसदार y≈886, एजेंट कोड y≈952
  absText(doc, name,     px(300), py(626));
  absText(doc, dob,      px(300), py(692));
  absText(doc, phone,    px(300), py(758));

  doc.font("NSD-Bold").fontSize(FS_SMALL).fillColor("#111111");
  absText(doc, fullAddr, px(120), py(822), { width: px(1510) });

  doc.font("NSD-Bold").fontSize(FS).fillColor("#111111");
  absText(doc, guardian, px(250), py(886));
  absText(doc, agCode,   px(248), py(952));

  // Right column:
  // पिता का नाम x=1090 y≈626, गौत्र y≈692, आधार y≈758, सम्बन्ध y≈886
  absText(doc, fatherName, px(1090), py(626), { width: px(520) });
  absText(doc, gotra,      px(1090), py(692));
  absText(doc, aadhaar,    px(1090), py(758));
  absText(doc, relation,   px(1090), py(886));

  // ── Step 6: Draw background template image LAST (on top as background) ───
  // NOTE: We draw it at z=0 BEHIND everything by using pdfkit's page content
  // Actually in PDF, content drawn LATER appears ON TOP.
  // So we draw background FIRST and text AFTER — but cursor was the bug.
  // REAL FIX: We draw the background image now, using page.content stream trick:
  // Draw bg at exact 0,0 without moving cursor using doc.image with explicit x,y
  // and then the TEXT we drew above is already in the stream (it'll show on top).
  // 
  // ACTUALLY the issue is reversed: image drawn LAST covers text.
  // Correct order: image FIRST (background), then text on top.
  // But image moves cursor → text overflows to next page.
  //
  // SOLUTION: Reset cursor manually to top of page after image.
  // pdfkit doesn't expose direct cursor reset, but we can use:
  //   doc.y = 0; doc.x = doc.page.margins.left;
  // But the text was already drawn above BEFORE the background image,
  // so now we just need to insert the background image into the page BEFORE
  // the text in the PDF stream.
  //
  // The ACTUAL CORRECT approach: use doc.image BEFORE text, then manually
  // reset doc.y and doc.x after image call.
}

// ─── POST handler ───────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const { memberData, selectedProgram } = await req.json();

    const PDFDocument = (await import("pdfkit")).default;

    const members = Array.isArray(memberData) ? memberData : [memberData];

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

    const fontBold = path.join(process.cwd(), "public/static/font/NotoSansDevanagari-Bold.ttf");
    const fontReg  = path.join(process.cwd(), "public/static/font/NotoSansDevanagari.ttf");

    const doc = new PDFDocument({
      size: [PDF_W, PDF_H],
      autoFirstPage: false,
      margin: 0,
      bufferPages: true,
    });

    doc.registerFont("NSD",      fontReg);
    doc.registerFont("NSD-Bold", fontBold);

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    const pdfDone = new Promise((resolve, reject) => {
      doc.on("end", resolve);
      doc.on("error", reject);
    });

    for (const member of members) {
      const agentCode = member?.agentCode || "";

      // ── PAGE 1: Certificate data ──────────────────────────────────────────
      doc.addPage({ size: [PDF_W, PDF_H], margin: 0 });

      // Draw background template image first
      doc.image(tmpl1, 0, 0, { width: PDF_W, height: PDF_H });

      // CRITICAL FIX: Reset pdfkit's internal cursor to top-left after image
      // Without this, all subsequent text() calls flow to a new page
      doc.y = 0;
      doc.x = 0;

      // ── Member fields ─────────────────────────────────────────────────────
      const name       = member?.displayName      || "";
      const fatherName = member?.fatherName       || "";
      const dob        = member?.bobDate          || "";
      const phone      = member?.phone            || "";
      const aadhaar    = member?.aadhaarNo        || "";
      const gotra      = member?.gotra            || member?.jati || "";
      const address    = member?.currentAddress   || "";
      const village    = member?.village          || "";
      const fullAddr   = [address, village].filter(Boolean).join(", ");
      const guardian   = member?.guardian         || "";
      const relation   = member?.guardianRelation || "";
      const agCode     = agentCode || member?.agentCode || "";
      const photoURL   = member?.photoURL         || null;

      const regNoRaw   = member?.registrationNumber || member?.applicationNumber || "0000";
      const regNo      = String(regNoRaw).replace(/\D/g, "").padStart(4, "0").slice(-4);
      const joinDate   = member?.dateJoin || "";

      let dateStr = "        ";
      if (joinDate) {
        const clean = joinDate.replace(/[^0-9]/g, "");
        if (clean.length === 8) dateStr = clean;
      }

      // ── Reg number boxes ──────────────────────────────────────────────────
      const boxY   = py(468);
      const boxH   = py(62);
      const boxW   = px(44);
      const boxGap = px(4);

      doc.font("NSD-Bold").fontSize(pf(30)).fillColor("#000000");
      regNo.split("").forEach((ch, i) => {
        const bx = px(50) + i * (boxW + boxGap);
        doc.rect(bx, boxY, boxW, boxH).stroke("#8B0000");
        doc.text(ch, bx, boxY + py(10), { width: boxW, align: "center", lineBreak: false });
        doc.y = 0; doc.x = 0; // reset cursor after every text call
      });

      // ── Date boxes ────────────────────────────────────────────────────────
      const dBoxW  = px(36);
      const dBoxGap = px(4);

      doc.font("NSD-Bold").fontSize(pf(26)).fillColor("#000000");
      dateStr.split("").forEach((ch, i) => {
        const bx = px(1592) + i * (dBoxW + dBoxGap);
        doc.rect(bx, boxY, dBoxW, boxH).stroke("#8B0000");
        if (ch.trim()) {
          doc.text(ch, bx, boxY + py(12), { width: dBoxW, align: "center", lineBreak: false });
          doc.y = 0; doc.x = 0;
        }
      });

      // ── Text fields ───────────────────────────────────────────────────────
      const FS = pf(38);
      const FS_SMALL = pf(33);

      // Left column
      doc.font("NSD-Bold").fontSize(FS).fillColor("#111111");
      doc.text(name,     px(300), py(596), { lineBreak: false }); doc.y = 0; doc.x = 0;
      doc.text(dob,      px(300), py(660), { lineBreak: false }); doc.y = 0; doc.x = 0;
      doc.text(phone,    px(300), py(726), { lineBreak: false }); doc.y = 0; doc.x = 0;
      doc.font("NSD-Bold").fontSize(FS_SMALL).fillColor("#111111");
      doc.text(fullAddr, px(120), py(796), { width: px(1510), lineBreak: false }); doc.y = 0; doc.x = 0;
      doc.font("NSD-Bold").fontSize(FS).fillColor("#111111");
      doc.text(guardian, px(250), py(860), { lineBreak: false }); doc.y = 0; doc.x = 0;
      doc.text(agCode,   px(248), py(926), { lineBreak: false }); doc.y = 0; doc.x = 0;

      // Right column
      doc.text(fatherName, px(1090), py(596), { width: px(520), lineBreak: false }); doc.y = 0; doc.x = 0;
      doc.text(gotra,      px(1090), py(660), { lineBreak: false }); doc.y = 0; doc.x = 0;
      doc.text(aadhaar,    px(1090), py(726), { lineBreak: false }); doc.y = 0; doc.x = 0;
      doc.text(relation,   px(1090), py(860), { lineBreak: false }); doc.y = 0; doc.x = 0;

      // ── Member photo ──────────────────────────────────────────────────────
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
            doc.y = 0; doc.x = 0;
          }
        } catch (e) {
          console.error("Photo error:", e.message);
        }
      }

      // ── PAGE 2: Terms & Conditions (static image only) ───────────────────
      doc.addPage({ size: [PDF_W, PDF_H], margin: 0 });
      doc.image(tmpl2, 0, 0, { width: PDF_W, height: PDF_H });
      doc.y = 0; doc.x = 0;
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
