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

// Helper to render boxed reg number (4 digits)
const DigitBoxRow = ({ value = '', count = 4, style = {} }) => {
  const chars = (value || '').toString().padStart(count, '0').slice(-count).split('');
  return (
    <View style={{ flexDirection: 'row', gap: 2, ...style }}>
      {chars.map((char, i) => (
        <View key={i} style={{ width: 13, height: 15, border: '1pt solid #000', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10, color: '#000' }}>{char}</Text>
        </View>
      ))}
    </View>
  );
};

// Helper for date in DD0MM0YYYY format (8 boxes)
const DateBoxRow = ({ value = '', style = {} }) => {
  let dateStr = '01012026';
  if (value) {
    const clean = value.replace(/[^0-9]/g, '');
    if (clean.length === 8) dateStr = clean;
  }
  const chars = dateStr.split('');
  return (
    <View style={{ flexDirection: 'row', gap: 1.5, ...style }}>
      {chars.map((char, i) => (
        <View key={i} style={{ width: 11, height: 15, border: '1pt solid #000', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 9, color: '#000' }}>{char}</Text>
        </View>
      ))}
    </View>
  );
};

// Single Member 2-Page Certificate Component
const SingleMemberCertificate = ({ member, selectedProgram }) => {
  const programName = selectedProgram?.name || selectedProgram?.hiname || member?.programName || '';
  
  let page1Bg = suraksha_page1Bg;
  let page2Bg = suraksha_page2Bg;
  let isMayra = false;

  if (programName.includes('मायरा') || selectedProgram?.isMamera || member?.isMamera) {
    page1Bg = mayra_page1Bg;
    page2Bg = mayra_page2Bg;
    isMayra = true;
  } else if (programName.includes('विवाह') || selectedProgram?.isVivah || member?.isVivah) {
    page1Bg = vivah_page1Bg;
    page2Bg = vivah_page2Bg;
  }

  // Dynamic values bound strictly to member details
  const regNo = member?.applicationNumber || member?.registrationNumber || member?.regNo || '000';
  const joinDate = member?.dateJoin || member?.createdAt || '01-08-2026';
  const name = member?.displayName || member?.name || '';
  const fatherName = member?.fatherName || member?.father_name || '';
  const dob = member?.bobDate || member?.dob || '';
  const jati = member?.jati || member?.gotra || member?.surname || '';
  const phone = member?.phone || member?.mobile || '';
  const aadhaar = member?.aadhaarNo || member?.aadhaar || '';
  const address = member?.address || member?.currentAddress || member?.village || '';
  const guardian = member?.guardian || '';
  const relation = member?.guardianRelation || '';
  const agentCode = member?.agentCode || member?.agentId || 'VB1001';

  return (
    <>
      {/* ── PAGE 1: Main Certificate Details Page (1.png / 3.png / 5.png) ────────── */}
      <Page size={[595.28, 420.94]} style={{ padding: 0, position: 'relative' }}>
        {/* Background Official Certificate Template */}
        <Image src={page1Bg} style={{ position: 'absolute', top: 0, left: 0, width: 595.28, height: 420.94 }} />

        {/* DYNAMIC MEMBER OVERLAYS FOR PAGE 1 */}

        {/* 1. Membership Reg Number Box (Top Left: x=48, y=166) */}
        <View style={{ position: 'absolute', top: 166, left: 48, zIndex: 10 }}>
          <DigitBoxRow value={regNo} count={4} />
        </View>

        {/* 2. Date Box (Top Right: x=476, y=166) */}
        <View style={{ position: 'absolute', top: 166, left: 476, zIndex: 10 }}>
          <DateBoxRow value={joinDate} />
        </View>

        {/* 3. Member Profile Photo (Far Right Box: x=491, y=199, width=86, height=116) */}
        <View style={{ position: 'absolute', top: 199, left: 491, width: 86, height: 116, overflow: 'hidden', border: '1pt solid #333', zIndex: 10 }}>
          {member?.photoURL ? (
            <Image src={member.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <View style={{ width: '100%', height: '100%', backgroundColor: '#eee' }} />
          )}
        </View>

        {/* 4. Left Column Personal Details */}
        {/* Member Name (x=83, y=199) */}
        <View style={{ position: 'absolute', top: 199, left: 83, zIndex: 10 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 11, color: '#000' }}>{name}</Text>
        </View>

        {/* Date of Birth (x=101, y=220) */}
        <View style={{ position: 'absolute', top: 220, left: 101, zIndex: 10 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10, color: '#000' }}>{dob}</Text>
        </View>

        {/* Mobile Number (x=107, y=241) */}
        <View style={{ position: 'absolute', top: 241, left: 107, zIndex: 10 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10, color: '#000' }}>{phone}</Text>
        </View>

        {/* Address (x=65, y=263) */}
        <View style={{ position: 'absolute', top: 263, left: 65, width: 220, zIndex: 10 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 9.5, color: '#000' }}>{address}</Text>
        </View>

        {/* Guardian / Hakdar (x=89, y=284) */}
        <View style={{ position: 'absolute', top: 284, left: isMayra ? 75 : 89, zIndex: 10 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10, color: '#000' }}>{guardian}</Text>
        </View>

        {/* Agent Code (x=89, y=305) */}
        <View style={{ position: 'absolute', top: 305, left: 89, zIndex: 10 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10, color: '#000' }}>{agentCode}</Text>
        </View>

        {/* 5. Middle Column Personal Details */}
        {/* Father / Husband Name (x=410, y=199) */}
        <View style={{ position: 'absolute', top: 199, left: 410, zIndex: 10 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10.5, color: '#000' }}>{fatherName}</Text>
        </View>

        {/* Jati / Surname (x=372, y=220) */}
        <View style={{ position: 'absolute', top: 220, left: 372, zIndex: 10 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10, color: '#000' }}>{jati}</Text>
        </View>

        {/* Aadhaar Number (x=401, y=241) */}
        <View style={{ position: 'absolute', top: 241, left: 401, zIndex: 10 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10, color: '#000' }}>{aadhaar}</Text>
        </View>

        {/* Relation (x=380, y=284) */}
        <View style={{ position: 'absolute', top: 284, left: 380, zIndex: 10 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10, color: '#000' }}>{relation}</Text>
        </View>

      </Page>

      {/* ── PAGE 2: Rules & Conditions Page (2.png / 4.png / 6.png) ───────────── */}
      <Page size={[595.28, 420.94]} style={{ padding: 0, position: 'relative' }}>
        <Image src={page2Bg} style={{ position: 'absolute', top: 0, left: 0, width: 595.28, height: 420.94 }} />
      </Page>
    </>
  );
};

// Document Container for single or multiple members
const CertificateComServerSide = ({ data, selectedProgram }) => {
  const membersList = Array.isArray(data) ? data : [data];

  return (
    <Document>
      {membersList.map((m, idx) => (
        <SingleMemberCertificate key={m?.id || idx} member={m} selectedProgram={selectedProgram} />
      ))}
    </Document>
  );
};

export default CertificateComServerSide;