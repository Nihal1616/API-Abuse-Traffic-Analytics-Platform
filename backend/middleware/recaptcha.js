const https = require("https");

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET || "";
const MIN_SCORE = parseFloat(process.env.RECAPTCHA_MIN_SCORE || "0.5");

function verifyToken(token) {
  return new Promise((resolve, reject) => {
    if (!RECAPTCHA_SECRET)
      return reject(new Error("RECAPTCHA_SECRET not configured"));
    const postData = new URLSearchParams({
      secret: RECAPTCHA_SECRET,
      response: token,
    }).toString();

    const options = {
      hostname: "www.google.com",
      path: "/recaptcha/api/siteverify",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

async function recaptchaMiddleware(req, res, next) {
  // Allow exempt routes via env var (comma-separated regexes)
  const exempt = process.env.RECAPTCHA_EXEMPT_ROUTES || "";
  if (exempt) {
    try {
      const parts = exempt
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const p of parts) {
        const rx = new RegExp(p);
        if (rx.test(req.originalUrl || req.url)) return next();
      }
    } catch (e) {
      // malformed regex - ignore
    }
  }

  const token =
    (req.body && req.body.recaptchaToken) ||
    req.headers["x-recaptcha-token"] ||
    req.query.recaptchaToken;
  if (!token) return res.status(403).json({ error: "reCAPTCHA token missing" });

  try {
    const result = await verifyToken(token);
    if (!result || !result.success) {
      return res.status(403).json({ error: "reCAPTCHA verification failed" });
    }

    // If v3, check score threshold
    if (typeof result.score === "number") {
      if (result.score < MIN_SCORE) {
        return res.status(403).json({ error: "reCAPTCHA score too low" });
      }
    }

    // Passed
    next();
  } catch (err) {
    console.error("recaptcha verify error:", err.message || err);
    return res.status(500).json({ error: "reCAPTCHA verification error" });
  }
}

module.exports = recaptchaMiddleware;
