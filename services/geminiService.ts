
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types";

// Always initialize GoogleGenAI with process.env.API_KEY directly
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface PlaceInfoResponse {
  text: string;
  sources?: { title: string; uri: string }[];
}

export const getPlaceInfo = async (placeName: string, placeType: string): Promise<PlaceInfoResponse> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are a mobile app assistant for "SmartInfoQueue". Provide clear, visitor-friendly information about "${placeName}" (Type: ${placeType}). 
    
Follow this structure:
1. Purpose: What is the main goal of this place?
2. Services: What are the 3-4 most common services or activities here?
3. Tips & Rules: What are basic rules or helpful advice for visitors waiting here?

Rules:
- Use simple language, avoid technical jargon.
- Keep it concise (max 200 words).
- Use friendly markdown with clear headings.`,
    config: {
      temperature: 0.4,
      tools: [{ googleSearch: {} }]
    }
  });

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.filter(chunk => chunk.web)
    .map(chunk => ({
      title: chunk.web?.title || 'Source',
      uri: chunk.web?.uri || ''
    })) || [];

  return {
    text: response.text || "No information available for this location.",
    sources
  };
};

export const generateQuiz = async (placeName: string, placeType: string): Promise<QuizQuestion[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a 5-question interactive quiz for visitors waiting at "${placeName}" (${placeType}). 
    
Requirements:
- Mix multiple-choice and true/false questions.
- For multiple-choice questions, provide exactly 4 options.
- For true/false questions, provide exactly 2 options ("True", "False").
- Each question must be educational, lighthearted, and relevant to this type of place.
- Provide a brief explanation for why the answer is correct.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            type: { type: Type.STRING, description: 'must be "multiple-choice" or "true-false"' }
          },
          required: ["question", "options", "answer", "explanation", "type"]
        }
      }
    }
  });

  try {
    // Access response.text property directly
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse quiz JSON", e);
    return [];
  }
};

export const chatWithAI = async (
  message: string, 
  context: string, 
  history: { role: 'user' | 'model', text: string }[],
  useDeepThinking: boolean = false
): Promise<string> => {
  const ai = getAI();
  const model = useDeepThinking ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const config: any = {
    systemInstruction: `You are the SmartInfoQueue assistant. You help people waiting at "${context}". Be extremely friendly, helpful, and concise. Use simple language and avoid jargon.`,
  };

  // Configure thinking budget for Gemini 3 series models
  if (useDeepThinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  // Pass conversation history and current message to the model
  const response = await ai.models.generateContent({
    model,
    contents: [
      ...history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
      { role: 'user', parts: [{ text: message }] }
    ],
    config
  });

  // Extract text from GenerateContentResponse using the .text property
  return response.text || "I'm sorry, I couldn't process that request.";
};
