import React from 'react';
import {
  Document, Page, Text, View, Font, Image
} from '@react-pdf/renderer';
import NotoSansDevanagari from '@/app/api/helperfile/static/font/NotoSansDevanagari';
import NotoSansDevanagariBold from '@/app/api/helperfile/static/font/NotoSansDevanagariBold';

import { vivah_page1Bg } from '@/app/api/helperfile/Images/vivah_page1B64';
import { vivah_page2Bg } from '@/app/api/helperfile/Images/vivah_page2B64';
import { mayra_page1Bg } from '@/app/api/helperfile/Images/mayra_page1B64';
import { mayra_page2Bg } from '@/app/api/helperfile/Images/mayra_page2B64';
import { suraksha_page1Bg } from '@/app/api/helperfile/Images/suraksha_page1B64';
import { suraksha_page2Bg } from '@/app/api/helperfile/Images/suraksha_page2B64';

Font.register({
  family: 'NSD',
  fonts: [
    { src: NotoSansDevanagari, fontWeight: 'normal' },
    { src: NotoSansDevanagariBold, fontWeight: 'bold' },
  ]
});

// PDF page dimensions (A4 landscape in points)
const PW = 595.28;
const PH = 420.94;

// Image pixel dimensions
const IW = 2000;
const IH = 1414;

// Convert pixel coordinates to PDF points
const px = (x) => (x / IW) * PW;
const py = (y) => (y / IH) * PH;

// Reg number boxes row — 4 individual boxes
const RegBoxRow = ({ value = '', count = 4 }) => {
  const str = (value || '').toString().replace(/\D/g, '').padStart(count, '0').slice(-count);
  const chars = str.split('');
  return (
    <View style={{ flexDirection: 'row', gap: px(4) }}>
      {chars.map((ch, i) => (
        <View
          key={i}
          style={{
            width: px(44),
            height: py(62),
            border: '0.5pt solid #8B0000',
            backgroundColor: 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10, color: '#000' }}>
            {ch}
          </Text>
        </View>
      ))}
    </View>
  );
};

// Date boxes row (DD MM YYYY) — 8 boxes
const DateBoxRow = ({ value = '' }) => {
  let str = '00000000';
  if (value) {
    const clean = value.replace(/[^0-9]/g, '');
    if (clean.length === 8) str = clean;
    else if (value.match(/^\d{2}-\d{2}-\d{4}$/)) {
      str = value.replace(/-/g, '');
    }
  }
  const chars = str.split('');
  return (
    <View style={{ flexDirection: 'row', gap: px(3) }}>
      {chars.map((ch, i) => (
        <View
          key={i}
          style={{
            width: px(36),
            height: py(62),
            border: '0.5pt solid #8B0000',
            backgroundColor: 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 9, color: '#000' }}>
            {ch}
          </Text>
        </View>
      ))}
    </View>
  );
};

// Absolute overlay text helper
const Overlay = ({ x, y, children, style = {} }) => (
  <View style={{ position: 'absolute', left: px(x), top: py(y), zIndex: 10, ...style }}>
    {children}
  </View>
);

// Single Member 2-Page Certificate
const SingleMemberCertificate = ({ member, selectedProgram }) => {
  const programName = selectedProgram?.name || selectedProgram?.hiname || member?.programName || '';

  let page1Bg = suraksha_page1Bg;
  let page2Bg = suraksha_page2Bg;

  if (programName.includes('मायरा') || selectedProgram?.isMamera || member?.isMamera) {
    page1Bg = mayra_page1Bg;
    page2Bg = mayra_page2Bg;
  } else if (programName.includes('विवाह') || selectedProgram?.isVivah || member?.isVivah) {
    page1Bg = vivah_page1Bg;
    page2Bg = vivah_page2Bg;
  }

  // Member field values – using exact Firestore field names
  const regNo         = member?.registrationNumber || member?.applicationNumber || member?.regNo || '';
  const joinDate      = member?.dateJoin || member?.createdAt || '';
  const name          = member?.displayName || member?.name || '';
  const fatherName    = member?.fatherName || '';
  const dob           = member?.bobDate || member?.dob || '';
  const gotra         = member?.gotra || member?.jati || '';
  const phone         = member?.phone || member?.mobile || '';
  const aadhaar       = member?.aadhaarNo || '';
  const address       = member?.currentAddress || member?.address || '';
  const village       = member?.village || '';
  const fullAddress   = address && village ? `${address}, ${village}` : (address || village || '');
  const guardian      = member?.guardian || '';
  const relation      = member?.guardianRelation || '';
  const agentCode     = member?.agentCode || member?.agentId || '';
  const photoURL      = member?.photoURL || null;

  // ──────────────────────────────────────────────────────────────────────
  // Pixel layout of template (1.png at 2000×1414):
  //
  //  Header block: y 0–430
  //  "सदस्यता क्रमांक" label: x~78, y~438
  //  Reg boxes row starts: x~50, y~470  → 4 boxes each ~44px wide, gap 4px
  //  "दिनांक" label: x~1630, y~438
  //  Date boxes row starts: x~1592, y~470 → 8 boxes each ~36px wide
  //
  //  नाम dotted line after label: label ends ~x285, value starts ~x295, y~590
  //  जन्म तिथि dotted line: value starts ~x295, y~656
  //  मोबाइल न. dotted line: value starts ~x295, y~722
  //  पता dotted line: value starts ~x120, y~788 (wide field)
  //  वारिसदार dotted line: value starts ~x250, y~852
  //  एजेंट कोड dotted line: value starts ~x248, y~918
  //
  //  पिता का नाम: value starts ~x1090, y~590
  //  गौत्र: value starts ~x1090, y~656
  //  आधार संख्या: value starts ~x1090, y~722
  //  सम्बन्ध: value starts ~x1090, y~852
  //
  //  Photo box: x~1680–1930, y~570–900
  // ──────────────────────────────────────────────────────────────────────

  const fs = { fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10.5, color: '#1a1a1a' };
  const fsSmall = { fontFamily: 'NSD', fontWeight: 'bold', fontSize: 9.5, color: '#1a1a1a' };

  return (
    <>
      {/* ── PAGE 1: Main details page ─────────────────────────────────── */}
      <Page size={[PW, PH]} style={{ padding: 0, position: 'relative', backgroundColor: '#fff' }}>
        {/* Background template */}
        <Image
          src={page1Bg}
          style={{ position: 'absolute', top: 0, left: 0, width: PW, height: PH }}
        />

        {/* ── Reg Number Boxes ── */}
        <Overlay x={50} y={470}>
          <RegBoxRow value={regNo} count={4} />
        </Overlay>

        {/* ── Date Boxes ── */}
        <Overlay x={1592} y={470}>
          <DateBoxRow value={joinDate} />
        </Overlay>

        {/* ── Member Photo Box ── */}
        <Overlay x={1680} y={570} style={{ width: px(250), height: py(330) }}>
          {photoURL ? (
            <Image
              src={photoURL}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <View style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0' }} />
          )}
        </Overlay>

        {/* ── नाम (Name) ── */}
        <Overlay x={295} y={592}>
          <Text style={fs}>{name}</Text>
        </Overlay>

        {/* ── जन्म तिथि (DOB) ── */}
        <Overlay x={295} y={658}>
          <Text style={fs}>{dob}</Text>
        </Overlay>

        {/* ── मोबाइल न. (Phone) ── */}
        <Overlay x={295} y={724}>
          <Text style={fs}>{phone}</Text>
        </Overlay>

        {/* ── पता (Address) – full width dotted line ── */}
        <Overlay x={120} y={790} style={{ width: px(1530) }}>
          <Text style={{ ...fsSmall, flexWrap: 'wrap' }}>{fullAddress}</Text>
        </Overlay>

        {/* ── वारिसदार (Guardian) ── */}
        <Overlay x={250} y={852}>
          <Text style={fs}>{guardian}</Text>
        </Overlay>

        {/* ── एजेंट कोड (Agent Code) ── */}
        <Overlay x={248} y={918}>
          <Text style={fs}>{agentCode}</Text>
        </Overlay>

        {/* ── पिता का नाम (Father Name) ── */}
        <Overlay x={1090} y={592}>
          <Text style={{ ...fs, maxWidth: px(540) }}>{fatherName}</Text>
        </Overlay>

        {/* ── गौत्र (Gotra/Jati) ── */}
        <Overlay x={1090} y={658}>
          <Text style={fs}>{gotra}</Text>
        </Overlay>

        {/* ── आधार संख्या (Aadhaar) ── */}
        <Overlay x={1090} y={724}>
          <Text style={fs}>{aadhaar}</Text>
        </Overlay>

        {/* ── सम्बन्ध (Relation) ── */}
        <Overlay x={1090} y={852}>
          <Text style={fs}>{relation}</Text>
        </Overlay>

      </Page>

      {/* ── PAGE 2: Terms & Conditions (static) ──────────────────────── */}
      <Page size={[PW, PH]} style={{ padding: 0, position: 'relative', backgroundColor: '#fff' }}>
        <Image
          src={page2Bg}
          style={{ position: 'absolute', top: 0, left: 0, width: PW, height: PH }}
        />
      </Page>
    </>
  );
};

// Document wrapper — handles single member or array of members
const CertificateComServerSide = ({ data, selectedProgram }) => {
  const membersList = Array.isArray(data) ? data : [data];

  return (
    <Document>
      {membersList.map((m, idx) => (
        <SingleMemberCertificate
          key={m?.id || idx}
          member={m}
          selectedProgram={selectedProgram}
        />
      ))}
    </Document>
  );
};

export default CertificateComServerSide;