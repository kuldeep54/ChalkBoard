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
  });
  return transporterCache;
}

/**
 * Build a clickable link the app can open.
 *   - AUTH_BASE_URL (e.g. "chalkboard://" or "exp://192.168.1.11:8081/--/")
 *     when configured wins.
 *   - Otherwise derive a dev Expo deep link from the incoming request host
 *     (the phone's Expo Go can open exp://HOST:8081/--/... routes).
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
 * Send an email. Uses the configured SMTP transport when available,
 * otherwise prints a mail preview to the server console (development mode).
 *
 * @param {object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.text
 * @param {string} [opts.html]
 */
async function sendMail({ to, subject, text, html }) {
  const transport = getTransport();

  if (transport) {
    await transport.sendMail({
      from: process.env.MAIL_FROM || "ChalkBoard <no-reply@chalkboard.app>",
      to,
      subject,
      text,
      html,
    });
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