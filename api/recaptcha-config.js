/**
 * Tells the browser which reCAPTCHA loader to use and exposes the public site key.
 * Precedence (when site key is set):
 * 1) Classic v3 — RECAPTCHA_SECRET_KEY (api.js + siteverify; simpler)
 * 2) Enterprise — RECAPTCHA_API_KEY (enterprise.js + Create Assessment)
 * If you only want v3, you can delete RECAPTCHA_API_KEY from Vercel to avoid confusion.
 */
module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  function trimEnv(name) {
    return String(process.env[name] || "").trim();
  }

  const siteKey =
    trimEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY") || trimEnv("RECAPTCHA_SITE_KEY");
  const hasEnterprise = !!trimEnv("RECAPTCHA_API_KEY");
  const hasV3Secret = !!trimEnv("RECAPTCHA_SECRET_KEY");

  let mode = "none";
  if (siteKey && hasV3Secret) {
    mode = "v3";
  } else if (siteKey && hasEnterprise) {
    mode = "enterprise";
  }

  return res.status(200).json({
    siteKey: mode === "none" ? "" : siteKey,
    mode: mode,
  });
};
