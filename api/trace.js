export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { imageBase64, mediaType } = req.body;
    if (!imageBase64 || !mediaType) return res.status(400).json({ error: "Missing image data" });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "API key not configured" });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 768,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: imageBase64 },
              },
              {
                type: "text",
                // ✅ FIX 3: Improved prompt — now accounts for scroll saw cuttability:
                // bridge widths, isolated islands, noise reduction, and SVG-readiness.
                text: `You are an expert scroll saw pattern designer. Analyse this image for conversion into a cuttable scroll saw pattern.

A good scroll saw pattern must:
- Have CLEAN, BOLD outlines — no fuzzy or noisy edges
- Have no fully isolated "islands" of black that would fall out when cut (they need a bridge to the main piece)
- Have minimum feature width of ~3mm at printed size (thin lines will snap)
- Work as a VECTOR (SVG path) outline, not a raster bitmap

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "threshold": <integer 40-220, brightness cutoff to best isolate the main subject cleanly>,
  "contrast": <integer 0-150, contrast boost needed — use higher values (80-150) for photos, lower for silhouettes>,
  "blur": <integer 0-4, pre-threshold blur to reduce noise — use 2-3 for photos, 0-1 for clean vector art>,
  "invert": <boolean, true only if subject is DARKER than background>,
  "simplify": <float 0.5-4.0, SVG path simplification tolerance — higher = smoother cleaner paths, lower = more detail>,
  "minIslandArea": <integer 100-2000, minimum pixel area for a shape to be kept — removes noisy specks>,
  "subjectType": <"portrait"|"animal"|"silhouette"|"object"|"landscape">,
  "cuttabilityScore": <integer 1-10, how suitable this image is for scroll saw cutting — 10 = perfect silhouette, 1 = very complex photo>,
  "tips": <2-3 sentences of specific advice: what to watch for, whether bridges will be needed, and any problematic areas in this specific image>
}`
              }
            ]
          }
        ]
      })
    });

    const responseText = await response.text();
    if (!response.ok) {
      return res.status(500).json({ error: `Anthropic error ${response.status}`, detail: responseText.slice(0, 200) });
    }

    const data = JSON.parse(responseText);
    const rawText = data.content?.[0]?.text?.trim() ?? "";
    const jsonText = rawText.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

    let settings;
    try {
      settings = JSON.parse(jsonText);
    } catch (e) {
      return res.status(500).json({ error: "Could not parse settings from Claude", detail: jsonText.slice(0, 100) });
    }

    return res.status(200).json({ settings });

  } catch (e) {
    return res.status(500).json({ error: e.message || "Unknown server error" });
  }
}
