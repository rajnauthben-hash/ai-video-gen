const HF_TOKEN = process.env.HF_TOKEN || "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";
const HF_URL = "https://api-inference.huggingface.co/models/ali-vilab/text-to-video-ms-1.7b";

export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt } = req.body || {};
  if (!prompt?.trim()) return res.status(400).json({ error: "Prompt is required" });

  const hfRes = await fetch(HF_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
      "x-wait-for-model": "true",
    },
    body: JSON.stringify({ inputs: prompt }),
  });

  if (hfRes.status === 503) {
    const json = await hfRes.json().catch(() => ({}));
    return res.status(503).json({ error: "Model loading", estimated_time: json.estimated_time || 20 });
  }

  if (!hfRes.ok) {
    const ct = hfRes.headers.get("content-type") || "";
    const body = ct.includes("json") ? await hfRes.json().catch(() => ({})) : await hfRes.text();
    return res.status(hfRes.status).json({ error: body?.error || String(body).slice(0, 200) });
  }

  const buffer = await hfRes.arrayBuffer();
  if (buffer.byteLength === 0) return res.status(500).json({ error: "Model returned empty response" });

  const contentType = hfRes.headers.get("content-type") || "video/mp4";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", buffer.byteLength);
  return res.send(Buffer.from(buffer));
}
