
import { GoogleGenAI, Type } from "@google/genai";
import { MedicalAnalysis } from "../types.ts";

const ANALYSIS_SCHEMA = {
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
          importance: { type: Type.STRING }
        }
      }
    },
    criticalFindings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          issue: { type: Type.STRING },
          description: { type: Type.STRING },
          action: { type: Type.STRING }
        }
      }
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
          savingsPercentage: { type: Type.STRING }
        }
      }
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
            government: { type: Type.STRING }
          }
        },
        isOvercharged: { type: Type.BOOLEAN },
        tierComparison: { type: Type.STRING }
      },
      required: ['procedureName', 'expectedRange', 'isOvercharged', 'tierComparison']
    },
    nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ['documentType', 'summary', 'simplifiedTerms', 'criticalFindings', 'nextSteps']
};

export const analyzeMedicalDocument = async (
  base64Data: string,
  mimeType: string,
  cityTier: string = 'Tier-1'
): Promise<MedicalAnalysis> => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please ensure GEMINI_API_KEY is set in your environment variables.");
  }

  try {
    // CRITICAL: New instance before call ensures latest credentials
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: `Perform a high-precision OCR and medical analysis on this document. 
            Context: Patient is in a ${cityTier} city in India.
            
            Tasks:
            1. Document Identification: Determine if this is a Prescription, Hospital Bill, Lab Report, or Insurance Document.
            2. Jargon Decoding: Extract complex medical terms (handwritten or printed) and explain them in simple, non-medical English.
            3. Prescription Analysis: If medicines are listed, identify BRANDED drugs. Suggest Jan Aushadhi (Generic) equivalents. Provide estimated price comparisons in INR (₹) based on current Indian market trends.
            4. Bill Benchmarking: If it's a bill, compare costs against standard ${cityTier} averages. 
               Reference benchmarks for ${cityTier}: 
               - Consultation: ₹500-1500
               - Room Rent (Private): ₹5k-12k/day
               - C-Section: ₹60k-1.2L
               - Cataract: ₹25k-50k
            5. Anomaly Detection: Flag any hidden charges, excessive "service fees", or duplicate billing entries.
            6. Action Plan: Provide 3-5 clear, actionable next steps for the patient.
            
            Constraint: ALWAYS include the medical disclaimer. Output must be valid JSON matching the schema.`
          }
        ]
      },
      config: {
        systemInstruction: "You are an expert Indian Medical Consultant specializing in simplifying complex medical documents for patients. You provide accurate, empathetic, and actionable insights while strictly adhering to the requested JSON format.",
        responseMimeType: 'application/json',
        responseSchema: ANALYSIS_SCHEMA,
      }
    });

    const text = response.text;
    if (!text) {
      console.error('Gemini response text is empty');
      throw new Error("No analysis generated from the document.");
    }
    
    try {
      return JSON.parse(text) as MedicalAnalysis;
    } catch {
      console.error('Failed to parse Gemini JSON:', text);
      throw new Error("The analysis result was invalid. Please try again.");
    }
  } catch (err) {
    console.error('Gemini Analysis Error:', err);
    throw err;
  }
};
