/**
 * Send email via Resend API
 * @param {string|Array} to
 * @param {string} subject
 * @param {string} htmlContent
 * @param {string} textContent
 */
const sendEmail = async (to, subject, htmlContent, textContent = '') => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set in environment variables.");
  }
  const recipients = Array.isArray(to) ? to : [to];

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'MITRA HINDU SAMAJ SEVA FOUNDATION <onboarding@resend.dev>',
        to: recipients,
        subject: subject,
        html: htmlContent,
        text: textContent || subject,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[Resend Dispatch Error]', data);
      throw new Error(data.message || data.name || 'Resend email failed');
    }
    return data;
  } catch (error) {
    console.error('[sendEmail Error]', error.message);
    throw error;
  }
};

module.exports = sendEmail;