module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ siteKey: null });
  }

  const siteKey = String(process.env.RECAPTCHA_SITE_KEY || "").trim();
  return res.status(200).json({ siteKey: siteKey || null });
};
