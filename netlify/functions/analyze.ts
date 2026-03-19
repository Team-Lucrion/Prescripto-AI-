import { GoogleGenAI, Type } from "@google/genai";
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Gemini API key not configured." }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const schema = {
      type: Type.OBJECT,
      properties: {
        documentType: { type: Type.STRING },
        summary: { type: Type.STRING },
        simplifiedTerms: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              jargon: { type: Type.STRING },
              meaning: { type: Type.STRING },
              importance: { type: Type.STRING },
            },
            required: ["jargon", "meaning", "importance"],
          },
        },
        criticalFindings: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              issue: { type: Type.STRING },
              description: { type: Type.STRING },
              action: { type: Type.STRING },
            },
            required: ["issue", "description", "action"],
          },
        },
        genericAlternatives: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              brandedName: { type: Type.STRING },
              genericName: { type: Type.STRING },
              approxBrandedPrice: { type: Type.STRING },
              approxGenericPrice: { type: Type.STRING },
              savingsPercentage: { type: Type.STRING },
            },
            required: [
              "brandedName",
              "genericName",
              "approxBrandedPrice",
              "approxGenericPrice",
              "savingsPercentage",
            ],
          },
        },
        costInsights: {
          type: Type.OBJECT,
          properties: {
            procedureName: { type: Type.STRING },
            billedAmount: { type: Type.STRING },
            expectedRange: {
              type: Type.OBJECT,
              properties: {
                privateLow: { type: Type.STRING },
                privateHigh: { type: Type.STRING },
                government: { type: Type.STRING },
              },
              required: ["privateLow", "privateHigh", "government"],
            },
            isOvercharged: { type: Type.BOOLEAN },
            tierComparison: { type: Type.STRING },
          },
          required: [
            "procedureName",
            "billedAmount",
            "expectedRange",
            "isOvercharged",
            "tierComparison",
          ],
        },
        nextSteps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: [
        "documentType",
        "summary",
        "simplifiedTerms",
        "criticalFindings",
        "nextSteps",
      ],
    };

    const systemInstruction = `You are an expert medical document analyst for the Indian healthcare system.
Simplify medical documents (prescriptions, bills, lab reports) for patients.
Explain jargon simply. Identify potential overcharging in bills.
Suggest generic Indian alternatives (Jan Aushadhi) for branded medicines like Crocin, Dolo, Augmentin, Combiflam.
Always use ₹ for costs. Be empathetic and professional.
${
  mode === "pro"
    ? "Provide detailed cost benchmarking, drug interactions, and comprehensive savings analysis."
    : "Provide basic medicine explanations and key findings."
}`;

    const modelName =
      mode === "pro" ? "gemini-2.5-flash-preview-05-20" : "gemini-2.0-flash";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Analyze the following medical text:\n\n${extractedText}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema as any,
        temperature: 0.1,
      },
    });

    if (!response.text) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "No response from AI model." }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: response.text,
    };
  } catch (error) {
    console.error("Gemini Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : "AI analysis failed.",
      }),
    };
  }
};
