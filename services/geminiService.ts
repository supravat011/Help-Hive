import { GoogleGenAI, Type } from "@google/genai";
import { HelpType, UrgencyLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface AnalysisResult {
  title: string;
  urgency: UrgencyLevel;
  suggestedType: HelpType;
  summary: string;
}

export const analyzeEmergencyInput = async (userInput: string): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following emergency request text and extract structured data. 
      Input: "${userInput}"
      
      Determine:
      1. A clear, short title (max 5 words).
      2. Urgency Level (HIGH, MEDIUM, LOW). HIGH is for life safety/immediate medical/danger.
      3. Help Type (Medical Assistance, Emergency Transport, Shelter & Safety, Food & Supplies, Other).
      4. A cleaned up summary description.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            urgency: { type: Type.STRING, enum: [UrgencyLevel.HIGH, UrgencyLevel.MEDIUM, UrgencyLevel.LOW] },
            suggestedType: { type: Type.STRING, enum: [HelpType.MEDICAL, HelpType.TRANSPORT, HelpType.SHELTER, HelpType.SUPPLIES, HelpType.OTHER] },
            summary: { type: Type.STRING }
          },
          required: ["title", "urgency", "suggestedType", "summary"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed", error);
    // Fallback if AI fails
    return {
      title: "Emergency Assistance Needed",
      urgency: UrgencyLevel.HIGH,
      suggestedType: HelpType.OTHER,
      summary: userInput
    };
  }
};
