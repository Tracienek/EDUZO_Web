const {
    TransactionalEmailsApi,
    TransactionalEmailsApiApiKeys,
    SendSmtpEmail,
} = require("@getbrevo/brevo");

const emailApi = new TransactionalEmailsApi();
emailApi.setApiKey(
    TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY,
);

async function sendResetPasswordEmail(to, resetUrl) {
    const msg = new SendSmtpEmail();

    msg.subject = "Reset your EDUZO password";
    msg.htmlContent = `
    <p>You requested a password reset for EDUZO.</p>
    <p>Click the link below to set a new password (valid for 15 minutes):</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>If you did not request this, please ignore this email.</p>
  `;

    msg.sender = { name: "EDUZO", email: process.env.BREVO_SENDER_EMAIL };
    msg.to = [{ email: to }];

    return emailApi.sendTransacEmail(msg);
}

const axios = require("axios");

async function sendResetPasswordEmail(to, resetUrl) {
    console.log("📧 Sending reset email to:", to);

    try {
        await axios.post(
            "https://api.brevo.com/v3/smtp/email",
            {
                sender: {
                    name: "EDUZO",
                    email: process.env.BREVO_SENDER_EMAIL,
                },
                to: [{ email: to }],
                subject: "Reset your EDUZO password",
                htmlContent: `
        <p>Reset link:</p>
        <a href="${resetUrl}">${resetUrl}</a>
      `,
            },
            {
                headers: {
                    "api-key": process.env.BREVO_API_KEY,
                    "Content-Type": "application/json",
                },
            },
        );

        console.log("✅ Email sent successfully");
    } catch (error) {
        console.log("❌ Brevo error:", error.response?.data || error.message);
    }
}

module.exports = { sendResetPasswordEmail };
