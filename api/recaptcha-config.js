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

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ siteKey: null });
  }

  const siteKey = normalizeSiteKey(
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || process.env.RECAPTCHA_SITE_KEY
  );
  return res.status(200).json({ siteKey: siteKey || null });
};
