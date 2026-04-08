const { Resend } = require("resend");

const DEFAULT_TO = "sanchezlandscape512@gmail.com";
const SITE_VERIFY = "https://www.google.com/recaptcha/api/siteverify";

function clientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) {
    return xff.split(",")[0].trim();
  }
  return "";
}

function normalizeQuotedEnv(raw) {
  let v = String(raw || "").trim();
  if (
    (v.charAt(0) === '"' && v.charAt(v.length - 1) === '"') ||
    (v.charAt(0) === "'" && v.charAt(v.length - 1) === "'")
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

async function verifyRecaptchaToken(token, remoteip, expectedAction) {
  const secret = normalizeQuotedEnv(process.env.RECAPTCHA_SECRET_KEY);
  if (!secret) {
    return {
      ok: false,
      error: "Server is not configured. Add RECAPTCHA_SECRET_KEY.",
    };
  }
  if (!token) {
    return { ok: false, error: "Please complete the reCAPTCHA." };
  }
  const params = new URLSearchParams();
  params.set("secret", secret);
  params.set("response", token.trim());
  if (remoteip) params.set("remoteip", remoteip);
  let data;
  try {
    const r = await fetch(SITE_VERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    data = await r.json();
  } catch (e) {
    return {
      ok: false,
      error: "Could not verify reCAPTCHA. Try again in a moment.",
    };
  }
  if (!data || data.success !== true) {
    return {
      ok: false,
      error: "reCAPTCHA verification failed. Please try again.",
    };
  }

  if (typeof data.score === "number") {
    const minRaw = normalizeQuotedEnv(process.env.RECAPTCHA_MIN_SCORE);
    const min = minRaw ? parseFloat(minRaw) : 0.5;
    const threshold = Number.isFinite(min) ? min : 0.5;
    if (data.score < threshold) {
      return {
        ok: false,
        error: "Unable to verify submission. Please try again or call us.",
      };
    }
  }

  if (expectedAction) {
    const exp = String(expectedAction).trim();
    const got = data.action ? String(data.action).trim() : "";
    if (got && got !== exp) {
      return {
        ok: false,
        error: "reCAPTCHA verification failed. Please try again.",
      };
    }
  }

  return { ok: true };
}

function digitsPhone(s) {
  return String(s || "").replace(/\D/g, "");
}

function validPhone(s) {
  const d = digitsPhone(s);
  return d.length === 10 || d.length === 11;
}

function validEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
}

/** One or more addresses: comma/semicolon in CONTACT_TO_EMAIL, or CONTACT_TO_EMAIL_2 for an extra inbox. */
function resolveRecipients() {
  const out = [];
  const primary = String(process.env.CONTACT_TO_EMAIL || "").trim();
  if (primary) {
    primary.split(/[,;]/).forEach(function (part) {
      const t = part.trim();
      if (t) out.push(t);
    });
  }
  const extra = String(process.env.CONTACT_TO_EMAIL_2 || "").trim();
  if (extra) out.push(extra);
  const seen = new Set();
  const deduped = out.filter(function (addr) {
    const key = addr.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return deduped.length > 0 ? deduped : [DEFAULT_TO];
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      error: "Server is not configured for email. Add RESEND_API_KEY.",
    });
  }

  const from = process.env.RESEND_FROM;
  if (!from) {
    return res.status(500).json({
      ok: false,
      error: "Server is not configured. Add RESEND_FROM (verified sender).",
    });
  }

  let rawBody = req.body;
  if (typeof rawBody === "string") {
    try {
      rawBody = JSON.parse(rawBody || "{}");
    } catch (e) {
      return res.status(400).json({ ok: false, error: "Invalid request body." });
    }
  }
  const body =
    typeof rawBody === "object" && rawBody !== null ? rawBody : {};
  const recaptchaToken = String(body.recaptchaToken || "").trim();
  const rawAction = String(body.recaptchaAction || "").trim();
  const allowedActions = { contact_form: true, quote_form: true };
  const recaptchaExpected = allowedActions[rawAction] ? rawAction : "";
  if (!recaptchaExpected) {
    return res.status(400).json({
      ok: false,
      error: "Invalid request. Refresh the page and try again.",
    });
  }

  const formTypeEarly = body.formType === "contact" ? "contact" : "quote";
  const actionForForm =
    formTypeEarly === "contact" ? "contact_form" : "quote_form";
  if (recaptchaExpected !== actionForForm) {
    return res.status(400).json({
      ok: false,
      error: "Invalid request. Refresh the page and try again.",
    });
  }

  const captcha = await verifyRecaptchaToken(
    recaptchaToken,
    clientIp(req),
    recaptchaExpected
  );
  if (!captcha.ok) {
    const status =
      captcha.error &&
      captcha.error.indexOf("Server is not configured") === 0
        ? 500
        : 400;
    return res.status(status).json({ ok: false, error: captcha.error });
  }

  const formType = formTypeEarly;
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();
  const service = String(body.service || "").trim();
  const message = String(body.message || "").trim();
  const contactMethod = String(body.contactMethod || "").trim();

  if (!name) {
    return res.status(400).json({ ok: false, error: "Name is required." });
  }
  if (!validPhone(phone)) {
    return res.status(400).json({ ok: false, error: "Invalid phone number." });
  }
  if (!validEmail(email)) {
    return res.status(400).json({ ok: false, error: "Invalid email." });
  }
  if (!service) {
    return res.status(400).json({ ok: false, error: "Service is required." });
  }
  if (formType === "contact" && !message) {
    return res.status(400).json({ ok: false, error: "Message is required." });
  }

  const to = resolveRecipients();
  let subject;
  let text;

  if (formType === "contact") {
    subject = "Website inquiry — " + name;
    text =
      [
        "Name: " + name,
        "Phone: " + phone,
        "Email: " + email,
        "Service: " + service,
        "Preferred contact: " + (contactMethod || "—"),
        "",
        message,
      ].join("\n");
  } else {
    subject = "Quote request — " + name;
    text =
      [
        "Name: " + name,
        "Phone: " + phone,
        "Email: " + email,
        "Service: " + service,
        "",
        message || "(No additional message)",
      ].join("\n");
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject,
    text,
  });

  if (error) {
    return res.status(502).json({
      ok: false,
      error: "Could not send email. Try again or call us directly.",
    });
  }

  return res.status(200).json({ ok: true });
};
