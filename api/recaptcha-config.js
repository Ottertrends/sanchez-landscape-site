/**
 * Tells the browser which reCAPTCHA loader to use and exposes the public site key.
 * - Enterprise: RECAPTCHA_API_KEY + NEXT_PUBLIC_RECAPTCHA_SITE_KEY (or RECAPTCHA_SITE_KEY)
 * - Classic v3: RECAPTCHA_SECRET_KEY + site key (same public key as in Google admin)
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
  if (siteKey && hasEnterprise) {
    mode = "enterprise";
  } else if (siteKey && hasV3Secret) {
    mode = "v3";
  }

  return res.status(200).json({
    siteKey: mode === "none" ? "" : siteKey,
    mode: mode,
  });
};
