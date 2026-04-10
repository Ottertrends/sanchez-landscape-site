const { Resend } = require("resend");

const DEFAULT_TO = "sanchezlandscape512@gmail.com";
const DEFAULT_RECAPTCHA_PROJECT_ID = "sanchez-landscape-492713";
const ENTERPRISE_ACTION = "submit";
const V3_ACTION = "submit";

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

function normalizeSiteKey(raw) {
  let v = String(raw || "").trim();
  if (
    (v.charAt(0) === '"' && v.charAt(v.length - 1) === '"') ||
    (v.charAt(0) === "'" && v.charAt(v.length - 1) === "'")
  ) {
    v = v.slice(1, -1).trim();
  }
  return v || "";
}

function minRiskScoreThreshold() {
  const minRaw = normalizeQuotedEnv(process.env.RECAPTCHA_MIN_SCORE);
  const min = minRaw ? parseFloat(minRaw) : 0.5;
  return Number.isFinite(min) ? min : 0.5;
}

function recaptchaMode() {
  const hasEnterprise = !!normalizeQuotedEnv(process.env.RECAPTCHA_API_KEY);
  const hasV3 = !!normalizeQuotedEnv(process.env.RECAPTCHA_SECRET_KEY);
  if (hasEnterprise) return "enterprise";
  if (hasV3) return "v3";
  return "none";
}

/**
 * reCAPTCHA Enterprise — Create Assessment
 * https://cloud.google.com/recaptcha-enterprise/docs/create-assessment
 */
async function verifyRecaptchaEnterprise(token, remoteip) {
  const googleApiKey = normalizeQuotedEnv(process.env.RECAPTCHA_API_KEY);
  const projectId = normalizeQuotedEnv(
    process.env.RECAPTCHA_PROJECT_ID || DEFAULT_RECAPTCHA_PROJECT_ID
  );
  const siteKey = normalizeSiteKey(
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || process.env.RECAPTCHA_SITE_KEY
  );

  if (!googleApiKey) {
    return {
      ok: false,
      error: "Server is not configured. Add RECAPTCHA_API_KEY.",
    };
  }
  if (!siteKey) {
    return {
      ok: false,
      error: "Server is not configured. Add NEXT_PUBLIC_RECAPTCHA_SITE_KEY.",
    };
  }
  if (!token) {
    return { ok: false, error: "Missing security token. Please try again." };
  }

  const url =
    "https://recaptchaenterprise.googleapis.com/v1/projects/" +
    encodeURIComponent(projectId) +
    "/assessments?key=" +
    encodeURIComponent(googleApiKey);

  const event = {
    token: token.trim(),
    siteKey: siteKey,
    expectedAction: ENTERPRISE_ACTION,
  };
  if (remoteip) {
    event.userIpAddress = remoteip;
  }

  let data;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: event }),
    });
    data = await r.json();
    if (!r.ok) {
      const apiMsg =
        data &&
        data.error &&
        data.error.message
          ? String(data.error.message)
          : "Assessment request failed";
      console.error("reCAPTCHA Enterprise API error:", r.status, apiMsg);
      return {
        ok: false,
        error: "Could not verify submission. Try again in a moment.",
      };
    }
  } catch (e) {
    console.error("reCAPTCHA Enterprise fetch error:", e);
    return {
      ok: false,
      error: "Could not verify submission. Try again in a moment.",
    };
  }

  const props = data.tokenProperties;
  if (!props || props.valid !== true) {
    return {
      ok: false,
      error: "reCAPTCHA verification failed. Please try again.",
    };
  }
  if (props.action && String(props.action) !== ENTERPRISE_ACTION) {
    return {
      ok: false,
      error: "reCAPTCHA verification failed. Please try again.",
    };
  }

  const score =
    data.riskAnalysis && typeof data.riskAnalysis.score === "number"
      ? data.riskAnalysis.score
      : null;
  const threshold = minRiskScoreThreshold();
  if (score === null || score <= threshold) {
    return {
      ok: false,
      error: "Unable to verify submission. Please try again or call us.",
    };
  }

  return { ok: true };
}

/**
 * Classic reCAPTCHA v3 — siteverify
 * https://developers.google.com/recaptcha/docs/verify
 */
async function verifyRecaptchaV3(token, remoteip) {
  const secret = normalizeQuotedEnv(process.env.RECAPTCHA_SECRET_KEY);
  if (!secret) {
    return {
      ok: false,
      error: "Server is not configured. Add RECAPTCHA_SECRET_KEY.",
    };
  }
  if (!token) {
    return { ok: false, error: "Missing security token. Please try again." };
  }

  const params = new URLSearchParams();
  params.set("secret", secret);
  params.set("response", token);
  if (remoteip) params.set("remoteip", remoteip);

  let data;
  try {
    const r = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    data = await r.json();
  } catch (e) {
    console.error("reCAPTCHA v3 siteverify error:", e);
    return {
      ok: false,
      error: "Could not verify submission. Try again in a moment.",
    };
  }

  if (!data || data.success !== true) {
    return {
      ok: false,
      error: "reCAPTCHA verification failed. Please try again.",
    };
  }

  if (data.action && String(data.action) !== V3_ACTION) {
    return {
      ok: false,
      error: "reCAPTCHA verification failed. Please try again.",
    };
  }

  const score = typeof data.score === "number" ? data.score : null;
  const threshold = minRiskScoreThreshold();
  if (score === null || score <= threshold) {
    return {
      ok: false,
      error: "Unable to verify submission. Please try again or call us.",
    };
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

  const mode = recaptchaMode();
  if (mode === "enterprise") {
    const captcha = await verifyRecaptchaEnterprise(
      recaptchaToken,
      clientIp(req)
    );
    if (!captcha.ok) {
      const status =
        captcha.error &&
        captcha.error.indexOf("Server is not configured") === 0
          ? 500
          : 400;
      return res.status(status).json({ ok: false, error: captcha.error });
    }
  } else if (mode === "v3") {
    const captcha = await verifyRecaptchaV3(recaptchaToken, clientIp(req));
    if (!captcha.ok) {
      const status =
        captcha.error &&
        captcha.error.indexOf("Server is not configured") === 0
          ? 500
          : 400;
      return res.status(status).json({ ok: false, error: captcha.error });
    }
  }

  const formType = body.formType === "contact" ? "contact" : "quote";
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
