
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Identifies the best category and sub-category for a user's search term.
 * Used to map terms like "pão" to "Padaria" to find REAL users in the DB.
 */
export const identifyServiceCategory = async (searchTerm: string): Promise<{ categoryId: string, subCategory: string }> => {
  if (!searchTerm.trim()) {
    return { categoryId: 'outros', subCategory: 'Destaques Próximos' };
  }

  /**
   * CRITICAL: The API key must be obtained exclusively from the environment variable process.env.API_KEY.
   * As per instructions, this is pre-configured and accessible.
   */
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      // Using gemini-3-flash-preview for text categorization tasks
      model: 'gemini-3-flash-preview',
      contents: `User search: "${searchTerm}". Map this to one of the following category IDs: 
      [alimentacao, comercio, reformas, domesticos, assistencia, eventos, moda, autos, aulas, outros].
      
      This app is for finding SERVICES or LOCAL BUSINESSES (shops, restaurants).
      
      Also provide a specific sub-category in Portuguese (e.g., "Pizzaria", "Farmácia", "Eletricista").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categoryId: { type: Type.STRING },
            subCategory: { type: Type.STRING },
          },
          required: ["categoryId", "subCategory"],
        },
      },
    });

    // Directly access the .text property (not a method) as per guidelines
    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return { categoryId: 'outros', subCategory: searchTerm };
  } catch (error) {
    console.error("Gemini classification error:", error);
    // Fallback if AI fails or key is invalid
    return { categoryId: 'outros', subCategory: searchTerm };
  }
};
