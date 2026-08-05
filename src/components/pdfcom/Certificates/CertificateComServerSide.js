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
        <View key={i} style={{ width: 14, height: 16, border: '1pt solid #000', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
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
    <View style={{ flexDirection: 'row', gap: 1, ...style }}>
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
      {/* ── PAGE 1: Front Cover / Header Certificate Page ───────────────────── */}
      <Page size={[595.28, 420.94]} style={{ padding: 0, position: 'relative' }}>
        <Image src={page1Bg} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      </Page>

      {/* ── PAGE 2: Main Personal Details Bond Page ──────────────────────────── */}
      <Page size={[595.28, 420.94]} style={{ padding: 0, position: 'relative' }}>
        {/* Background Image Template for Page 2 */}
        <Image src={page2Bg} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

        {/* DYNAMIC MEMBER OVERLAYS */}

        {/* 1. Membership Reg Number Box (Top Left) */}
        <View style={{ position: 'absolute', top: 180, left: 28 }}>
          <DigitBoxRow value={regNo} count={4} />
        </View>

        {/* 2. Date Box (Top Right) */}
        <View style={{ position: 'absolute', top: 180, left: 457 }}>
          <DateBoxRow value={joinDate} />
        </View>

        {/* 3. Member Profile Photo (Far Right Box) */}
        <View style={{ position: 'absolute', top: 206, left: 483, width: 88, height: 104, overflow: 'hidden', border: '1pt solid #333' }}>
          {member?.photoURL ? (
            <Image src={member.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <View style={{ width: '100%', height: '100%', backgroundColor: '#eee' }} />
          )}
        </View>

        {/* 4. Left Column Personal Details */}
        {/* Member Name */}
        <View style={{ position: 'absolute', top: 205, left: 47 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 11, color: '#000' }}>{name}</Text>
        </View>

        {/* Date of Birth */}
        <View style={{ position: 'absolute', top: 228, left: 83 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10, color: '#000' }}>{dob}</Text>
        </View>

        {/* Mobile Number */}
        <View style={{ position: 'absolute', top: 248, left: 82 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10, color: '#000' }}>{phone}</Text>
        </View>

        {/* Address */}
        <View style={{ position: 'absolute', top: 270, left: 47, width: 220 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 9.5, color: '#000' }}>{address}</Text>
        </View>

        {/* Guardian / Hakdar */}
        <View style={{ position: 'absolute', top: 290, left: isMayra ? 70 : 80 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10, color: '#000' }}>{guardian}</Text>
        </View>

        {/* Agent Code */}
        <View style={{ position: 'absolute', top: 312, left: 78 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10, color: '#000' }}>{agentCode}</Text>
        </View>

        {/* 5. Middle Column Personal Details */}
        {/* Father / Husband Name */}
        <View style={{ position: 'absolute', top: 210, left: 338 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10.5, color: '#000' }}>{fatherName}</Text>
        </View>

        {/* Jati / Surname */}
        <View style={{ position: 'absolute', top: 230, left: 290 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10, color: '#000' }}>{jati}</Text>
        </View>

        {/* Aadhaar Number */}
        <View style={{ position: 'absolute', top: 250, left: 335 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10, color: '#000' }}>{aadhaar}</Text>
        </View>

        {/* Relation */}
        <View style={{ position: 'absolute', top: 288, left: 305 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10, color: '#000' }}>{relation}</Text>
        </View>

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