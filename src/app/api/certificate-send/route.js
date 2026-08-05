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

// ─── Page constants ─────────────────────────────────────────────────────────
const W = 841.89;   // A4 Landscape width  (pt)
const H = 595.28;   // A4 Landscape height (pt)

// Colors
const CREAM   = "#FDF5E4";
const MAROON  = "#8B0000";
const GOLD    = "#C8922A";
const BLACK   = "#1A1A1A";
const WHITE   = "#FFFFFF";

// ─── Helpers ────────────────────────────────────────────────────────────────
// Absolutely position text without moving pdfkit's internal cursor
function t(doc, text, x, y, opts = {}) {
  if (!text && text !== 0) return;
  doc.text(String(text), x, y, { lineBreak: false, ...opts });
  doc.y = 0;
  doc.x = 0;
}

// Dotted line from x1 to x2 at y
function dottedLine(doc, x1, y, x2) {
  doc.save();
  doc.moveTo(x1, y).lineTo(x2, y).lineWidth(0.5).dash(1.5, { space: 2 }).stroke(MAROON);
  doc.restore();
  doc.y = 0; doc.x = 0;
}

// ─── Draw certificate page (all in code) ────────────────────────────────────
async function drawCertificatePage(doc, member, agentCode, schemeType) {

  // ══════════════════════════════════════════════════════════════════════════
  // 1. BACKGROUND
  // ══════════════════════════════════════════════════════════════════════════
  doc.rect(0, 0, W, H).fill(CREAM);
  doc.y = 0; doc.x = 0;

  // Outer border — thick maroon
  doc.rect(4, 4, W - 8, H - 8).lineWidth(3).stroke(MAROON);
  doc.y = 0; doc.x = 0;

  // Inner border — thin gold
  doc.rect(8, 8, W - 16, H - 16).lineWidth(1).stroke(GOLD);
  doc.y = 0; doc.x = 0;

  // ══════════════════════════════════════════════════════════════════════════
  // 2. HEADER BLOCK  (y: 10 → 165)
  // ══════════════════════════════════════════════════════════════════════════
  // Header background
  doc.rect(9, 9, W - 18, 158).fill("#F8EDD5");
  doc.y = 0; doc.x = 0;

  // Header border bottom
  doc.moveTo(9, 167).lineTo(W - 9, 167).lineWidth(2).stroke(MAROON);
  doc.y = 0; doc.x = 0;

  // Logo
  const logoPath = path.join(process.cwd(), "public/veer-balaji-logo.png");
  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 14, 13, { width: 145, height: 145 });
      doc.y = 0; doc.x = 0;
    } catch (e) {
      console.error("Logo draw error:", e.message);
    }
  }

  // Main title
  doc.font("NSD-Bold").fontSize(46).fillColor(MAROON);
  t(doc, "वीर बालाजी फाऊंडेशन", 170, 18, { width: W - 230, align: "center" });

  // Address
  doc.font("NSD-Bold").fontSize(13).fillColor(BLACK);
  t(doc, "कार्यालय पता : रबारियो का टाँका, बालोतरा (राजस्थान) 344022", 170, 82, {
    width: W - 230, align: "center",
  });

  // Contact
  doc.font("NSD-Bold").fontSize(13).fillColor(MAROON);
  t(doc, "सम्पर्क सूत्र : कार्यालय न.  96062628028, 9413745183", 170, 106, {
    width: W - 230, align: "center",
  });

  // Registration
  doc.font("NSD-Bold").fontSize(12).fillColor(BLACK);
  t(doc, "रजिस्ट्रेशन नंबर :- U88900RJ2026NPL115309", 170, 130, {
    width: W - 230, align: "center",
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 3. SCHEME STRIP  (y: 168 → 215)
  // ══════════════════════════════════════════════════════════════════════════

  // ── "सदस्यता क्रमांक" (left) ──
  doc.font("NSD-Bold").fontSize(9).fillColor(MAROON);
  t(doc, "सदस्यता क्रमांक", 14, 172);

  // 4 reg-number boxes
  const regNo = String(
    member?.registrationNumber || member?.applicationNumber || "0000"
  ).replace(/\D/g, "").padStart(4, "0").slice(-4);

  const bX = 14, bY = 184, bW = 24, bH = 22, bG = 3;
  regNo.split("").forEach((ch, i) => {
    const x = bX + i * (bW + bG);
    doc.rect(x, bY, bW, bH).lineWidth(0.8).stroke(MAROON);
    doc.y = 0; doc.x = 0;
    doc.font("NSD-Bold").fontSize(12).fillColor(BLACK);
    t(doc, ch, x, bY + 5, { width: bW, align: "center" });
  });

  // ── Scheme Badge (center) ──
  const BADGE_W = 260, BADGE_H = 40;
  const BADGE_X = (W - BADGE_W) / 2;
  const BADGE_Y = 172;

  let badgeFill = "#2C2C2C";         // suraksha — dark
  let badgeBorder = GOLD;
  let schemeName = "सुरक्षा सहयोग योजना";

  if (schemeType === "vivah") {
    badgeFill   = "#7B3F00";          // dark brown/maroon
    badgeBorder = "#FFD700";
    schemeName  = "पुत्र-पुत्री विवाह योजना";
  } else if (schemeType === "mayra") {
    badgeFill   = "#8B0057";          // deep magenta
    badgeBorder = "#FFD700";
    schemeName  = "मायरा योजना";
  }

  // Badge outer (fill)
  doc.roundedRect(BADGE_X, BADGE_Y, BADGE_W, BADGE_H, 6).fill(badgeFill);
  doc.y = 0; doc.x = 0;
  // Badge border (gold)
  doc.roundedRect(BADGE_X + 2, BADGE_Y + 2, BADGE_W - 4, BADGE_H - 4, 5)
     .lineWidth(1.2).stroke(badgeBorder);
  doc.y = 0; doc.x = 0;
  // Badge dots on sides
  doc.circle(BADGE_X + 12, BADGE_Y + BADGE_H / 2, 4).fill(badgeBorder);
  doc.y = 0; doc.x = 0;
  doc.circle(BADGE_X + BADGE_W - 12, BADGE_Y + BADGE_H / 2, 4).fill(badgeBorder);
  doc.y = 0; doc.x = 0;

  doc.font("NSD-Bold").fontSize(17).fillColor("#FFD700");
  t(doc, schemeName, BADGE_X, BADGE_Y + 10, { width: BADGE_W, align: "center" });

  // ── "दिनांक" (right) ──
  doc.font("NSD-Bold").fontSize(9).fillColor(MAROON);
  t(doc, "दिनांक", W - 160, 172);

  // 8 date boxes (DD-MM-YYYY stored as DDMMYYYY)
  const joinDate = member?.dateJoin || "";
  let dateStr = "        ";
  if (joinDate) {
    const clean = joinDate.replace(/[^0-9]/g, "");
    if (clean.length === 8) dateStr = clean;
  }
  const dBX = W - 160, dBY = 184, dBW = 16, dBH = 22, dBG = 2;
  dateStr.split("").forEach((ch, i) => {
    const x = dBX + i * (dBW + dBG);
    doc.rect(x, dBY, dBW, dBH).lineWidth(0.8).stroke(MAROON);
    doc.y = 0; doc.x = 0;
    if (ch.trim()) {
      doc.font("NSD-Bold").fontSize(10).fillColor(BLACK);
      t(doc, ch, x, dBY + 5, { width: dBW, align: "center" });
    }
  });

  // Separator after scheme strip
  doc.moveTo(9, 214).lineTo(W - 9, 214).lineWidth(0.8).stroke(GOLD);
  doc.y = 0; doc.x = 0;

  // ══════════════════════════════════════════════════════════════════════════
  // 4. FIELDS SECTION  (y: 218 → 490)
  // ══════════════════════════════════════════════════════════════════════════

  const LX  = 14;    // left label x
  const LVX = 100;   // left value x
  const RX  = 395;   // right label x
  const RVX = 510;   // right value x
  const RW  = 140;   // right value max width

  const PHX = 660;   // photo x
  const PHY = 218;   // photo y
  const PHW = 162;   // photo width
  const PHH = 162;   // photo height

  const LF  = 11;    // label font size
  const VF  = 11.5;  // value font size

  // Row y positions
  const R1 = 222;  // नाम / पिता का नाम
  const R2 = 254;  // जन्म तिथि / गौत्र
  const R3 = 286;  // मोबाइल न. / आधार संख्या
  const R4 = 318;  // पता (full width)
  const R5 = 354;  // वारिसदार / सम्बन्ध
  const R6 = 386;  // एजेंट कोड
  const R7 = 418;  // सहयोग राशि

  // ── Photo box ──────────────────────────────────────────────────────────
  doc.rect(PHX, PHY, PHW, PHH).lineWidth(1).stroke(MAROON);
  doc.y = 0; doc.x = 0;

  const photoURL = member?.photoURL || null;
  if (photoURL) {
    try {
      let buf;
      if (photoURL.startsWith("http")) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        try {
          const res = await fetch(photoURL, { signal: controller.signal });
          clearTimeout(timer);
          if (res.ok) buf = Buffer.from(await res.arrayBuffer());
        } catch (err) {
          clearTimeout(timer);
          console.error("Photo fetch error:", err.message);
        }
      } else if (photoURL.startsWith("data:")) {
        buf = Buffer.from(photoURL.split(",")[1], "base64");
      }
      if (buf) {
        doc.image(buf, PHX + 1, PHY + 1, {
          width: PHW - 2, height: PHH - 2,
          fit: [PHW - 2, PHH - 2],
          align: "center", valign: "center",
        });
        doc.y = 0; doc.x = 0;
      }
    } catch (e) {
      console.error("Photo image render error:", e.message);
    }
  }

  // ── Extract member values ───────────────────────────────────────────────
  const name       = member?.displayName    || "";
  const fatherName = member?.fatherName     || "";
  const dob        = member?.bobDate        || "";
  const gotra      = member?.gotra          || member?.jati || "";
  const phone      = member?.phone          || "";
  const aadhaar    = member?.aadhaarNo      || "";
  const address    = member?.currentAddress || "";
  const village    = member?.village        || "";
  const fullAddr   = [address, village].filter(Boolean).join(", ");
  const guardian   = member?.guardian       || "";
  const relation   = member?.guardianRelation || "";
  const agCode     = agentCode || member?.agentCode || "";

  // ── ROW 1: नाम / पिता का नाम ───────────────────────────────────────────
  doc.font("NSD-Bold").fontSize(LF).fillColor(MAROON);
  t(doc, "नाम -", LX, R1);
  dottedLine(doc, LX + 48, R1 + 14, RX - 20);
  doc.font("NSD-Bold").fontSize(VF).fillColor(BLACK);
  t(doc, name, LVX, R1);

  doc.font("NSD-Bold").fontSize(LF).fillColor(MAROON);
  t(doc, "पिता का नाम -", RX, R1);
  dottedLine(doc, RX + 85, R1 + 14, PHX - 10);
  doc.font("NSD-Bold").fontSize(VF).fillColor(BLACK);
  t(doc, fatherName, RVX, R1, { width: RW });

  // ── ROW 2: जन्म तिथि / गौत्र ───────────────────────────────────────────
  doc.font("NSD-Bold").fontSize(LF).fillColor(MAROON);
  t(doc, "जन्म तिथि -", LX, R2);
  dottedLine(doc, LX + 70, R2 + 14, RX - 20);
  doc.font("NSD-Bold").fontSize(VF).fillColor(BLACK);
  t(doc, dob, LVX, R2);

  doc.font("NSD-Bold").fontSize(LF).fillColor(MAROON);
  t(doc, "गौत्र  -", RX, R2);
  dottedLine(doc, RX + 55, R2 + 14, PHX - 10);
  doc.font("NSD-Bold").fontSize(VF).fillColor(BLACK);
  t(doc, gotra, RVX, R2);

  // ── ROW 3: मोबाइल न. / आधार संख्या ────────────────────────────────────
  doc.font("NSD-Bold").fontSize(LF).fillColor(MAROON);
  t(doc, "मोबाइल न. -", LX, R3);
  dottedLine(doc, LX + 73, R3 + 14, RX - 20);
  doc.font("NSD-Bold").fontSize(VF).fillColor(BLACK);
  t(doc, phone, LVX, R3);

  doc.font("NSD-Bold").fontSize(LF).fillColor(MAROON);
  t(doc, "आधार संख्या -", RX, R3);
  dottedLine(doc, RX + 92, R3 + 14, PHX - 10);
  doc.font("NSD-Bold").fontSize(VF).fillColor(BLACK);
  t(doc, aadhaar, RVX, R3);

  // ── ROW 4: पता (full width) ─────────────────────────────────────────────
  doc.font("NSD-Bold").fontSize(LF).fillColor(MAROON);
  t(doc, "पता -", LX, R4);
  dottedLine(doc, LX + 36, R4 + 14, PHX - 10);
  doc.font("NSD-Bold").fontSize(VF).fillColor(BLACK);
  t(doc, fullAddr, LX + 42, R4, { width: PHX - LX - 52 });

  // ── ROW 5: वारिसदार / सम्बन्ध ─────────────────────────────────────────
  doc.font("NSD-Bold").fontSize(LF).fillColor(MAROON);
  t(doc, "वारिसदार  -", LX, R5);
  dottedLine(doc, LX + 70, R5 + 14, RX - 20);
  doc.font("NSD-Bold").fontSize(VF).fillColor(BLACK);
  t(doc, guardian, LVX, R5);

  doc.font("NSD-Bold").fontSize(LF).fillColor(MAROON);
  t(doc, "सम्बन्ध -", RX, R5);
  dottedLine(doc, RX + 62, R5 + 14, PHX - 10);
  doc.font("NSD-Bold").fontSize(VF).fillColor(BLACK);
  t(doc, relation, RVX, R5);

  // ── ROW 6: एजेंट कोड ───────────────────────────────────────────────────
  doc.font("NSD-Bold").fontSize(LF).fillColor(MAROON);
  t(doc, "एजेंट कोड -", LX, R6);
  dottedLine(doc, LX + 72, R6 + 14, 280);
  doc.font("NSD-Bold").fontSize(VF).fillColor(BLACK);
  t(doc, agCode, LVX, R6);

  // ── ROW 7: सहयोग राशि ──────────────────────────────────────────────────
  doc.font("NSD-Bold").fontSize(LF).fillColor(MAROON);
  t(doc, "सहयोग राशि -.........../- प्रत्येक कार्यक्रम पर लागु", LX, R7);

  // ══════════════════════════════════════════════════════════════════════════
  // 5. FOOTER  (y: 490 → H-10)
  // ══════════════════════════════════════════════════════════════════════════
  const FY = H - 72;

  // Decorative centre line
  doc.moveTo(W / 2 - 60, FY + 10).lineTo(W / 2 + 60, FY + 10)
     .lineWidth(0.8).stroke(GOLD);
  doc.y = 0; doc.x = 0;

  // Small decorative circles on centre line
  [-55, -35, -15, 0, 15, 35, 55].forEach((offset) => {
    doc.circle(W / 2 + offset, FY + 10, 1.5).fill(GOLD);
    doc.y = 0; doc.x = 0;
  });

  doc.font("NSD-Bold").fontSize(11).fillColor(MAROON);
  t(doc, "कार्यकर्ता", 30, FY + 18);
  t(doc, "अध्यक्ष", W - 85, FY + 18);

  // Signature lines
  doc.moveTo(15, FY + 8).lineTo(105, FY + 8).lineWidth(0.7).stroke(GOLD);
  doc.y = 0; doc.x = 0;
  doc.moveTo(W - 110, FY + 8).lineTo(W - 14, FY + 8).lineWidth(0.7).stroke(GOLD);
  doc.y = 0; doc.x = 0;
}

// ─── Draw Page 2 — Terms & Conditions in code ───────────────────────────────
function drawTermsPage(doc, schemeType) {
  // Background
  doc.rect(0, 0, W, H).fill(CREAM);
  doc.y = 0; doc.x = 0;

  // Borders
  doc.rect(4, 4, W - 8, H - 8).lineWidth(3).stroke(MAROON);
  doc.y = 0; doc.x = 0;
  doc.rect(8, 8, W - 16, H - 16).lineWidth(1).stroke(GOLD);
  doc.y = 0; doc.x = 0;

  // Scheme badge at top centre
  const BADGE_W = 280, BADGE_H = 38;
  const BADGE_X = (W - BADGE_W) / 2;
  const BADGE_Y = 18;

  let badgeFill = "#2C2C2C";
  let schemeName = "सुरक्षा सहयोग योजना";
  if (schemeType === "vivah") { badgeFill = "#7B3F00"; schemeName = "पुत्र-पुत्री विवाह योजना"; }
  if (schemeType === "mayra") { badgeFill = "#8B0057"; schemeName = "मायरा योजना"; }

  doc.roundedRect(BADGE_X, BADGE_Y, BADGE_W, BADGE_H, 6).fill(badgeFill);
  doc.y = 0; doc.x = 0;
  doc.roundedRect(BADGE_X + 2, BADGE_Y + 2, BADGE_W - 4, BADGE_H - 4, 5)
     .lineWidth(1.2).stroke(GOLD);
  doc.y = 0; doc.x = 0;
  doc.circle(BADGE_X + 12, BADGE_Y + BADGE_H / 2, 4).fill(GOLD);
  doc.y = 0; doc.x = 0;
  doc.circle(BADGE_X + BADGE_W - 12, BADGE_Y + BADGE_H / 2, 4).fill(GOLD);
  doc.y = 0; doc.x = 0;
  doc.font("NSD-Bold").fontSize(17).fillColor("#FFD700");
  t(doc, schemeName, BADGE_X, BADGE_Y + 10, { width: BADGE_W, align: "center" });

  // Terms heading
  doc.font("NSD-Bold").fontSize(13).fillColor(MAROON);
  t(doc, "योगदान से संबंधित नियम और योजना के लाभ:", 20, 70);

  const vivahTerms = [
    "इस योजना का लाभ सदस्यता तिथि से 12 माह बाद मिलना प्रारंभ होगा ।",
    "सदस्यों को नियमानुसार सहयोग राशि जमा करवाना अनिवार्य है ।",
    "सदस्य के विवाह की सूचना 15 दिन पूर्व देना अनिवार्य है ।",
    "यदि सदस्यता के एक वर्ष के भीतर पुत्र या पुत्री का विवाह होता है तो, सदस्य किसी भी प्रकार की विवाह सहायता राशि का पात्र नहीं होगा।",
    "सदस्यता के 1 वर्ष के पश्चात पुत्र या पुत्री का विवाह होता है, तो सदस्य विवाह सहायता पूर्ण राशि (संचालन व्यय 20% को छोड़ कर) पात्र होगा।",
    "यदि कोई सदस्य लगातार तीन बार सहयोग राशि की किस्त (रसीद) जमा नहीं करता और बार-बार कार्यकर्ता के सूचना देने या सम्पर्क करने पर\n   भी सहयोग राशि नहीं देता, तो संस्था उस सदस्य को लिखित सूचना भेजेगी। 15 दिन बाद भी यदि भुगतान नहीं होता, तो संस्था को उस सदस्य\n   की सदस्यता समाप्त करने का पूर्ण अधिकार सुरक्षित रहेगा।",
    "ऐसी स्थिति में वह सदस्य योजना से बाहर माना जाएगा और भविष्य में किसी भी प्रकार की विवाह सहायता राशि का पात्र नहीं होगा।",
    "सदस्यता रद्द करने पर सदस्यता शुल्क और किश्त की राशि वापस नहीं की जाएगी।",
    "संस्थान व सभी सामाजिक सदस्यों के हित को देखते हुए किसी भी समय इन नियमो में बदलाव किया जा सकता है, किसी भी प्रकार के विवाद\n   का न्यायक्षेत्र- बालोतरा (राजस्थान) ही होगा।",
    "योजना का लाभ केवल भारतीय वैवाहिक आयु सीमा अनुसार ही मिलेगा — पुत्र के लिए न्यूनतम 21 वर्ष एवं पुत्री के लिए 18 वर्ष।",
    "इससे कम आयु में किए गए विवाह योजना के अंतर्गत मान्य नहीं होंगे।",
    "इन सभी नियमो को मैंने पढ़ लिया उपरोक्त सभी नियमो का पालन करने लिए में सहमत हू, यदि में उपरोक्त नियमो का उलंघन करता तो मैं स्वयं\n   जिम्मेदार रहूँगा।",
  ];

  const surakshaTerms = [
    "इस योजना का लाभ सदस्यता तिथि से 12 माह बाद मिलना प्रारंभ होगा ।",
    "सदस्यों को नियमानुसार सहयोग राशि जमा करवाना अनिवार्य है ।",
    "सदस्य के विवाह की सूचना 15 दिन पूर्व देना अनिवार्य है ।",
    "यदि सदस्यता के एक वर्ष के भीतर पुत्र या पुत्री का विवाह होता है तो, सदस्य किसी भी प्रकार की विवाह सहायता राशि का पात्र नहीं होगा।",
    "सदस्यता के 1 वर्ष के पश्चात पुत्र या पुत्री का विवाह होता है, तो सदस्य विवाह सहायता पूर्ण राशि (संचालन व्यय 15% को छोड़ कर) पात्र होगा।",
    "यदि कोई सदस्य लगातार तीन बार सहयोग राशि की किस्त (रसीद) जमा नहीं करता और बार-बार कार्यकर्ता के सूचना देने या सम्पर्क करने पर\n   भी सहयोग राशि नहीं देता, तो संस्था उस सदस्य को लिखित सूचना भेजेगी। 15 दिन बाद भी यदि भुगतान नहीं होता, तो संस्था को उस सदस्य\n   की सदस्यता समाप्त करने का पूर्ण अधिकार सुरक्षित रहेगा।",
    "ऐसी स्थिति में वह सदस्य योजना से बाहर माना जाएगा और भविष्य में किसी भी प्रकार की विवाह सहायता राशि का पात्र नहीं होगा।",
    "सदस्यता रद्द करने पर सदस्यता शुल्क और किश्त की राशि वापस नहीं की जाएगी।",
    "संस्थान व सभी सामाजिक सदस्यों के हित को देखते हुए किसी भी समय इन नियमो में बदलाव किया जा सकता है, किसी भी प्रकार के विवाद\n   का न्यायक्षेत्र- बालोतरा (राजस्थान) ही होगा।",
    "योजना का लाभ केवल भारतीय वैवाहिक आयु सीमा अनुसार ही मिलेगा — पुत्र के लिए न्यूनतम 21 वर्ष एवं पुत्री के लिए 18 वर्ष।",
    "इससे कम आयु में किए गए विवाह योजना के अंतर्गत मान्य नहीं होंगे।",
    "इन सभी नियमो को मैंने पढ़ लिया उपरोक्त सभी नियमो का पालन करने लिए में सहमत हू, यदि में उपरोक्त नियमो का उलंघन करता तो मैं स्वयं\n   जिम्मेदार रहूँगा।",
  ];

  const terms = schemeType === "suraksha" ? surakshaTerms : vivahTerms;

  let ty = 92;
  terms.forEach((term, i) => {
    doc.font("NSD-Bold").fontSize(9.2).fillColor(BLACK);
    const prefix = `${i + 1}.`;
    t(doc, prefix, 20, ty);
    t(doc, term, 38, ty, { width: W - 60 });
    const lines = (term.match(/\n/g) || []).length + 1;
    ty += lines > 1 ? lines * 14 : 16;
    doc.y = 0; doc.x = 0;
  });

  // सदस्य हस्ताक्षर
  doc.font("NSD-Bold").fontSize(12).fillColor(MAROON);
  t(doc, "सदस्य हस्ताक्षर", W / 2 - 50, H - 72, { width: 140, align: "center" });

  // Footer bar
  doc.rect(9, H - 50, W - 18, 38).fill(MAROON);
  doc.y = 0; doc.x = 0;
  doc.font("NSD-Bold").fontSize(11).fillColor(WHITE);
  t(doc, "☎  96062628028, 9413745183", 30, H - 38);
  t(doc, "📍 कार्यालय पता: रबारियो का टाँका बालोतरा (राजस्थान)", W / 2 - 20, H - 38);
  doc.font("NSD-Bold").fontSize(11).fillColor(GOLD);
  t(doc, "अध्यक्ष", W - 70, H - 38);
}

// ─── POST handler ────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const body = await req.json();
    const { memberData, selectedProgram } = body;

    const PDFDocument = (await import("pdfkit")).default;

    const members = Array.isArray(memberData) ? memberData : (memberData ? [memberData] : []);

    if (members.length === 0) {
      return NextResponse.json(
        { error: "No member data provided" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Determine scheme type
    const programName =
      selectedProgram?.name ||
      selectedProgram?.hiname ||
      members[0]?.programName ||
      "";

    let schemeType = "suraksha";
    if (programName.includes("मायरा") || selectedProgram?.isMamera) schemeType = "mayra";
    else if (programName.includes("विवाह") || selectedProgram?.isVivah) schemeType = "vivah";

    const fontBold = path.join(process.cwd(), "public/static/font/NotoSansDevanagari-Bold.ttf");
    const fontReg  = path.join(process.cwd(), "public/static/font/NotoSansDevanagari.ttf");

    const doc = new PDFDocument({
      size: [W, H],
      autoFirstPage: false,
      margin: 0,
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

      // PAGE 1 — Certificate (fully drawn in code)
      doc.addPage({ size: [W, H], margin: 0 });
      await drawCertificatePage(doc, member, agentCode, schemeType);

      // PAGE 2 — Terms & Conditions (fully drawn in code)
      doc.addPage({ size: [W, H], margin: 0 });
      drawTermsPage(doc, schemeType);
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
