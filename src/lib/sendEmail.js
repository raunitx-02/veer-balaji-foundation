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
    console.warn("[sendEmail Warning] RESEND_API_KEY environment variable is not defined.");
  }
  let recipients = Array.isArray(to) ? to : [to];

  const dispatch = async (destinations) => {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'वीर बालाजी फाउंडेशन <noreply@veerbalaji.com>',
        to: destinations,
        subject: subject,
        html: htmlContent,
        text: textContent || subject,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || data.name || 'Resend email failed');
      err.status = res.status;
      throw err;
    }
    return data;
  };

  try {
    return await dispatch(recipients);
  } catch (error) {
    if (error.message && error.message.includes('testing emails')) {
      console.warn('[Resend Test Account Notice] Retrying dispatch with registered Resend test email...');
      try {
        return await dispatch(['raunitttttttttt@gmail.com']);
      } catch (fallbackErr) {
        console.error('[Resend Fallback Error]', fallbackErr.message);
      }
    }
    throw error;
  }
};

module.exports = sendEmail;