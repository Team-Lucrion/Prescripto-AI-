import { Handler, HandlerEvent } from "@netlify/functions";

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { extractedText, mode } = JSON.parse(event.body || "{}") as {
      extractedText: string;
      mode: "basic" | "pro";
    };

    if (!extractedText || extractedText.length < 10) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Text too short or missing." }),
      };
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Groq API key not configured on server." }),
      };
    }

    const systemPrompt = `You are an expert medical document analyst for the Indian healthcare system.
Simplify medical documents (prescriptions, bills, lab reports) for patients.
Explain jargon simply. Identify potential overcharging in bills.
Suggest generic Indian alternatives (Jan Aushadhi) for branded medicines like Crocin, Dolo, Augmentin, Combiflam, Zincovit, Shelcal, Ecosprin.
Always use Rs. for costs. Be empathetic and professional.
${mode === "pro"
  ? "Provide detailed cost benchmarking, drug interactions, and comprehensive savings analysis."
  : "Provide basic medicine explanations and key findings."
}

You MUST respond with ONLY valid JSON matching this exact structure, no extra text:
{
  "documentType": "PRESCRIPTION or HOSPITAL_BILL or LAB_REPORT or INSURANCE_REJECTION",
  "summary": "brief summary string",
  "simplifiedTerms": [
    { "jargon": "string", "meaning": "string", "importance": "string" }
  ],
  "criticalFindings": [
    { "issue": "string", "description": "string", "action": "string" }
  ],
  "genericAlternatives": [
    { "brandedName": "string", "genericName": "string", "approxBrandedPrice": "string", "approxGenericPrice": "string", "savingsPercentage": "string" }
  ],
  "costInsights": {
    "procedureName": "string",
    "billedAmount": "string",
    "expectedRange": { "privateLow": "string", "privateHigh": "string", "government": "string" },
    "isOvercharged": true,
    "tierComparison": "string"
  },
  "nextSteps": ["string"]
}
Only include genericAlternatives if it is a prescription.
Only include costInsights if it is a hospital bill.
Both fields are optional - omit them if not relevant.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this medical document text:\n\n${extractedText}` },
        ],
        temperature: 0.1,
        max_tokens: 2048,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Groq API error:", err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: err.error?.message || "Groq API request failed." }),
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "No response from AI model." }),
      };
    }

    const result = JSON.parse(content);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Analyze function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : "Analysis failed.",
      }),
    };
  }
};
