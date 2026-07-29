import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font, Image
} from '@react-pdf/renderer';
import NotoSansDevanagari from '@/app/api/helperfile/static/font/NotoSansDevanagari';
import NotoSansDevanagariBold from '@/app/api/helperfile/static/font/NotoSansDevanagariBold';
import { TrsutData } from '@/lib/constentData';

Font.register({
  family: 'NSD',
  fonts: [
    { src: NotoSansDevanagari, fontWeight: 'normal' },
    { src: NotoSansDevanagariBold, fontWeight: 'bold' },
  ]
});

// ── Colors ───────────────────────────────────────────────────────────────────
const RED   = '#c0392b';
const NAVY  = '#1a3a6e';
const GOLD  = '#c8971e';
const DARK  = '#1a1a1a';
const LIGHT = '#f9f5ed';
const BORDER= '#c8971e';

// ── Shared header used by all three doc types ────────────────────────────────
const Header = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', borderBottom: `2pt solid ${GOLD}`, paddingBottom: 6, marginBottom: 8 }}>
    {/* Logo */}
    <Image src={TrsutData.logo} style={{ width: 52, height: 52, marginRight: 10 }} />
    {/* Center text */}
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 22, color: RED, letterSpacing: 0.5 }}>
        वीर बालाजी फाउंडेशन
      </Text>
      <Text style={{ fontFamily: 'NSD', fontSize: 8.5, color: DARK, marginTop: 2 }}>
        कार्यालय पता : रबारियो का टांका, बालोतरा (राजस्थान) 344022
      </Text>
      <Text style={{ fontFamily: 'NSD', fontSize: 8.5, color: DARK, marginTop: 1 }}>
        सम्पर्क सूत्र : कार्यालय न.  9602628028, 9413745183
      </Text>
      <Text style={{ fontFamily: 'NSD', fontSize: 8, color: NAVY, marginTop: 1 }}>
        रजिस्ट्रेशन नंबर :- {TrsutData.regNo}
      </Text>
    </View>
  </View>
);

// ── Dotted field box ─────────────────────────────────────────────────────────
const FieldBox = ({ label, value, flex = 1, style = {} }) => (
  <View style={{ flex, marginRight: 8, ...style }}>
    <Text style={{ fontFamily: 'NSD', fontSize: 8, color: '#555', marginBottom: 1 }}>{label}</Text>
    <View style={{ borderBottom: `1pt dotted ${GOLD}`, minHeight: 14, justifyContent: 'flex-end', paddingBottom: 1 }}>
      <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK, fontWeight: 'bold' }}>{value || ''}</Text>
    </View>
  </View>
);

// ── Small cells for Aadhaar digits ──────────────────────────────────────────
const CellRow = ({ count = 12, value = '' }) => {
  const chars = (value || '').toString().replace(/\s/g, '').split('');
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: 14, height: 14, border: `0.8pt solid ${GOLD}`, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 7, color: DARK }}>{chars[i] || ''}</Text>
        </View>
      ))}
    </View>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// DOCUMENT 1 — Membership Certificate (पुत्र-पु)
// ────────────────────────────────────────────────────────────────────────────
const MembershipCertificate = ({ data, selectedProgram }) => (
  <Page size="A4" style={{ backgroundColor: LIGHT, fontFamily: 'NSD', padding: 28, position: 'relative' }}>
    {/* Watermark */}
    <Image src={TrsutData.logo} style={{ position: 'absolute', top: '35%', left: '25%', width: '50%', opacity: 0.06 }} />

    <Header />

    {/* Title pill */}
    <View style={{ alignSelf: 'center', backgroundColor: '#8B0000', borderRadius: 3, paddingHorizontal: 24, paddingVertical: 4, marginBottom: 10 }}>
      <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 12, color: '#fff', letterSpacing: 1 }}>
        {data?.gender === 'Female' ? 'पुत्री-पु' : 'पुत्र-पु'}
      </Text>
    </View>

    {/* Top ID row */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      {/* Left photo box */}
      <View style={{ width: 60, height: 70, border: `1pt solid ${GOLD}`, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        {data?.photoURL
          ? <Image src={data.photoURL} style={{ width: '100%', height: '100%' }} />
          : <Text style={{ fontFamily: 'NSD', fontSize: 6, color: '#999', textAlign: 'center' }}>फोटो</Text>
        }
      </View>

      {/* Center ID fields */}
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <View style={{ flexDirection: 'row', marginBottom: 5 }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: NAVY, width: 90, fontWeight: 'bold' }}>सदस्य क्रमांक :</Text>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            {(data?.applicationNumber || data?.registrationNumber || '').toString().split('').map((c, i) => (
              <View key={i} style={{ width: 13, height: 13, border: `0.8pt solid ${GOLD}`, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'NSD', fontSize: 7, color: RED, fontWeight: 'bold' }}>{c}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 5 }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: NAVY, width: 90, fontWeight: 'bold' }}>दिनांक :</Text>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>{data?.dateJoin || '  /  /'}</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: NAVY, width: 90, fontWeight: 'bold' }}>रशीद क्रमांक :</Text>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View key={i} style={{ width: 13, height: 13, border: `0.8pt solid #e8c87a`, backgroundColor: '#fffdf0', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'NSD', fontSize: 7 }}>{(data?.receiptNo || '').toString()[i] || ''}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Right photo box */}
      <View style={{ width: 60, height: 70, border: `1pt solid ${GOLD}`, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'NSD', fontSize: 6, color: '#999', textAlign: 'center' }}>फोटो</Text>
      </View>
    </View>

    {/* Divider */}
    <View style={{ borderBottom: `0.8pt solid ${GOLD}`, marginBottom: 8 }} />

    {/* Main fields */}
    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
      <FieldBox label="नाम" value={data?.displayName} flex={2} />
      <FieldBox label="जन्म तिथि" value={data?.bobDate || '  /  /'} flex={1} />
    </View>
    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
      <FieldBox label="पिता / पति का नाम" value={data?.fatherName} flex={2} />
      <FieldBox label="गौत्र" value={data?.gotra} flex={1} />
    </View>

    {/* Address multiline */}
    <View style={{ marginBottom: 6 }}>
      <Text style={{ fontFamily: 'NSD', fontSize: 8, color: '#555', marginBottom: 1 }}>पता</Text>
      <View style={{ border: `0.8pt solid ${GOLD}`, minHeight: 30, padding: 4 }}>
        <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>{data?.address || ''}</Text>
      </View>
    </View>

    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
      {/* Mobile cells */}
      <View style={{ flex: 1.2, marginRight: 8 }}>
        <Text style={{ fontFamily: 'NSD', fontSize: 8, color: '#555', marginBottom: 2 }}>मोबाइल नंबर</Text>
        <CellRow count={10} value={data?.phone} />
      </View>
      <FieldBox label="हक़दार / वारिसदार" value={data?.guardian} flex={1.2} />
      <FieldBox label="वारिसदार का संबंध" value={data?.guardianRelation} flex={1} />
    </View>

    <View style={{ borderBottom: `1pt dashed ${GOLD}`, marginVertical: 6 }} />

    {/* Document + Aadhaar row */}
    <View style={{ marginBottom: 5 }}>
      <Text style={{ fontFamily: 'NSD', fontSize: 7.5, color: '#888', marginBottom: 3 }}>दस्तावेज संख्या (1 स्थायोत्त अनिवार्य है)</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 8, color: '#555', marginBottom: 2 }}>आधार कार्ड न.</Text>
          <CellRow count={12} value={data?.aadhaarNo} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 8, color: '#555', marginBottom: 2 }}>वारिसदार आधार कार्ड न.</Text>
          <CellRow count={12} value={data?.guardianAadhaar} />
        </View>
      </View>
    </View>

    <View style={{ borderBottom: `0.8pt solid ${GOLD}`, marginVertical: 6 }} />

    {/* Fees */}
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10, color: DARK, marginRight: 8 }}>सदस्यता शुल्क</Text>
      <View style={{ width: 80, borderBottom: `1pt solid ${GOLD}`, paddingBottom: 1 }}>
        <Text style={{ fontFamily: 'NSD', fontSize: 9, color: RED, fontWeight: 'bold' }}>
          {data?.fees ? `₹ ${data.fees}` : ''}
        </Text>
      </View>
      <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 10, color: DARK, marginHorizontal: 8 }}>शब्दों में</Text>
      <View style={{ flex: 1, borderBottom: `1pt solid ${GOLD}` }}>
        <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>{data?.feesWords || ''}</Text>
      </View>
    </View>

    {/* Footer */}
    <View style={{ borderTop: `1pt solid ${GOLD}`, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto' }}>
      <View>
        <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK, fontWeight: 'bold' }}>
          {data?.addedByName || '—'}{data?.agentCode ? ` (${data.agentCode})` : ''}
        </Text>
        <Text style={{ fontFamily: 'NSD', fontSize: 8, color: '#666', marginTop: 2 }}>कार्यकर्ता</Text>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontFamily: 'NSD', fontSize: 7.5, color: '#888' }}>
          MF/MRC/{new Date().getFullYear().toString().slice(-2)}{String(new Date().getMonth() + 1).padStart(2,'0')}-{data?.registrationNumber || '00000'}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK, fontWeight: 'bold' }}>
          {TrsutData.trustPresident}
        </Text>
        <Text style={{ fontFamily: 'NSD', fontSize: 8, color: '#666', marginTop: 2 }}>अध्यक्ष</Text>
      </View>
    </View>
  </Page>
);

// ────────────────────────────────────────────────────────────────────────────
// DOCUMENT 2 — Bond (सदस्यता बॉन्ड)
// ────────────────────────────────────────────────────────────────────────────
const Bond = ({ data, selectedProgram }) => (
  <Page size="A5" orientation="landscape" style={{ backgroundColor: LIGHT, fontFamily: 'NSD', padding: 22, position: 'relative' }}>
    <Image src={TrsutData.logo} style={{ position: 'absolute', top: '30%', left: '25%', width: '50%', opacity: 0.05 }} />

    <Header />

    {/* Top row: सदस्यता क्रमांक | पुत्र-पु pill | दिनांक */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <View>
        <Text style={{ fontFamily: 'NSD', fontSize: 8, color: '#555' }}>सदस्यता क्रमांक</Text>
        <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
          {(data?.applicationNumber || '').toString().split('').slice(0, 8).map((c, i) => (
            <View key={i} style={{ width: 13, height: 13, border: `0.8pt solid ${GOLD}`, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: 'NSD', fontSize: 7, color: RED }}>{c}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ backgroundColor: '#8B0000', borderRadius: 3, paddingHorizontal: 20, paddingVertical: 3 }}>
        <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 11, color: '#fff' }}>
          {data?.gender === 'Female' ? 'पुत्री-पु' : 'पुत्र-पु'}
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontFamily: 'NSD', fontSize: 8, color: '#555' }}>दिनांक</Text>
        <View style={{ borderBottom: `1pt solid ${GOLD}`, minWidth: 80, paddingBottom: 1, marginTop: 2 }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>{data?.dateJoin || '  /  /'}</Text>
        </View>
      </View>
    </View>

    {/* Main two-column layout */}
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {/* Left column — fields */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', marginBottom: 7, alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: NAVY, fontWeight: 'bold', width: 65 }}>नाम -</Text>
          <View style={{ flex: 1, borderBottom: `1pt solid ${GOLD}`, paddingBottom: 1 }}>
            <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>{data?.displayName || ''}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 7, alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: NAVY, fontWeight: 'bold', width: 65 }}>पिता का नाम -</Text>
          <View style={{ flex: 1, borderBottom: `1pt solid ${GOLD}` }}>
            <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>{data?.fatherName || ''}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 7, alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: NAVY, fontWeight: 'bold', width: 65 }}>जन्म तिथि -</Text>
          <View style={{ flex: 1, borderBottom: `1pt solid ${GOLD}` }}>
            <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>{data?.bobDate || ''}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 7, alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: NAVY, fontWeight: 'bold', width: 65 }}>मोबाइल न. -</Text>
          <View style={{ flex: 1, borderBottom: `1pt solid ${GOLD}` }}>
            <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>{data?.phone || ''}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 7, alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: NAVY, fontWeight: 'bold', width: 65 }}>पता -</Text>
          <View style={{ flex: 1, borderBottom: `1pt solid ${GOLD}` }}>
            <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>{data?.address || ''}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 7, alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: NAVY, fontWeight: 'bold', width: 65 }}>वारिसदार -</Text>
          <View style={{ flex: 1, borderBottom: `1pt solid ${GOLD}` }}>
            <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>{data?.guardian || ''}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 7, alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: NAVY, fontWeight: 'bold', width: 65 }}>एजेंट कोड -</Text>
          <View style={{ flex: 1, borderBottom: `1pt solid ${GOLD}` }}>
            <Text style={{ fontFamily: 'NSD', fontSize: 9, color: RED }}>{data?.agentCode || ''}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 7, alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: NAVY, fontWeight: 'bold', width: 65 }}>सहयोग राशि -</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>
              {data?.fees || '..........'}/-  प्रत्येक कार्यक्रम पर लागू
            </Text>
          </View>
        </View>
      </View>

      {/* Right column — additional fields + photo */}
      <View style={{ width: 140 }}>
        <View style={{ width: 75, height: 80, border: `1pt solid ${GOLD}`, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', marginBottom: 8 }}>
          {data?.photoURL
            ? <Image src={data.photoURL} style={{ width: '100%', height: '100%' }} />
            : <Text style={{ fontFamily: 'NSD', fontSize: 6, color: '#999' }}>फोटो</Text>
          }
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: NAVY, fontWeight: 'bold', width: 50 }}>गौत्र -</Text>
          <View style={{ flex: 1, borderBottom: `1pt solid ${GOLD}` }}>
            <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>{data?.gotra || ''}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: NAVY, fontWeight: 'bold', width: 50 }}>आधार -</Text>
          <View style={{ flex: 1, borderBottom: `1pt solid ${GOLD}` }}>
            <Text style={{ fontFamily: 'NSD', fontSize: 8, color: DARK }}>{data?.aadhaarNo || ''}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: NAVY, fontWeight: 'bold', width: 50 }}>साम्बध -</Text>
          <View style={{ flex: 1, borderBottom: `1pt solid ${GOLD}` }}>
            <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>{data?.guardianRelation || ''}</Text>
          </View>
        </View>
      </View>
    </View>

    {/* Footer signature row */}
    <View style={{ borderTop: `1pt solid ${GOLD}`, marginTop: 8, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
      <View style={{ alignItems: 'center', minWidth: 100 }}>
        <View style={{ borderTop: `1pt solid ${DARK}`, width: 100, paddingTop: 3, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 8.5, color: DARK }}>
            {data?.addedByName || ''}
          </Text>
          <Text style={{ fontFamily: 'NSD', fontSize: 8, color: '#666' }}>कार्यकर्ता</Text>
        </View>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Image src={TrsutData.logo} style={{ width: 28, height: 28, opacity: 0.7, marginBottom: 2 }} />
      </View>
      <View style={{ alignItems: 'center', minWidth: 100 }}>
        <View style={{ borderTop: `1pt solid ${DARK}`, width: 100, paddingTop: 3, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 8.5, color: DARK }}>{TrsutData.trustPresident}</Text>
          <Text style={{ fontFamily: 'NSD', fontSize: 8, color: '#666' }}>अध्यक्ष</Text>
        </View>
      </View>
    </View>
  </Page>
);

// ────────────────────────────────────────────────────────────────────────────
// DOCUMENT 3 — Receipt (वारिश मेमो)
// ────────────────────────────────────────────────────────────────────────────
const Receipt = ({ data, payments = [] }) => {
  const tableRows = payments.length > 0 ? payments : Array.from({ length: 8 }).map(() => ({}));
  return (
    <Page size="A4" style={{ backgroundColor: '#fff', fontFamily: 'NSD', padding: 24, border: `2pt solid ${NAVY}`, position: 'relative' }}>
      {/* Reg No top-left */}
      <Text style={{ fontFamily: 'NSD', fontSize: 7.5, color: NAVY, marginBottom: 4 }}>
        रजिस्ट्रेशन नंबर :- {TrsutData.regNo}
      </Text>

      <Header />

      {/* Title */}
      <View style={{ backgroundColor: NAVY, alignSelf: 'center', paddingHorizontal: 30, paddingVertical: 5, borderRadius: 3, marginBottom: 10 }}>
        <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 13, color: '#fff', letterSpacing: 1 }}>वारिश मेमो</Text>
      </View>

      {/* Info fields */}
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>रसीद नंबर : <Text style={{ fontWeight: 'bold' }}>{data?.receiptNo || ''}</Text></Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>दिनांक : <Text style={{ fontWeight: 'bold' }}>{data?.dateJoin || ''}</Text></Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>सदस्य क्रमांक : <Text style={{ fontWeight: 'bold' }}>{data?.applicationNumber || ''}</Text></Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>मोबाइल न.: <Text style={{ fontWeight: 'bold' }}>{data?.phone || ''}</Text></Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>नाम : <Text style={{ fontWeight: 'bold' }}>{data?.displayName || ''}</Text></Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>वारिसदार : <Text style={{ fontWeight: 'bold' }}>{data?.guardian || ''}</Text></Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>निवास स्थान : <Text style={{ fontWeight: 'bold' }}>{data?.address || ''}</Text></Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>जिला/राज्य : <Text style={{ fontWeight: 'bold' }}>{data?.district ? `${data.district} / ${data?.state || ''}` : ''}</Text></Text>
        </View>
      </View>
      <View style={{ marginBottom: 8 }}>
        <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>किस्त : <Text style={{ fontWeight: 'bold' }}>{data?.installmentNo || ''}</Text></Text>
      </View>

      {/* Table */}
      <View style={{ border: `1pt solid ${NAVY}` }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', backgroundColor: NAVY }}>
          {[
            { label: 'क्रम स.', w: 32 },
            { label: 'कोड न.', w: 52 },
            { label: 'नाम', w: 0, flex: 1 },
            { label: 'मोबाइल न.', w: 80 },
            { label: 'दिनांक', w: 60 },
          ].map((col, i) => (
            <View key={i} style={{ width: col.w || undefined, flex: col.flex, borderRight: i < 4 ? `0.5pt solid rgba(255,255,255,0.3)` : undefined, padding: 4, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 8.5, color: '#fff' }}>{col.label}</Text>
            </View>
          ))}
        </View>
        {/* Rows */}
        {tableRows.map((row, i) => (
          <View key={i} style={{ flexDirection: 'row', borderTop: `0.5pt solid #ddd`, backgroundColor: i % 2 === 0 ? '#fff' : '#f8f9fa' }}>
            <View style={{ width: 32, borderRight: `0.5pt solid #ddd`, padding: 4, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'NSD', fontSize: 8, color: DARK }}>{i + 1}</Text>
            </View>
            <View style={{ width: 52, borderRight: `0.5pt solid #ddd`, padding: 4 }}>
              <Text style={{ fontFamily: 'NSD', fontSize: 8, color: DARK }}>{row.agentCode || ''}</Text>
            </View>
            <View style={{ flex: 1, borderRight: `0.5pt solid #ddd`, padding: 4 }}>
              <Text style={{ fontFamily: 'NSD', fontSize: 8, color: DARK }}>{row.agentName || ''}</Text>
            </View>
            <View style={{ width: 80, borderRight: `0.5pt solid #ddd`, padding: 4 }}>
              <Text style={{ fontFamily: 'NSD', fontSize: 8, color: DARK }}>{row.phone || ''}</Text>
            </View>
            <View style={{ width: 60, padding: 4 }}>
              <Text style={{ fontFamily: 'NSD', fontSize: 8, color: DARK }}>{row.date || ''}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Bottom row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 14, color: RED }}>₹</Text>
          <View style={{ minWidth: 80, height: 22, border: `1pt solid ${RED}`, backgroundColor: '#fff3f3', padding: 2 }}>
            <Text style={{ fontFamily: 'NSD', fontSize: 10, color: RED, fontWeight: 'bold' }}>{data?.totalAmount || ''}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK }}>प्रतिनियुक्त:</Text>
          <Text style={{ fontFamily: 'NSD', fontSize: 9, color: DARK, marginTop: 2 }}>मोबाइल न. {data?.agentPhone || ''}</Text>
        </View>
      </View>

      {/* Founder line */}
      <View style={{ borderTop: `0.8pt solid ${GOLD}`, marginTop: 10, paddingTop: 5 }}>
        <Text style={{ fontFamily: 'NSD', fontWeight: 'bold', fontSize: 9, color: DARK }}>
          संस्थापक : {TrsutData.trustPresident}
        </Text>
      </View>

      {/* Note */}
      <View style={{ marginTop: 8, borderTop: `0.5pt dashed #aaa`, paddingTop: 5 }}>
        <Text style={{ fontFamily: 'NSD', fontSize: 8.5, color: DARK }}>
          नोट - यह दान स्वैच्छिक है और गैर - वापसी योग्य (non - refundable) है
        </Text>
      </View>
    </Page>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Main export — chooses which document to render based on `docType` prop
// Defaults to MembershipCertificate for backward compatibility
// ────────────────────────────────────────────────────────────────────────────
const CertificateComServerSide = ({ data, selectedProgram, docType = 'certificate', payments = [] }) => {
  const membersArray = Array.isArray(data) ? data : [data];

  return (
    <Document>
      {membersArray.map((member, index) => {
        if (docType === 'bond') {
          return <Bond key={index} data={member} selectedProgram={selectedProgram} />;
        }
        if (docType === 'receipt') {
          return <Receipt key={index} data={member} payments={payments} />;
        }
        return <MembershipCertificate key={index} data={member} selectedProgram={selectedProgram} />;
      })}
    </Document>
  );
};

export default CertificateComServerSide;