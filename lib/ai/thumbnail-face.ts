type FaceDetectionResult = {
  hasFace: boolean;
  confidence: number;
};

const detectionCache = new Map<string, FaceDetectionResult>();

export async function detectFaceInThumbnail(
  thumbnailUrl: string | null,
): Promise<FaceDetectionResult | null> {
  if (!thumbnailUrl) {
    return null;
  }

  if (detectionCache.has(thumbnailUrl)) {
    return detectionCache.get(thumbnailUrl)!;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Determine whether the image thumbnail clearly contains a human face. Respond with strict JSON only.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: 'Return JSON exactly in this shape: {"hasFace": boolean, "confidence": number}.',
            },
            {
              type: "input_image",
              image_url: thumbnailUrl,
            },
          ],
        },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    output_text?: string;
  };

  try {
    const parsed = JSON.parse(payload.output_text ?? "") as FaceDetectionResult;
    if (typeof parsed.hasFace === "boolean" && typeof parsed.confidence === "number") {
      detectionCache.set(thumbnailUrl, parsed);
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}
