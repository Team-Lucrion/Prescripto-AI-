// services/geminiService.ts

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// --------------------
// 🔹 PROMPTS
// --------------------

const BASIC_PROMPT = `
You are a medical assistant AI.

Analyze the prescription and explain it simply.

Return JSON:
{
  "summary": "",
  "medicines": [
    {
      "name": "",
      "purpose": "",
      "dosage": ""
    }
  ],
  "investigations": [],
  "notes": []
}

Rules:
- Keep it simple
- Do not guess unclear text
`;

const PRO_PROMPT = `
You are an advanced medical AI focused on saving money and identifying risks.

Analyze deeply.

Return JSON:
{
  "summary": "",
  "medicines": [
    {
      "name": "",
      "purpose": "",
      "dosage": "",
      "estimatedCostINR": "",
      "genericAlternative": "",
      "costSavingPotential": ""
    }
  ],
  "costAnalysis": {
    "totalEstimatedCost": "",
    "possibleSavings": "",
    "insight": ""
  },
  "safetyWarnings": [],
  "criticalFindings": [],
  "nextSteps": []
}

Focus on:
- cost savings
- safety risks
- better alternatives
`;

// --------------------
// 🔹 UTIL: FILE → BASE64
// --------------------

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // remove prefix
    };
    reader.onerror = error => reject(error);
  });
}

// --------------------
// 🔁 RETRY LOGIC (Fix 429)
// --------------------

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 2000
): Promise<Response> {
  try {
    const res = await fetch(url, options);

    if (res.status === 429 && retries > 0) {
      console.warn(`429 hit. Retrying in ${delay}ms...`);
      await new Promise(res => setTimeout(res, delay));
      return fetchWithRetry(url, options, retries - 1, delay + 1000);
    }

    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise(res => setTimeout(res, delay));
      return fetchWithRetry(url, options, retries - 1, delay + 1000);
    }
    throw err;
  }
}

// --------------------
// 🧠 MAIN FUNCTION
// --------------------

export async function analyzeMedicalDocument(
  file: File,
  mode: "basic" | "pro"
) {
  console.log("Analysis mode:", mode);

  try {
    const base64Image = await fileToBase64(file);

    const prompt = mode === "pro" ? PRO_PROMPT : BASIC_PROMPT;

    // 🔥 Model selection (reduces 429)
    const model =
      mode === "pro"
        ? "gemini-1.5-pro"
        : "gemini-1.5-flash";

    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: file.type,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Invalid response from Gemini");
    }

    // Try parsing JSON safely
    try {
      return JSON.parse(text);
    } catch {
      console.warn("Response not pure JSON, returning raw text");
      return { raw: text };
    }

  } catch (error) {
    console.error("Gemini Service Error:", error);

    return {
      error: true,
      message: "Failed to analyze prescription. Please try again."
    };
  }
}
