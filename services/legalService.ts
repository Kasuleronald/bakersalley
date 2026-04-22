import { GoogleGenAI } from "@google/genai";
import { TaxConfig, LegalPatch } from "../types";

/**
 * Identify the nation based on geolocation coordinates
 */
export const identifyNation = async (lat: number, lng: number): Promise<string> => {
  try {
    // Fix: Client initialized inside the function scope
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a geolocation specialist. Based on coordinates ${lat}, ${lng}, identify the country name. Return only the country name, nothing else.`
    });
    return response.text?.trim() || "Uganda";
  } catch (e) {
    return "Uganda";
  }
};

/**
 * Scrape current legal updates for a specific nation
 */
export const checkForNationalLegalUpdates = async (taxConfig: TaxConfig): Promise<LegalPatch | null> => {
  if (!taxConfig.nation || !taxConfig.autoUpdateLegal) return null;

  try {
    // Fix: Client initialized inside the function scope
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `
      You are an expert industrial legal auditor specialized in manufacturing and food safety laws for ${taxConfig.nation}.
      
      TASK:
      1. Check for recent (last 12 months) changes in:
         - VAT laws for bread/food manufacturing.
         - Minimum wage or NSSF/PAYE statutory deductions.
         - Consumer protection (Weights and Measures) or Labelling acts.
         - Data privacy updates.
      
      2. If new regulations are found, formulate them as "Legal Clauses" to be injected into an ERP system.
      
      Return as strictly valid JSON:
      {
        "id": "patch-${Date.now()}",
        "nation": "${taxConfig.nation}",
        "summary": "High-level summary of legal shifts found.",
        "newClauses": [
          {
            "id": "string (clause ref)",
            "title": "string",
            "desc": "string (the legal requirement)",
            "evidenceType": "string (how the user proves compliance)",
            "effectiveDate": "YYYY-MM-DD"
          }
        ]
      }
      If no significant changes are found, return { "id": "none", "newClauses": [] }.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const data = JSON.parse(response.text || '{}');
    if (data.id === 'none' || data.newClauses.length === 0) return null;

    return {
      ...data,
      dateDetected: new Date().toISOString(),
      status: 'Pending'
    };
  } catch (e) {
    console.error("Legal Sync Failure:", e);
    return null;
  }
};