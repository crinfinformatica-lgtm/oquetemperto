import { GoogleGenAI, Type } from "@google/genai";

// Inicializa a IA usando a variável de ambiente conforme padrão seguro
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Identifies the best category and sub-category for a user's search term.
 * Used to map terms like "pão" to "Padaria" to find REAL users in the DB.
 */
export const identifyServiceCategory = async (searchTerm: string): Promise<{ categoryId: string, subCategory: string }> => {
  // If search term is empty, return a generic "Nearby" category
  if (!searchTerm.trim()) {
    return { categoryId: 'outros', subCategory: 'Destaques Próximos' };
  }

  // Se não tiver chave configurada no ambiente
  if (!process.env.API_KEY) {
     console.warn("Gemini API Key não configurada (process.env.API_KEY). Usando busca simples.");
     return { categoryId: 'outros', subCategory: searchTerm };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `User search: "${searchTerm}". Map this to one of the following category IDs: 
      [alimentacao, comercio, reformas, domesticos, assistencia, eventos, moda, autos, aulas, outros].
      
      This app is for finding SERVICES or LOCAL BUSINESSES (shops, restaurants).
      
      Also provide a specific sub-category (e.g., "Pizzaria", "Farmácia", "Eletricista", "Loja de Roupas").`,
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

    let text = response.text;
    if (text) {
      // Clean up markdown code blocks if present (just in case model sends markdown)
      return JSON.parse(text);
    }
    return { categoryId: 'outros', subCategory: searchTerm };
  } catch (error) {
    console.error("Gemini classification error:", error);
    return { categoryId: 'outros', subCategory: searchTerm };
  }
};