const axios = require("axios");

function getBrevoEnv() {
    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.BREVO_FROM_EMAIL;
    const fromName = process.env.BREVO_FROM_NAME || "EDUZO_WEB";
    if (!apiKey) throw new Error("Missing BREVO_API_KEY");
    if (!fromEmail) throw new Error("Missing BREVO_FROM_EMAIL");
    return { apiKey, fromEmail, fromName };
}

async function sendMail({ to, subject, html, text }) {
    const { apiKey, fromEmail, fromName } = getBrevoEnv();

    const payload = {
        sender: { name: fromName, email: fromEmail },
        to: Array.isArray(to) ? to.map((e) => ({ email: e })) : [{ email: to }],
        subject,
        ...(html ? { htmlContent: html } : {}),
        ...(text ? { textContent: text } : {}),
    };

    try {
        const res = await axios.post(
            "https://api.brevo.com/v3/smtp/email",
            payload,
            {
                headers: {
                    "api-key": apiKey,
                    "content-type": "application/json",
                    accept: "application/json",
                },
                timeout: 15000,
            },
        );

        return res.data;
    } catch (err) {
        console.error("Brevo status:", err.response?.status);
        console.error("Brevo data:", err.response?.data); // 👈 lỗi thật nằm ở đây
        console.error("Brevo message:", err.message);
        throw err;
    }
}

async function sendResetPasswordEmail(to, resetUrl) {
    return sendMail({
        to,
        subject: "Reset your EDUZO password",
        html: `
      <p>You requested a password reset for EDUZO.</p>
      <p>Click the link below to set a new password (valid for 15 minutes):</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, please ignore this email.</p>
    `,
        text: `Reset link: ${resetUrl}`,
    });
}

module.exports = { sendMail, sendResetPasswordEmail };
