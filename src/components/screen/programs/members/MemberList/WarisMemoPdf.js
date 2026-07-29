'use client';
import React from 'react';
import { Modal, Button } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { TrsutData } from '@/lib/constentData';

export const buildWarisMemoHTML = ({ member, receiptNo, listData = [] }) => {
  const dateStr = dayjs().format('06-Jul, YYYY');
  
  return `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8"/>
<title>Waris Memo - ${member?.displayName || 'Member'}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{
  font-family:'Noto Sans Devanagari',sans-serif;
  background:#fff;
  color:#111;
  font-size:12px;
  padding:20px;
}
.memo-container {
  border: 2px solid #0d5497;
  border-radius: 8px;
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
}
.header-badge {
  background: #102a43;
  color: #fff;
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  padding: 6px 0;
  border-radius: 20px;
  width: 200px;
  margin: 0 auto 16px auto;
}
.grid-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
  margin-bottom: 16px;
  font-size: 11px;
}
.grid-row {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dashed #ddd;
  padding-bottom: 2px;
}
.label { font-weight: 600; color: #444; }
.val { font-weight: 700; color: #000; }
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  font-size: 11px;
}
th {
  background: #102a43;
  color: #fff;
  padding: 6px;
  text-align: center;
  font-weight: 600;
}
td {
  border: 1px solid #ccc;
  padding: 6px;
  text-align: center;
}
tr:nth-child(even) { background: #f9fafb; }
.footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 10px;
  border-top: 2px solid #0d5497;
}
.amount-badge {
  background: #fee2e2;
  color: #b91c1c;
  font-weight: 700;
  font-size: 14px;
  padding: 4px 16px;
  border-radius: 4px;
  border: 1px solid #fca5a5;
}
.note {
  font-size: 10px;
  color: #666;
  font-style: italic;
  margin-top: 8px;
}
.sign-box {
  text-align: right;
  font-size: 11px;
}
</style>
</head>
<body>
  <div class="memo-container">
    <div class="header-badge">वारिस मेमो</div>
    
    <div class="grid-info">
      <div class="grid-row"><span class="label">रसीद नं.:</span><span class="val">${receiptNo || '3094'}</span></div>
      <div class="grid-row"><span class="label">दिनांक:</span><span class="val">${dateStr}</span></div>
      <div class="grid-row"><span class="label">सदस्य क्रमांक:</span><span class="val">${member?.applicationNumber || member?.registrationNumber || '539'}</span></div>
      <div class="grid-row"><span class="label">मोबाइल नं:</span><span class="val">${member?.phone || '-'}</span></div>
      <div class="grid-row"><span class="label">नाम:</span><span class="val">${member?.displayName || '-'} / ${member?.fatherName || ''}</span></div>
      <div class="grid-row"><span class="label">वारिसदार:</span><span class="val">${member?.guardian || '-'}</span></div>
      <div class="grid-row"><span class="label">निवास स्थान:</span><span class="val">${member?.village || '-'}</span></div>
      <div class="grid-row"><span class="label">किस्त:</span><span class="val">300</span></div>
      <div class="grid-row"><span class="label">जिला & राज्य:</span><span class="val">${member?.district || ''} (${member?.state || 'राजस्थान'})</span></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>क्रम.सं.</th>
          <th>कोड न</th>
          <th>नाम</th>
          <th>मोबाइल न.</th>
          <th>दिनांक</th>
        </tr>
      </thead>
      <tbody>
        ${(listData.length ? listData : [
          { code: '36', name: member?.displayName || 'सदस्य', phone: member?.phone || '-', date: dateStr }
        ]).map((item, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${item.code || '-'}</td>
            <td>${item.name || '-'}</td>
            <td>${item.phone || '-'}</td>
            <td>${item.date || dateStr}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer-row">
      <div class="amount-badge">₹ 1500/-</div>
      <div class="sign-box">
        <div><strong>संस्थापक:</strong> ${TrsutData.founder}</div>
        <div>प्रतिहस्ताक्षर: अध्यक्ष</div>
      </div>
    </div>
    
    <div class="note">Note: यह दान स्वैच्छिक है और गैर-वापसी योग्य (Non-Refundable) है।</div>
  </div>
</body>
</html>`;
};

const WarisMemoModal = ({ open, onClose, member }) => {
  const handlePrint = () => {
    const html = buildWarisMemoHTML({ member });
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="वारिस मेमो रसीद (Waris Memo)"
      width={700}
      footer={[
        <Button key="close" onClick={onClose}>Close</Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>Print Waris Memo</Button>
      ]}
    >
      <iframe
        srcDoc={buildWarisMemoHTML({ member })}
        style={{ width: '100%', height: '500px', border: 'none' }}
        title="Waris Memo Preview"
      />
    </Modal>
  );
};

export default WarisMemoModal;
