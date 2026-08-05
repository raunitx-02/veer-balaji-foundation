import { Button, Drawer, Space, Typography, Spin, message } from 'antd';
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

  const selectedProgram = useSelector((state) => state.data.selectedProgram);
  const agentList = useSelector((state) => state.data.agentsList || []);

  const memberAgent = (agentList || []).find((x) => x.id === memberData?.agentId);
  const fullMemberData = memberData ? { ...memberData, agentPhone: memberAgent?.phone, agentCode: memberAgent?.agentCode } : null;

  const fileName = fullMemberData
    ? `${(fullMemberData.displayName || '').replaceAll(" ", "_")}_${fullMemberData?.registrationNumber || 'Member'}_Certificate.pdf`
    : 'Certificate.pdf';

  useEffect(() => {
    let currentUrl = null;
    if (open && fullMemberData) {
      setLoading(true);
      fetch('/api/certificate-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberData: fullMemberData,
          selectedProgram,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.base64) {
            const byteCharacters = atob(data.base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            currentUrl = URL.createObjectURL(blob);
            setPdfUrl(currentUrl);
          } else {
            message.error(data.error || 'Failed to generate certificate');
          }
        })
        .catch((err) => {
          console.error(err);
          message.error('Error generating certificate PDF');
        })
        .finally(() => setLoading(false));
    } else {
      setPdfUrl(null);
    }

    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [open, memberData]);

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
      width={900}
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Spin size="large" tip="Certificate जनरेट हो रहा है..." />
        </div>
      ) : pdfUrl ? (
        <iframe
          src={pdfUrl}
          style={{ width: '100%', height: 'calc(100vh - 120px)', border: 'none' }}
          title={fileName}
        />
      ) : (
        <div>कोई डेटा उपलब्ध नहीं है</div>
      )}
    </Drawer>
  );
};

export default MemberCertificateCom;