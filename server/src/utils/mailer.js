// server/src/utils/mailer.js
const sgMail = require("@sendgrid/mail");

const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
    console.warn("[mailer] Missing SENDGRID_API_KEY");
} else {
    sgMail.setApiKey(apiKey);
}

const getFrom = () => {
    const email = process.env.SENDGRID_FROM_EMAIL;
    const name = process.env.SENDGRID_FROM_NAME || "EDUZO";
    if (!email) throw new Error("Missing SENDGRID_FROM_EMAIL");
    return { email, name };
};

/**
 * Send email via SendGrid
 * @param {Object} params
 * @param {string|string[]} params.to - recipient email(s)
 * @param {string} [params.subject]
 * @param {string} [params.text]
 * @param {string} [params.html]
 * @param {string} [params.templateId] - SendGrid Dynamic Template ID (d-xxx)
 * @param {Object} [params.dynamicTemplateData]
 */
async function sendMail({
    to,
    subject = "",
    text = "",
    html = "",
    templateId,
    dynamicTemplateData,
}) {
    if (!apiKey) throw new Error("SENDGRID_API_KEY is not configured");
    if (!to || (Array.isArray(to) && to.length === 0)) {
        throw new Error("Recipient 'to' is required");
    }

    const msg = {
        to,
        from: getFrom(),
    };

    // Template mode
    if (templateId) {
        msg.templateId = templateId;
        msg.dynamicTemplateData = dynamicTemplateData || {};
        if (subject) msg.subject = subject;
    } else {
        // Plain mode
        if (!subject)
            throw new Error("subject is required when not using templateId");
        if (!text && !html) throw new Error("Provide text or html content");

        msg.subject = subject;
        if (text) msg.text = text;
        if (html) msg.html = html;
    }

    try {
        const [res] = await sgMail.send(msg);
        return {
            statusCode: res?.statusCode,
            headers: res?.headers,
        };
    } catch (err) {
        const body = err?.response?.body;
        const detail = body ? JSON.stringify(body) : err?.message;
        const e = new Error(`SendGrid sendMail failed: ${detail}`);
        e.raw = err;
        throw e;
    }
}

module.exports = { sendMail };
