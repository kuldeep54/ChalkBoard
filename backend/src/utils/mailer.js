const nodemailer = require("nodemailer");

let transporterCache = null;

function getTransport() {
  if (transporterCache) return transporterCache;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    transporterCache = null;
    return null;
  }

  transporterCache = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });
  return transporterCache;
}

/**
 * Build a clickable link the app can open.
 */
function buildLink(req, route, token) {
  if (process.env.AUTH_BASE_URL) {
    return `${process.env.AUTH_BASE_URL}${route}?token=${token}`;
  }
  const host = (req?.get && req.get("host")) || "localhost";
  const ip = String(host).split(":")[0];
  return `exp://${ip}:8081/--/${route}?token=${token}`;
}

/**
 * Send an email.
 *   Priority: BREVO_API_KEY (HTTP, works on Render) → SMTP (works locally) → console preview.
 */
async function sendMail({ to, subject, text, html }) {
  const apiKey = process.env.BREVO_API_KEY;

  if (apiKey) {
    const fromEmail = (process.env.MAIL_FROM || "ChalkBoard <no-reply@chalkboard.app>")
      .replace(/^[^<]*</, "").replace(/>.*$/, "").trim();
    const fromName = (process.env.MAIL_FROM || "ChalkBoard").split("<")[0].trim();

    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html || text,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error(`BREVO API ERROR ${resp.status}: ${body}`);
      throw new Error(`Brevo API ${resp.status}`);
    }
    return { preview: false };
  }

  const transport = getTransport();

  if (transport) {
    try {
      await transport.sendMail({
        from: process.env.MAIL_FROM || "ChalkBoard <no-reply@chalkboard.app>",
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error(`MAILER ERROR: ${error.message}`);
      throw error;
    }
    return { preview: false };
  }

  console.log("\n══════════ CHALKBOARD MAIL PREVIEW ══════════");
  console.log(`To:       ${to}`);
  console.log(`Subject:  ${subject}`);
  console.log(text);
  if (!text.includes("---")) console.log("------------------------------------------");
  console.log("════════════━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━══════════\n");
  return { preview: true };
}

module.exports = { sendMail, buildLink };
