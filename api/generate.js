const HF_TOKEN = process.env.HF_TOKEN || "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";

// zeroscope_v2_576w is smaller and reliably hosted on HF free inference API
const HF_URL = "https://api-inference.huggingface.co/models/cerspense/zeroscope_v2_576w";

export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt } = req.body || {};
  if (!prompt?.trim()) return res.status(400).json({ error: "Prompt is required" });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 250_000); // 250s hard timeout

    let hfRes;
    try {
      hfRes = await fetch(HF_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
          "x-wait-for-model": "true",
        },
        body: JSON.stringify({ inputs: prompt }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (hfRes.status === 503) {
      const json = await hfRes.json().catch(() => ({}));
      return res.status(503).json({ error: "Model loading", estimated_time: json.estimated_time || 20 });
    }

    if (!hfRes.ok) {
      const ct = hfRes.headers.get("content-type") || "";
      let errMsg;
      if (ct.includes("json")) {
        const json = await hfRes.json().catch(() => ({}));
        errMsg = json.error || json.message || `HF API error ${hfRes.status}`;
      } else {
        const txt = await hfRes.text().catch(() => "");
        errMsg = txt.slice(0, 300) || `HF API error ${hfRes.status}`;
      }
      return res.status(hfRes.status).json({ error: errMsg });
    }

    const buffer = await hfRes.arrayBuffer();
    if (buffer.byteLength === 0) {
      return res.status(500).json({ error: "Model returned an empty file — please try again" });
    }

    const contentType = hfRes.headers.get("content-type") || "video/mp4";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", buffer.byteLength);
    return res.send(Buffer.from(buffer));

  } catch (err) {
    const msg = err.name === "AbortError"
      ? "Request timed out after 250s — model may be overloaded, please retry"
      : err.message || "Unexpected server error";
    return res.status(500).json({ error: msg });
  }
}
