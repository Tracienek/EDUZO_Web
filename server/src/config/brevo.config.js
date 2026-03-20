const dotenv = require("dotenv");
dotenv.config();

const SibApiV3Sdk = require("sib-api-v3-sdk");

/* =========================
   ENV VALIDATION
========================= */

const {
    BREVO_API_KEY,
    FROM_NAME = "EDUZO",
    FROM_EMAIL = "phapluu2k5tqt@gmail.com",
} = process.env;

if (!BREVO_API_KEY) {
    throw new Error("Missing BREVO_API_KEY in environment variables");
}

/* =========================
   BREVO CLIENT (TRANSACTIONAL)
========================= */

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

/* =========================
   HELPERS
========================= */

const formatDate = (d = new Date()) =>
    new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);

const withTimestamp = (subject) => `${subject} - (${formatDate()})`;
const localPart = (email) => email.split("@")[0];

const logOk = (msg, meta = {}) => console.log("✅", msg, meta);
const logErr = (msg, meta = {}) => console.error("❌", msg, meta);

/* =========================
   CORE SEND (API)
========================= */

async function sendEmail({ to, subject, html }) {
    try {
        const res = await emailApi.sendTransacEmail({
            sender: {
                name: FROM_NAME,
                email: FROM_EMAIL,
            },
            to: [{ email: to }],
            subject,
            htmlContent: html,
        });

        logOk("Email sent via Brevo API", {
            to,
            subject,
            messageId: res && res.messageId,
        });

        return res;
    } catch (error) {
        logErr("Brevo API email error", {
            to,
            subject,
            message: error && error.message,
            body: error && error.response && error.response.body,
        });
        throw error;
    }
}

/* =========================
   PUBLIC API
========================= */

async function sendHtml(to, subject, html) {
    return sendEmail({
        to,
        subject: withTimestamp(subject),
        html,
    });
}

module.exports = {
    sendHtml,
};
