import { Button, Drawer, Space, Typography, Spin, message, Alert } from 'antd';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const MemberCertificateCom = ({
  open,
  onClose,
  memberData,
}) => {
  const { Title } = Typography;
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const reduxProgram = useSelector((state) => state.data.selectedProgram);
  const agentList = useSelector((state) => state.data.agentsList || []);

  const memberAgent = (agentList || []).find((x) => x.id === memberData?.agentId);
  const fullMemberData = memberData
    ? {
        ...memberData,
        agentPhone: memberAgent?.phone,
        agentCode: memberAgent?.agentCode || memberData?.agentCode,
      }
    : null;

  const selectedProgram = reduxProgram || {
    name: memberData?.programName || '',
    id: memberData?.programId || '',
  };

  const fileName = fullMemberData
    ? `${(fullMemberData.displayName || 'Member').replaceAll(" ", "_")}_${fullMemberData?.registrationNumber || 'Certificate'}.pdf`
    : 'Certificate.pdf';

  const fetchPdf = () => {
    if (!fullMemberData) return;
    setLoading(true);
    setErrorMsg(null);

    fetch('/api/certificate-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberData: fullMemberData,
        selectedProgram,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.base64) {
          const byteCharacters = atob(data.base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        } else {
          setErrorMsg(data.error || 'सर्टिफिकेट जनरेट करने में त्रुटि हुई।');
        }
      })
      .catch((err) => {
        console.error("Certificate fetch error:", err);
        setErrorMsg('सर्वर से कनेक्ट करने में समस्या आई।');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open && memberData) {
      fetchPdf();
    } else {
      setPdfUrl(null);
      setErrorMsg(null);
    }
  }, [open, memberData?.id || memberData?.registrationNumber]);

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Drawer
      title={<Title level={4} style={{ margin: 0 }}>{fileName}</Title>}
      width={920}
      placement="right"
      onClose={onClose}
      open={open}
      maskClosable={false}
      destroyOnClose
      keyboard={false}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose} size="large">
            रद्द करें
          </Button>
          <Button
            type="primary"
            size="large"
            disabled={!pdfUrl || loading}
            onClick={handleDownload}
          >
            Download Pdf
          </Button>
        </Space>
      }
    >
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: 16 }}>
          <Spin size="large" />
          <div>सर्टिफिकेट जनरेट हो रहा है...</div>
        </div>
      ) : errorMsg ? (
        <div style={{ padding: 24 }}>
          <Alert
            message="त्रुटि"
            description={errorMsg}
            type="error"
            showIcon
            action={
              <Button size="small" type="primary" onClick={fetchPdf}>
                पुनः प्रयास करें
              </Button>
            }
          />
        </div>
      ) : pdfUrl ? (
        <iframe
          src={pdfUrl}
          style={{ width: '100%', height: 'calc(100vh - 140px)', border: 'none', borderRadius: 6 }}
          title={fileName}
        />
      ) : (
        <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>कोई डेटा उपलब्ध नहीं है</div>
      )}
    </Drawer>
  );
};

export default MemberCertificateCom;